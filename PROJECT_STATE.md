# PROJECT STATE

## Finance
- Finance summary is currency-safe: no cross-currency sums.
- GET /api/admin/finance/summary returns `byCurrencyTotals` (RUB/KZT/UZS/AZN/KGS), plus `byCurrency`, `byCountry`, `byStatus`, and `totalCryptoVolume` (single USDT base).
- Removed cross-currency totals: totalFiatVolume, totalNexoraFees, totalPartnerFees, totalGrossProfit.
- Null finance fields on legacy requests are treated as 0.
- Finance page (/admin/finance) updated for currency-safe response: Total Crypto Volume card + per-currency table from byCurrencyTotals; removed deleted cross-currency totals; added not-summed-across-currencies note.
- DEPLOYMENT.md: stack, env vars (backend+frontend), local run, VPS/PM2/Nginx/Certbot plan, health checks, security checklist, MVP limitations.
- Env note: rates TTL var is RATES_TTL_MS in code (spec said RATES_CACHE_TTL_MS).
- Rates TTL env normalized: RATES_CACHE_TTL_MS preferred, RATES_TTL_MS legacy fallback.
- Added server/.env.example and website/.env.example (placeholders only).
- Added docs/MASTER_CONTEXT.md, docs/API.md, docs/FINANCE.md (MVP context package).
- Documented planned PostgreSQL Decimal precision (money 18,2; rates 18,8; percent 5,2) as schema comments + FINANCE.md; provider stays sqlite for now.
