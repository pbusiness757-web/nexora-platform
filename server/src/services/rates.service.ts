/// <reference types="node" />

// ─── Fiat payout currencies (fiat units per 1 USDT) ────────────────────────
const PAYOUT_CURRENCIES = ["RUB", "KZT", "UZS", "AZN", "KGS"] as const;
type PayoutCurrency = (typeof PAYOUT_CURRENCIES)[number];

const FALLBACK_FIAT: Record<PayoutCurrency, number> = {
  RUB: 92.4,
  KZT: 478.5,
  UZS: 12650,
  AZN: 1.7,
  KGS: 89.2,
};

// ─── Crypto assets that need USDT conversion ───────────────────────────────
const VOLATILE_ASSETS = ["BTC", "ETH", "LTC", "TRX", "TON"] as const;
type VolatileAsset = (typeof VOLATILE_ASSETS)[number];

// Stablecoins treated as 1 USDT
const STABLE_ASSETS = new Set(["USDT", "USDC"]);

const FALLBACK_CRYPTO: Record<VolatileAsset, number> = {
  BTC: 97000,
  ETH: 3400,
  LTC: 100,
  TRX: 0.28,
  TON: 5.5,
};

// ─── Cache TTL: 5 minutes ──────────────────────────────────────────────────
const TTL_MS =
  Number(process.env.RATES_CACHE_TTL_MS || process.env.RATES_TTL_MS) ||
  5 * 60 * 1000;

// ─── Optional custom fiat-rate provider ───────────────────────────────────
const PROVIDER_URL = process.env.RATES_PROVIDER_URL;

// Free public API — no key needed, covers CIS currencies + crypto tickers.
const FAWAZ = (ticker: string) =>
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${ticker}.json`;
const FAWAZ_MIRROR = (ticker: string) =>
  `https://latest.currency-api.pages.dev/v1/currencies/${ticker}.json`;

// ─── Types ────────────────────────────────────────────────────────────────
type FiatRates = Record<PayoutCurrency, number>;
type CryptoPrices = Record<VolatileAsset, number>; // price of 1 unit in USDT

type RatesSnapshot = {
  base: "USDT";
  rates: FiatRates;
  cryptoPrices: CryptoPrices;
  source: "live" | "fallback";
  updatedAt: string;
};

// ─── Caches ────────────────────────────────────────────────────────────────
let fiatCache:   { data: RatesSnapshot; expiresAt: number } | null = null;

// ─── Fiat rate helpers ─────────────────────────────────────────────────────

async function fetchCustomProvider(): Promise<FiatRates | null> {
  if (!PROVIDER_URL) return null;
  try {
    const res = await fetch(PROVIDER_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number> };
    return extractFiatRates(json.rates ?? null);
  } catch { return null; }
}

async function fetchFawazFiat(url: string): Promise<FiatRates | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { usdt?: Record<string, number> };
    if (!json?.usdt) return null;
    const lowered: Record<string, number> = {};
    for (const cur of PAYOUT_CURRENCIES) lowered[cur] = json.usdt[cur.toLowerCase()];
    return extractFiatRates(lowered);
  } catch { return null; }
}

function extractFiatRates(incoming: Record<string, number> | null): FiatRates | null {
  if (!incoming) return null;
  const result = {} as FiatRates;
  for (const cur of PAYOUT_CURRENCIES) {
    const value = incoming[cur];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
    result[cur] = value;
  }
  return result;
}

async function fetchLiveFiatRates(): Promise<FiatRates | null> {
  return (
    (await fetchCustomProvider()) ??
    (await fetchFawazFiat(FAWAZ("usdt"))) ??
    (await fetchFawazFiat(FAWAZ_MIRROR("usdt")))
  );
}

// ─── Crypto price helpers (price of 1 asset unit in USDT) ─────────────────

async function fetchCryptoPriceViaFawaz(asset: VolatileAsset): Promise<number | null> {
  const ticker = asset.toLowerCase();
  const tryUrl = async (url: string): Promise<number | null> => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const json = await res.json() as Record<string, unknown>;
      const inner = json[ticker] as Record<string, number> | undefined;
      const p = inner?.usdt;
      return typeof p === "number" && p > 0 ? p : null;
    } catch { return null; }
  };
  return (await tryUrl(FAWAZ(ticker))) ?? (await tryUrl(FAWAZ_MIRROR(ticker)));
}

async function fetchLiveCryptoPrices(): Promise<CryptoPrices> {
  const results = await Promise.allSettled(
    VOLATILE_ASSETS.map(async (asset) => {
      const price = await fetchCryptoPriceViaFawaz(asset);
      return { asset, price };
    })
  );
  const out = { ...FALLBACK_CRYPTO } as CryptoPrices;
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.price !== null) {
      out[r.value.asset] = r.value.price;
    }
  }
  return out;
}

// ─── Main exported function ────────────────────────────────────────────────

async function getRates(): Promise<RatesSnapshot> {
  const now = Date.now();
  if (fiatCache && fiatCache.expiresAt > now) return fiatCache.data;

  // Fetch fiat + crypto prices in parallel
  const [liveFiat, cryptoPrices] = await Promise.all([
    fetchLiveFiatRates(),
    fetchLiveCryptoPrices(),
  ]);

  const data: RatesSnapshot = {
    base: "USDT",
    rates: liveFiat ?? { ...FALLBACK_FIAT },
    cryptoPrices,
    source: liveFiat ? "live" : "fallback",
    updatedAt: new Date(now).toISOString(),
  };

  fiatCache = { data, expiresAt: now + TTL_MS };
  return data;
}

/**
 * Returns 1 unit of `asset` converted to USDT.
 * Stablecoins (USDT, USDC) → 1.
 * Volatile assets → live price from cache/API.
 */
async function getCryptoToUsdtPrice(asset: string): Promise<number> {
  const upper = asset.toUpperCase();
  if (STABLE_ASSETS.has(upper)) return 1;
  const snap = await getRates();
  return snap.cryptoPrices[upper as VolatileAsset] ?? FALLBACK_CRYPTO[upper as VolatileAsset] ?? 1;
}

async function getPayoutRate(currency: string): Promise<number | null> {
  const snapshot = await getRates();
  const rate = snapshot.rates[currency as PayoutCurrency];
  return typeof rate === "number" ? rate : null;
}

/**
 * Overrides in-memory fiat cache with manually-supplied rates.
 */
function setRates(incoming: Partial<FiatRates>): RatesSnapshot {
  const current = fiatCache?.data.rates ?? { ...FALLBACK_FIAT };
  const merged: FiatRates = { ...current };
  for (const cur of PAYOUT_CURRENCIES) {
    const v = incoming[cur];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) merged[cur] = v;
  }
  const data: RatesSnapshot = {
    base: "USDT",
    rates: merged,
    cryptoPrices: fiatCache?.data.cryptoPrices ?? { ...FALLBACK_CRYPTO },
    source: "fallback",
    updatedAt: new Date().toISOString(),
  };
  fiatCache = { data, expiresAt: Date.now() + TTL_MS };
  return data;
}

export = { getRates, getPayoutRate, getCryptoToUsdtPrice, setRates, PAYOUT_CURRENCIES };
