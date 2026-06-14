# PROJECT STATE

## Finance
- Finance summary is currency-safe: no cross-currency sums.
- GET /api/admin/finance/summary returns `byCurrencyTotals` (RUB/KZT/UZS/AZN/KGS), plus `byCurrency`, `byCountry`, `byStatus`, and `totalCryptoVolume` (single USDT base).
- Removed cross-currency totals: totalFiatVolume, totalNexoraFees, totalPartnerFees, totalGrossProfit.
- Null finance fields on legacy requests are treated as 0.
