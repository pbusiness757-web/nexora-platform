/// <reference types="node" />
import countryCurrency = require("../utils/countryCurrency");

const NEXORA_FEE_PERCENT = Number(process.env.NEXORA_FEE_PERCENT) || 2.0;
const PARTNER_FEE_PERCENT = Number(process.env.PARTNER_FEE_PERCENT) || 1.0;

// currency -> country (reverse of the country -> currency map).
const CURRENCY_COUNTRY: Record<string, string> = {};
for (const [country, currency] of Object.entries(
  countryCurrency.countryCurrencyMap
)) {
  CURRENCY_COUNTRY[currency] = country;
}

type Finance = {
  nexoraFeePercent: number;
  nexoraFeeAmount: number;
  partnerFeePercent: number;
  partnerFeeAmount: number;
  grossProfit: number;
  netPayoutAmount: number;
};

function computeFinance(
  payoutAmount: number,
  nexoraPercent: number = NEXORA_FEE_PERCENT,
  partnerPercent: number = PARTNER_FEE_PERCENT
): Finance {
  const nexoraFeeAmount = (payoutAmount * nexoraPercent) / 100;
  const partnerFeeAmount = (payoutAmount * partnerPercent) / 100;
  const grossProfit = nexoraFeeAmount - partnerFeeAmount;
  const netPayoutAmount = payoutAmount - nexoraFeeAmount;
  return {
    nexoraFeePercent: nexoraPercent,
    nexoraFeeAmount,
    partnerFeePercent: partnerPercent,
    partnerFeeAmount,
    grossProfit,
    netPayoutAmount,
  };
}

// Safe Decimal/null -> number.
function toNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type RequestRow = {
  status: string;
  payoutCurrency: string;
  cryptoAmount: unknown;
  payoutAmount: unknown;
  nexoraFeeAmount: unknown;
  partnerFeeAmount: unknown;
  grossProfit: unknown;
};

type Bucket = {
  count: number;
  fiatVolume: number;
  nexoraFees: number;
  partnerFees: number;
  grossProfit: number;
};

function emptyBucket(): Bucket {
  return {
    count: 0,
    fiatVolume: 0,
    nexoraFees: 0,
    partnerFees: 0,
    grossProfit: 0,
  };
}

function summarize(requests: RequestRow[]) {
  // Crypto volume is a single base asset (USDT), so one total is currency-safe.
  // Fiat money is NEVER summed across currencies — see byCurrencyTotals.
  let totalCryptoVolume = 0;

  const byCurrency: Record<string, Bucket> = {};
  const byCountry: Record<string, Bucket> = {};
  const byStatus: Record<string, Bucket> = {};

  const add = (map: Record<string, Bucket>, key: string, r: RequestRow) => {
    const b = map[key] ?? emptyBucket();
    b.count += 1;
    b.fiatVolume += toNum(r.payoutAmount);
    b.nexoraFees += toNum(r.nexoraFeeAmount);
    b.partnerFees += toNum(r.partnerFeeAmount);
    b.grossProfit += toNum(r.grossProfit);
    map[key] = b;
  };

  for (const r of requests) {
    totalCryptoVolume += toNum(r.cryptoAmount);

    add(byCurrency, r.payoutCurrency, r);
    add(byCountry, CURRENCY_COUNTRY[r.payoutCurrency] ?? r.payoutCurrency, r);
    add(byStatus, r.status, r);
  }

  const serializeBucket = (b: Bucket) => ({
    count: b.count,
    fiatVolume: round2(b.fiatVolume),
    nexoraFees: round2(b.nexoraFees),
    partnerFees: round2(b.partnerFees),
    grossProfit: round2(b.grossProfit),
  });

  // Per-currency totals — keys always present for every supported currency.
  const SUPPORTED_CURRENCIES = ["RUB", "KZT", "UZS", "AZN", "KGS"];
  const byCurrencyTotals: Record<string, ReturnType<typeof serializeBucket>> = {};
  for (const c of SUPPORTED_CURRENCIES) {
    byCurrencyTotals[c] = serializeBucket(byCurrency[c] ?? emptyBucket());
  }

  return {
    totalCryptoVolume: round2(totalCryptoVolume),
    byCurrencyTotals,
    byCurrency: Object.entries(byCurrency).map(([currency, b]) => ({
      currency,
      ...serializeBucket(b),
    })),
    byCountry: Object.entries(byCountry).map(([country, b]) => ({
      country,
      ...serializeBucket(b),
    })),
    byStatus: Object.entries(byStatus).map(([status, b]) => ({
      status,
      ...serializeBucket(b),
    })),
  };
}

export = {
  NEXORA_FEE_PERCENT,
  PARTNER_FEE_PERCENT,
  computeFinance,
  summarize,
  toNum,
};
