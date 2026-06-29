/// <reference types="node" />

// Fiat units per 1 USDT. USDT is the MVP base asset.
const PAYOUT_CURRENCIES = ["RUB", "KZT", "UZS", "AZN", "KGS"] as const;
type PayoutCurrency = (typeof PAYOUT_CURRENCIES)[number];

const FALLBACK_RATES: Record<PayoutCurrency, number> = {
  RUB: 92.4,
  KZT: 478.5,
  UZS: 12650,
  AZN: 1.7,
  KGS: 89.2,
};

const TTL_MS =
  Number(process.env.RATES_CACHE_TTL_MS || process.env.RATES_TTL_MS) ||
  30 * 60 * 1000; // 30 min default

// Custom provider takes priority. Format: { rates: { RUB: number, ... } }
const PROVIDER_URL = process.env.RATES_PROVIDER_URL;

// Free public API — no key required, updated daily, covers all CIS currencies.
// Mirror fallback for reliability.
const FAWAZ_PRIMARY = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usdt.json";
const FAWAZ_MIRROR  = "https://latest.currency-api.pages.dev/v1/currencies/usdt.json";

type RatesSnapshot = {
  base: "USDT";
  rates: Record<PayoutCurrency, number>;
  source: "live" | "fallback";
  updatedAt: string;
};

let cache: { data: RatesSnapshot; expiresAt: number } | null = null;

/** Fetch from custom PROVIDER_URL. Expected: { rates: { RUB: number, ... } } */
async function fetchCustomProvider(): Promise<Record<PayoutCurrency, number> | null> {
  if (!PROVIDER_URL) return null;
  try {
    const res = await fetch(PROVIDER_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number> };
    return extractRates(json.rates ?? null);
  } catch {
    return null;
  }
}

/** Fetch from fawazahmed0 CDN. Response: { date, usdt: { rub: number, ... } } */
async function fetchFawaz(url: string): Promise<Record<PayoutCurrency, number> | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { usdt?: Record<string, number> };
    if (!json?.usdt) return null;
    // Keys are lowercase in this API
    const lowered: Record<string, number> = {};
    for (const cur of PAYOUT_CURRENCIES) {
      lowered[cur] = json.usdt[cur.toLowerCase()];
    }
    return extractRates(lowered);
  } catch {
    return null;
  }
}

/** Validate and extract only the currencies we need. */
function extractRates(incoming: Record<string, number> | null): Record<PayoutCurrency, number> | null {
  if (!incoming) return null;
  const result = {} as Record<PayoutCurrency, number>;
  for (const cur of PAYOUT_CURRENCIES) {
    const value = incoming[cur];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
    result[cur] = value;
  }
  return result;
}

async function fetchLiveRates(): Promise<Record<PayoutCurrency, number> | null> {
  return (
    (await fetchCustomProvider()) ??
    (await fetchFawaz(FAWAZ_PRIMARY)) ??
    (await fetchFawaz(FAWAZ_MIRROR))
  );
}

async function getRates(): Promise<RatesSnapshot> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.data;

  const live = await fetchLiveRates();
  const data: RatesSnapshot = {
    base: "USDT",
    rates: live ?? { ...FALLBACK_RATES },
    source: live ? "live" : "fallback",
    updatedAt: new Date(now).toISOString(),
  };

  cache = { data, expiresAt: now + TTL_MS };
  return data;
}

async function getPayoutRate(currency: string): Promise<number | null> {
  const snapshot = await getRates();
  const rate = snapshot.rates[currency as PayoutCurrency];
  return typeof rate === "number" ? rate : null;
}

/**
 * Overrides the in-memory cache with manually-supplied fiat rates.
 * Persists until the next TTL cycle.
 */
function setRates(incoming: Partial<Record<PayoutCurrency, number>>): RatesSnapshot {
  const current = cache?.data.rates ?? { ...FALLBACK_RATES };
  const merged: Record<PayoutCurrency, number> = { ...current };

  for (const cur of PAYOUT_CURRENCIES) {
    const v = incoming[cur];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      merged[cur] = v;
    }
  }

  const data: RatesSnapshot = {
    base: "USDT",
    rates: merged,
    source: "fallback",
    updatedAt: new Date().toISOString(),
  };
  cache = { data, expiresAt: Date.now() + TTL_MS };
  return data;
}

export = { getRates, getPayoutRate, setRates, PAYOUT_CURRENCIES };
