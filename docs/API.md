# Nexora — API Reference (MVP)

Base URL: `NEXT_PUBLIC_API_URL` (dev `http://localhost:4000`). JSON responses;
errors are `{ "error": string }`. Admin endpoints require the `nexora_token`
cookie (send `credentials: "include"`).

## Health
- `GET /api/health` → `{ "status": "ok" }`

## Rates
- `GET /api/rates`
```json
{ "base":"USDT", "rates":{"RUB":92.4,"KZT":478.5,"UZS":12650,"AZN":1.7,"KGS":89.2},
  "source":"fallback", "updatedAt":"2026-06-14T11:09:26.774Z" }
```

## Auth
- `POST /api/auth/login` — body `{ email, password }`; sets httpOnly cookie.
  - 200 `{ "user": { "email":"...", "role":"ADMIN" } }`; 401 on bad creds.
- `POST /api/auth/logout` → `{ "ok": true }` (clears cookie).
- `GET /api/auth/me` (auth) → `{ "authenticated": true, "user": {...} }`; else 401.

## Clients
- `GET /api/clients` → array incl. `_count.requests`.
- `POST /api/clients` — body `{ companyName, country, riskLevel? }`.
  - 400 if `companyName` missing or country unsupported.

## Requests
- `GET /api/requests` → array of requests.
- `GET /api/requests/:id` → request incl. `client`, `payout`; 404 if missing.
- `POST /api/requests` — body `{ requestNumber, clientId, cryptoAsset, network,
  cryptoAmount, country }`. Server derives `payoutCurrency`, rate, `payoutAmount`,
  fees. `payoutCurrency`/`payoutAmount` from client are **ignored**.
  - 400 unsupported country / invalid amount; 503 if rates unavailable.
```json
{ "id":"...", "requestNumber":"NX-2026-1234", "payoutCurrency":"RUB",
  "payoutAmount":"92400", "rateSnapshot":"92.4", "nexoraFeeAmount":"1848",
  "partnerFeeAmount":"924", "grossProfit":"924", "netPayoutAmount":"90552" }
```
- `PATCH /api/requests/:id/status` — body `{ status }` (8 enum values); 400 invalid.

## Partners
- `GET /api/partners` → array.
- `POST /api/partners` — body `{ name, country, currency, reserve, feePercent, status? }`; 400 on missing/invalid.
- `PATCH /api/partners/:id` — body `{ reserve?, feePercent?, status? }`.

## Dashboard
- `GET /api/dashboard/stats`
```json
{ "totalRequests":N, "activeRequests":N, "createdRequests":N, "processingRequests":N,
  "completedRequests":N, "totalCryptoVolume":"...", "totalPayoutVolume":"...",
  "activePartners":N, "totalPartners":N, "totalClients":N }
```

## Finance (admin)
- `GET /api/admin/finance/summary` (auth)
```json
{ "totalCryptoVolume":4547944,
  "byCurrencyTotals":{ "RUB":{"count":3,"fiatVolume":45530145,"nexoraFees":1848,
    "partnerFees":924,"grossProfit":924}, "KZT":{...}, "UZS":{...}, "AZN":{...}, "KGS":{...} },
  "byCurrency":[...], "byCountry":[...], "byStatus":[...] }
```
Fiat values are never summed across currencies. See FINANCE.md.
