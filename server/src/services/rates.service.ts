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

// RATES_CACHE_TTL_MS preferred; RATES_TTL_MS kept as legacy fallback.
const TTL_MS =
  Number(process.env.RATES_CACHE_TTL_MS || process.env.RATES_TTL_MS) ||
  10 * 60 * 1000; // 10 min
const PROVIDER_URL = process.env.RATES_PROVIDER_URL; // optional external source

type RatesSnapshot = {
  base: "USDT";
  rates: Record<PayoutCurrency, number>;
  source: "live" | "fallback";
  updatedAt: string;
};

let cache: { data: RatesSnapshot; expiresAt: number } | null = null;

/**
 * Fetches rates from a configurable provider. Expected JSON shape:
 *   { rates: { RUB: number, KZT: number, ... } }
 * Returns null on any failure so the caller can fall back.
 */
async function fetchFromProvider(): Promise<Record<PayoutCurrency, number> | null> {
  if (!PROVIDER_URL) return null;
  try {
    const res = await fetch(PROVIDER_URL);
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number> };
    const incoming = json?.rates;
    if (!incoming) return null;

    const result = {} as Record<PayoutCurrency, number>;
    for (const cur of PAYOUT_CURRENCIES) {
      const value = incoming[cur];
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        return null; // incomplete payload -> fall back entirely
      }
      result[cur] = value;
    }
    return result;
  } catch {
    return null;
  }
}

async function getRates(): Promise<RatesSnapshot> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  const live = await fetchFromProvider();
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
 * Overrides the in-memory cache with manually-suppli