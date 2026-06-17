# Security Secrets Rotation Guide

Rotate secrets immediately if any of the following occurred:
- Default placeholder values were deployed
- A `.env` file was committed to Git
- A team member with access leaves
- Any suspected credential compromise

---

## 1. Rotate `AUTH_SECRET`

`AUTH_SECRET` signs all session tokens. Rotating it **immediately invalidates
all active sessions** — all logged-in users will be signed out.

### Generate a strong value

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Example output (never use this exact value):
```
a3f8c2...  (96 hex characters)
```

Minimum: 32 bytes (64 hex chars). Recommended: 48 bytes (96 hex chars).

### Apply on VPS

```bash
ssh root@72.56.123.4
nano /var/www/nexora-platform/server/.env
# Update: AUTH_SECRET="<new-value>"
# Save and exit (Ctrl+X, Y, Enter)
```

### Restart API

```bash
pm2 restart nexora-api
pm2 logs nexora-api --lines 10 --nostream
curl -s http://localhost:4000/api/health
```

### Verify

```bash
# Old tokens should now return 401
curl -s -c /tmp/old-cookie.txt http://localhost:4000/api/auth/me
# Expected: {"authenticated":false} or {"error":"Unauthorized"}
```

### Rollback

If the API fails to start after rotation:
```bash
nano /var/www/nexora-platform/server/.env
# Restore previous AUTH_SECRET value
pm2 restart nexora-api
```

---

## 2. Rotate `ADMIN_PASSWORD`

`ADMIN_PASSWORD` is compared at login time directly from the environment variable.
No database update needed — just change `.env` and restart.

### Generate a strong password

Requirements: ≥16 characters, uppercase, lowercase, digits, symbols.

```bash
node -e "console.log(require('crypto').randomBytes(20).toString('base64url'))"
```

Or use a password manager to generate a passphrase.

### Apply on VPS

```bash
ssh root@72.56.123.4
nano /var/www/nexora-platform/server/.env
# Update: ADMIN_PASSWORD="<new-password>"
# Save and exit (Ctrl+X, Y, Enter)
```

### Restart API

```bash
pm2 restart nexora-api
pm2 logs nexora-api --lines 10 --nostream
```

### Verify login works

```bash
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","password":"<new-password>"}' | jq .
# Expected: {"user":{"email":"...","role":"ADMIN"}}
```

### Rollback

```bash
nano /var/www/nexora-platform/server/.env
# Restore previous ADMIN_PASSWORD
pm2 restart nexora-api
```

---

## 3. Rotate `ADMIN_EMAIL`

```bash
nano /var/www/nexora-platform/server/.env
# Update: ADMIN_EMAIL="new-admin@your-domain.com"
pm2 restart nexora-api
```

---

## 4. Rotate Database Password (`DATABASE_URL`)

```bash
# Step 1 — Change the password in PostgreSQL first
sudo -u postgres psql
ALTER USER nexora WITH PASSWORD 'new-strong-password';
\q

# Step 2 — Update .env
nano /var/www/nexora-platform/server/.env
# Update DATABASE_URL with new password

# Step 3 — Restart API
pm2 restart nexora-api
curl -s http://localhost:4000/api/health
```

### Rollback

If API cannot connect to database:
```bash
# Revert PostgreSQL password
sudo -u postgres psql -c "ALTER USER nexora WITH PASSWORD 'old-password';"
# Revert .env
nano /var/www/nexora-platform/server/.env
pm2 restart nexora-api
```

---

## 5. Full Secrets Checklist After Rotation

```bash
# Confirm .env has no placeholder values
grep -E "CHANGE|change-this|placeholder|dev-insecure" /var/www/nexora-platform/server/.env
# Expected: no output
```

```bash
# Confirm API is healthy
curl -s http://localhost:4000/api/health
# Expected: {"status":"ok"}
```

```bash
# Confirm login works with new credentials
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}' | jq .email
```

```bash
# Confirm old sessions are rejected (rotate AUTH_SECRET if needed)
curl -s -H "Cookie: nexora_token=old.token" \
  http://localhost:4000/api/auth/me
# Expected: {"error":"Unauthorized"}
```

---

## ⚠️ Never Do

- Store secrets in Git (`.env` must be in `.gitignore`)
- Use the same secret across environments
- Share secrets over chat or email — use a password manager or secrets vault
- Rotate `AUTH_SECRET` during peak hours (it signs out all users instantly)
