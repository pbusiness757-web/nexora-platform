# Nexora — Finance Engine (MVP)

All monetary logic is computed **server-side** on request creation
(`server/src/services/finance.service.ts` + `requests.controller`). Client-sent
currency/amount/fee fields are ignored.

## payoutAmount
1. Country → `payoutCurrency` via `countryCurrencyMap` (RUB/KZT/UZS/AZN/KGS).
   Unsupported country → 400.
2. Rate (fiat per 1 USDT) from `rates.service` (`getPayoutRate`). Unavailable → 503.
3. `payoutAmount = cryptoAmount × rate`. (MVP base asset: USDT.)

## rateSnapshot
The rate used at creation is persisted on the `Request` (`rateSnapshot`) so the
deal is reproducible even if live rates change later. Rates are cached
(`RATES_CACHE_TTL_MS`, default 10 min) with a static fallback table.

## Nexora fee
`nexoraFeePercent` default **2.0%** (env `NEXORA_FEE_PERCENT`).
`nexoraFeeAmount = payoutAmount × nexoraFeePercent / 100`.
This is Nexora's gross revenue on the deal.

## Partner fee
`partnerFeePercent` default **1.0%** (env `PARTNER_FEE_PERCENT`).
`partnerFeeAmount = payoutAmount × partnerFeePercent / 100`.
This is the cost paid to the payout partner.

## Derived
- `grossProfit = nexoraFeeAmount − partnerFeeAmount`
- `netPayoutAmount = payoutAmount − nexoraFeeAmount`

## Why totals are grouped by currency
The summary returns `byCurrencyTotals` (per RUB/KZT/UZS/AZN/KGS) plus `byCurrency`,
`byCountry`, `byStatus`. Cross-currency sums (e.g. RUB + KZT) are **not** produced
because adding different currencies is economically meaningless. Only
`totalCryptoVolume` is a single total — valid because crypto is a single base
asset (USDT). Null finance fields on legacy requests are treated as 0.

## Decimal precision (SQLite now → PostgreSQL planned)
- **Current (SQLite):** the provider stores `Decimal` without fixed precision/scale;
  `@db.Decimal(...)` native annotations are **not** added because the SQLite provider
  rejects Postgres-native type attributes. Schema carries them as comments only.
- **Planned (PostgreSQL):** apply native precision during the PG migration —
  - money amounts (cryptoAmount, payoutAmount, *FeeAmount, grossProfit, netPayoutAmount,
    Payout.amount, Partner.reserve): `@db.Decimal(18,2)`
  - exchange rate (rateSnapshot): `@db.Decimal(18,8)`
  - percentages (nexora/partner feePercent): `@db.Decimal(5,2)`
- Server math still rounds money to 2 dp; PG precision will lock it at the DB layer.

## Known accounting limitations
- Float arithmetic (JS `Number`, rounded to 2 dp) — not exact decimal ledger.
- Fee percentages come from env defaults, not per-client/per-partner contracts.
- `partnerFeeAmount` is not linked to a specific `Partner` record.
- No base-currency (USD) normalization, so no single global revenue figure.
- No immutable ledger / double-entry; values are denormalized on `Request`.
- Historical requests created before fee fields existed have nulls (counted as 0).
