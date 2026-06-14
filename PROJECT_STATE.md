# PROJECT STATE

## Finance
- Finance summary is currency-safe: no cross-currency sums.
- GET /api/admin/finance/summary returns `byCurrencyTotals` (RUB/KZT/UZS/AZN/KGS), plus `byCurrency`, `byCountry`, `byStatus`, and `totalCryptoVolume` (single USDT base).
- Removed cross-currency totals: totalFiatVolume, totalNexoraFees, totalPartnerFees, totalGrossProfit.
- Null finance fields on legacy requests are treated as 0.
- Finance page (/admin/finance) updated for currency-safe response: Total Crypto Volume card + per-currency table from byCurrencyTotals; removed deleted cross-currency totals; added not-summed-across-currencies note.
