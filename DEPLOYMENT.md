# Nexora — Deployment Guide

Crypto-to-bank payout infrastructure. Monorepo with two deployable apps.

## 1. Stack

- **Frontend:** Next.js 16 (TypeScript, Tailwind) — public site + admin panel (`website/`)
- **Backend:** Express 5 (`server/`)
- **ORM:** Prisma 6
- **Database:** SQLite (MVP; migrate to PostgreSQL for production scale)

Business rule: client sends crypto, Nexora pays local fiat. Country determines
`payoutCurrency`; backend is the source of truth for `payoutAmount`, rates and fees.

## 2. Environment variables

### server/.env

```
# Database (SQLite for MVP)
DATABASE_URL="file:./dev.db"

# API port
PORT=4000

# Allowed browser origin for credentialed CORS (the website URL). Never "*".
CORS_ORIGIN="http://localhost:3000"

# Admin login (CHANGE FOR PRODUCTION)
ADMIN_EMAIL="admin@nexora.local"
ADMIN_PASSWORD="change-me-strong-password"

# Secret used to sign admin session tokens (long random string)
AUTH_SECRET="change-me-to-a-long-random-string"

# Live rates: optional external provider (JSON: { "rates": { "RUB": n, ... } }).
# If unset or unreachable, static fallback rates are used.
RATES_PROVIDER_URL=""

# Rates cache TTL in ms (5–15 min recommended). NOTE: code reads RATES_TTL_MS.
RATES_TTL_MS=600000
```

### website/.env

```
# Base URL of the API the browser calls
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

> ⚠️ Env naming: the spec lists `RATES_CACHE_TTL_MS`, but the code reads
> **`RATES_TTL_MS`**. Use `RATES_TTL_MS` (or align the code later).

## 3. Local run

### Backend (server/)

```
npm install
npx prisma generate
npx prisma migrate dev        # first setup (creates SQLite tables)
npm run dev                   # ts-node-dev (hot reload)
# or
npm run build && npm run start
```

### Frontend (website/)

```
npm install
npm run dev                   # http://localhost:3000
# or
npm run build && npm run start
```

## 4. Production deployment plan

1. **GitHub:** push monorepo; clone on the server.
2. **VPS (Ubuntu):** provision, create a non-root deploy user, open ports 80/443.
3. **Node.js:** install Node 20+ (nvm or NodeSource).
4. **Build:** `npm ci && npm run build` in both `server/` and `website/`;
   `npx prisma migrate deploy` in `server/`.
5. **PM2:** run both apps:
   ```
   pm2 start "npm run start" --name nexora-api --cwd ./server
   pm2 start "npm run start" --name nexora-web --cwd ./website
   pm2 save && pm2 startup
   ```
   - backend on internal port (e.g. 4000, not publicly exposed)
   - frontend on 3000 behind Nginx
6. **Nginx reverse proxy:**
   - `https://nexora.example` → `localhost:3000` (web)
   - `https://api.nexora.example` → `localhost:4000` (api)
7. **SSL:** `certbot --nginx` for both domains; auto-renew enabled.
8. Set `NEXT_PUBLIC_API_URL=https://api.nexora.example` and
   `CORS_ORIGIN=https://nexora.example`.

## 5. Health checks

```
curl https://api.nexora.example/api/health     # {"status":"ok"}
curl https://api.nexora.example/api/rates       # rates JSON (live or fallback)
```

- Admin login: open `/admin` → redirected to `/admin/login` → sign in → dashboard loads.
- Create test request: submit `/exchange`; confirm a request number is returned
  and the backend-calculated payout values appear in `/admin/requests`.

## 6. Security checklist

- [ ] Change default `ADMIN_PASSWORD`
- [ ] Strong, unique `AUTH_SECRET`
- [ ] Restrict `CORS_ORIGIN` to the real web domain (never `*`)
- [ ] Never commit `.env` files
- [ ] Back up the SQLite DB (`server/prisma/dev.db`) regularly
- [ ] Serve everything over HTTPS (Secure cookies require it in prod)

## 7. Known MVP limitations

- SQLite is temporary — move to PostgreSQL before scale/concurrency.
- Finance totals are grouped **by currency** (no cross-currency summation).
- Rates provider is optional and falls back to static rates.
- Partner settlement is not fully automated yet.

## 8. Next step

Push to GitHub and deploy to the VPS per section 4.
