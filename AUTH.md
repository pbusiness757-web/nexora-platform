# Nexora — Admin Authentication

MVP admin auth: cookie-based session backed by the Express API. No external
auth provider, no extra packages (uses Node's built-in `crypto`).

## How it works

1. Admin opens any `/admin/*` page.
2. `website/proxy.ts` (Next 16 proxy/middleware) checks for the `nexora_token`
   cookie; if missing, redirects to `/admin/login`.
3. The admin layout additionally calls `GET /api/auth/me` (authoritative check,
   works cross-origin). If unauthenticated, it redirects to `/admin/login`.
4. Login posts to `POST /api/auth/login`. On success the API sets an
   **httpOnly**, signed session cookie (`nexora_token`).
5. Logout posts to `POST /api/auth/logout`, which clears the cookie.

The session token is an HMAC-SHA256 signed payload (`{ sub, role, exp }`),
8-hour TTL. The admin password is **never** sent to or stored in the frontend.

## Backend endpoints

| Method | Path             | Auth | Description                          |
| ------ | ---------------- | ---- | ------------------------------------ |
| POST   | `/api/auth/login`  | no  | `{ email, password }` → sets cookie  |
| POST   | `/api/auth/logout` | no  | clears the session cookie            |
| GET    | `/api/auth/me`     | yes | returns `{ authenticated, user }`    |

Protect any future admin-only API route with the middleware:

```ts
import requireAuth = require("../middleware/requireAuth");
router.post("/x", requireAuth, handler);
```

## Environment variables (server)

```
# Default admin credentials (MVP). CHANGE IN PRODUCTION.
ADMIN_EMAIL="admin@nexora.local"
ADMIN_PASSWORD="nexora-admin"

# Secret used to sign session tokens. MUST be set to a long random value in prod.
AUTH_SECRET="replace-with-long-random-string"

# Allowed browser origin for cookie/credentialed requests.
CORS_ORIGIN="http://localhost:3000"

NODE_ENV="production"   # enables Secure cookies
```

### Frontend

```
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## Default admin (MVP seed)

No DB row is required — the default admin is defined by `ADMIN_EMAIL` /
`ADMIN_PASSWORD` env vars (sensible dev defaults provided). For first login:

```
email:    admin@nexora.local
password: nexora-admin
```

Override both in production. To move credentials into the database later, add a
hashed-password field to the `User` model (migration) and verify against it in
`auth.controller.ts` instead of the env values.

## Cross-origin / production notes

- The API and website may run on different subdomains. The session cookie is
  set by the API; for `proxy.ts` (website domain) to also see it, set a shared
  cookie domain (e.g. `Domain=.nexora.example`) — or rely on the layout's
  `/api/auth/me` check, which works regardless of origin.
- `CORS_ORIGIN` must be the exact website origin (not `*`) because credentialed
  requests cannot use a wildcard.
- Cookies are `Secure` when `NODE_ENV=production` (HTTPS required).

## Local verification

```
# login (stores cookie jar)
curl -i -c cj.txt -X POST -H "Content-Type: application/json" \
  --data '{"email":"admin@nexora.local","password":"nexora-admin"}' \
  http://localhost:4000/api/auth/login

# me (authenticated)
curl -b cj.txt http://localhost:4000/api/auth/me

# logout
curl -b cj.txt -X POST http://localhost:4000/api/auth/logout
```
