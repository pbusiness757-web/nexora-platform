# Nexora Production Checklist

Complete every item before exposing the platform to real users or real money.

---

## 1. SSL / HTTPS

- [ ] Domain has a valid TLS certificate (Let's Encrypt via Certbot is free)
- [ ] Nginx is configured to redirect all HTTP → HTTPS
- [ ] `CORS_ORIGIN` in `.env` uses `https://` not `http://`
- [ ] Auth cookies require `secure: true` — only works over HTTPS

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 2. NODE_ENV

- [ ] `.env` on VPS contains `NODE_ENV=production`
- [ ] Without this, auth cookies lack the `secure` flag and are sent over plain HTTP

```bash
echo "NODE_ENV=production" >> /var/www/nexora-platform/server/.env
```

---

## 3. CORS

- [ ] `CORS_ORIGIN` is set to the exact frontend origin (no trailing slash)
- [ ] The backend rejects requests from unlisted origins
- [ ] Example: `CORS_ORIGIN="https://nexoraexample.pro"`

---

## 4. Admin Credentials

- [ ] `ADMIN_EMAIL` changed from the default placeholder
- [ ] `ADMIN_PASSWORD` changed to a strong password (≥16 chars, mixed case, symbols)
- [ ] `AUTH_SECRET` generated with cryptographically random bytes:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

- [ ] Credentials are **not** committed to Git (`.env` is in `.gitignore`)

---

## 5. PM2 Process Manager

- [ ] Both processes running: `pm2 status`
- [ ] PM2 configured to restart on server reboot:

```bash
pm2 startup
pm2 save
```

- [ ] Logs monitored: `pm2 logs nexora-api --lines 50`

---

## 6. PostgreSQL

- [ ] `DATABASE_URL` points to PostgreSQL, not SQLite
- [ ] Database user `nexora` has permissions only on the `nexora` database
- [ ] Password for DB user is strong and not the default
- [ ] PostgreSQL not exposed on public port (bind to `127.0.0.1` only)

```bash
# Verify postgres is not publicly exposed
ss -tlnp | grep 5432
# Should show 127.0.0.1:5432, not 0.0.0.0:5432
```

---

## 7. Prisma Migrations Warning

> ⚠️ **Critical**: The current `migration_lock.toml` still references `provider = "sqlite"`.
> Running `prisma migrate deploy` will fail.

For now the database was initialised with `prisma db push` (acceptable for MVP).
Before any schema change in production:

1. Create a clean PostgreSQL migration history:
   ```bash
   npx prisma migrate dev --name init_pg
   ```
2. Update `migration_lock.toml` to `provider = "postgresql"`
3. Use `prisma migrate deploy` (not `db push`) for all future production changes

---

## 8. Backup

- [ ] Automated daily PostgreSQL backups configured:

```bash
# Example cron — runs at 02:00 daily
0 2 * * * pg_dump -U nexora nexora | gzip > /backups/nexora-$(date +\%F).sql.gz
```

- [ ] Backup files stored off-server (S3, Backblaze, etc.)
- [ ] Restore procedure tested at least once

---

## 9. Rate Limiting

- [ ] `/api/auth/login` is rate-limited (5 attempts / 15 min / IP) ✓ implemented
- [ ] Current limiter is in-memory — resets on process restart
- [ ] For multi-instance or restart-resilient limiting: replace with Redis-backed limiter

---

## 10. Firewall

- [ ] Only ports 80, 443, and 22 are open externally
- [ ] Port 4000 (API) and 5432 (Postgres) are NOT exposed to the internet

```bash
sudo ufw status
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Quick Deploy After Code Change

```bash
ssh root@YOUR_VPS_IP
cd /var/www/nexora-platform
git pull origin master
cd server && npm run build
pm2 restart nexora-api
pm2 logs nexora-api --lines 20 --nostream
curl -s http://localhost:4000/api/health
```
