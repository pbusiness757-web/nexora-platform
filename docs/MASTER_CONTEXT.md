# Nexora — Master Context (MVP)

## Goal
Crypto-to-bank payout infrastructure. Client sends cryptocurrency; Nexora pays
local fiat to the recipient. Country determines the payout currency; the backend
is the single source of truth for currency, rate, payout amount and fees.

## Stack
- Frontend: Next.js 16, TypeScript, Tailwind (`website/`)
- Backend: Express 5 (`server/`)
- ORM: Prisma 6; DB: SQLite (MVP)
- No external auth/rate packages — Node `crypto` + global `fetch`.

## Frontend features
- Public homepage (13 localized sections), `/exchange` (request form + estimate),
  `/status` (tracker), premium fintech UI, scroll-reveal, count-up, back-to-top.
- Admin panel (RU): dashboard, requests (+search, detail), payouts, rates, AML,
  clients, partners, reports, audit-logs, settings, finance.
- Auth-guarded admin via `proxy.ts` + `/api/auth/me` check in admin layout.

## Backend features
- REST API (Express), Prisma data layer, helmet + CORS(credentials), morgan logs.
- Country→currency enforcement, server-computed payout/fees, live rates w/ cache+fallback,
  cookie-session admin auth (HMAC token), finance summary.

## Database models (Prisma)
- **User** (id, email, name, role, …) — operators.
- **Client** (companyName, country, riskLevel, requests[]).
- **Request** (requestNumber, status, cryptoAsset, network, cryptoAmount,
  payoutCurrency, payoutAmount, rateSnapshot, nexoraFeePercent/Amount,
  partnerFeePercent/Amount, grossProfit, netPayoutAmount, clientId, payout?).
- **Payout** (payoutNumber, status, amount, currency, request, partner?).
- **Partner** (name, country, currency, reserve, feePercent, status).
- **AuditLog** (action, entityType, entityId, operatorName, operator?).
- Enums: Role, RiskLevel, RequestStatus, PayoutStatus, PartnerStatus.

## Request workflow
Statuses: CREATED → WAITING_PAYMENT → CRYPTO_RECEIVED → AML_REVIEW →
READY_FOR_PAYOUT → PROCESSING → COMPLETED (or ON_HOLD). Operators update status
via `PATCH /api/requests/:id/status`; admin list + detail reflect changes.

## Auth flow
`POST /api/auth/login` (env creds) sets httpOnly `nexora_token` (HMAC-signed).
`proxy.ts` redirects unauthenticated `/admin/*` → `/admin/login`; admin layout
verifies via `GET /api/auth/me`. `POST /api/auth/logout` clears the cookie.

## Rates flow
`rates.service` returns fiat-per-USDT for RUB/KZT/UZS/AZN/KGS, cached
(`RATES_CACHE_TTL_MS`, fallback `RATES_TTL_MS`, default 10 min). Optional
`RATES_PROVIDER_URL`; static fallback if unset/unreachable. `GET /api/rates`.

## Finance flow
On request creation backend derives currency from country, fetches rate,
computes `payoutAmount = cryptoAmount × rate`, stores `rateSnapshot`, then
`nexoraFeeAmount`, `partnerFeeAmount`, `grossProfit`, `netPayoutAmount`.
`GET /api/admin/finance/summary` (auth) returns `byCurrencyTotals` + breakdowns.
See FINANCE.md.

## Localization
6 locales (ru, en, kk, uz, az, ky) via `lib/i18n` + `lib/locale-context`.
Browser auto-detect + localStorage; manual switch overrides. Admin UI is RU.

## SEO
metadata (title template, OG, Twitter), JSON-LD Organization, hreflang for all
locales, `robots.ts`, `sitemap.ts`.

## Env variables
Backend: DATABASE_URL, PORT, CORS_ORIGIN, ADMIN_EMAIL, ADMIN_PASSWORD,
AUTH_SECRET, RATES_PROVIDER_URL, RATES_CACHE_TTL_MS (legacy RATES_TTL_MS).
Frontend: NEXT_PUBLIC_API_URL (+ optional NEXT_PUBLIC_TEST_CLIENT_ID,
NEXT_PUBLIC_SITE_URL). Examples in `server/.env.example`, `website/.env.example`.

## MVP limitations
- SQLite (temporary); move to PostgreSQL for scale.
- Finance totals grouped by currency only (no cross-currency sums); float math.
- Rates provider optional; static fallback.
- Partner settlement not automated; fee % from env defaults, not per-contract.
- Single admin via env creds (no admin user table yet).
- Public `/exchange` uses a static test client id.

## Next priorities
1. PostgreSQL migration + DB backups.
2. Real rates provider + crypto (non-USDT) pricing.
3. Admin user table + roles; rate limiting.
4. Partner-linked payouts + settlement automation.
5. Client/partner create/edit UI; richer dashboard analytics.
