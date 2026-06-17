# VPS Firewall Checklist

## Required Open Ports

| Port | Service | Public | Notes |
|---|---|---|---|
| 22 | SSH | ✅ Yes | Restrict to your IP if possible |
| 80 | HTTP (Nginx) | ✅ Yes | Redirects to HTTPS |
| 443 | HTTPS (Nginx) | ✅ Yes | Main entry point |
| 4000 | Node.js API | ❌ No | Internal only — proxied by Nginx |
| 5432 | PostgreSQL | ❌ No | Internal only — must never be public |
| 3000 | Next.js | ❌ No | Internal only — proxied by Nginx |

---

## UFW Setup Commands

Run in order on VPS:

```bash
# Reset to default (deny incoming, allow outgoing)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (do this BEFORE enabling UFW or you will lock yourself out)
sudo ufw allow 22/tcp

# Allow web traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify status
sudo ufw status verbose
```

Expected `ufw status verbose` output:
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
```

Ports 4000, 5432, and 3000 must **not** appear in this list.

---

## Restrict SSH to Your IP (Recommended)

If you always connect from the same IP:

```bash
# Replace 1.2.3.4 with your actual public IP
sudo ufw delete allow 22/tcp
sudo ufw allow from 1.2.3.4 to any port 22
sudo ufw reload
```

To find your public IP:
```bash
curl -s https://api.ipify.org
```

---

## Verification Commands

### Check which ports are actually listening

```bash
ss -tlnp
```

Expected — only these should show:
```
127.0.0.1:5432   # PostgreSQL — loopback only ✓
127.0.0.1:4000   # or 0.0.0.0:4000 — checked below
0.0.0.0:80       # Nginx ✓
0.0.0.0:443      # Nginx ✓
0.0.0.0:22       # SSH ✓
```

### Verify API is not publicly reachable

```bash
# From your LOCAL machine (not VPS):
curl -m 5 http://72.56.123.4:4000/api/health
# Expected: connection timeout or connection refused — NOT {"status":"ok"}
```

### Verify PostgreSQL is not publicly reachable

```bash
# From your LOCAL machine:
nc -zv 72.56.123.4 5432
# Expected: connection refused or timeout
```

### Verify PostgreSQL binds to loopback only

```bash
# On VPS:
sudo grep -E "^listen_addresses" /etc/postgresql/*/main/postgresql.conf
# Expected: listen_addresses = 'localhost'
# If missing or set to '*', fix it:
sudo nano /etc/postgresql/16/main/postgresql.conf
# Set: listen_addresses = 'localhost'
sudo systemctl restart postgresql
```

### Verify Nginx is proxying correctly

```bash
# API should be reachable via Nginx proxy (port 80/443):
curl -s http://72.56.123.4/api/health
# Expected: {"status":"ok"}

# But NOT directly on port 4000 from outside:
# (run from your local machine)
curl -m 5 http://72.56.123.4:4000/api/health
# Expected: timeout
```

---

## If Port 4000 Is Still Publicly Exposed

If `ss -tlnp` shows `0.0.0.0:4000` and UFW is not blocking it:

```bash
# Block port 4000 explicitly
sudo ufw deny 4000/tcp
sudo ufw reload
```

Better long-term: bind the Node.js API to `127.0.0.1` only by setting
`HOST=127.0.0.1` in `.env` and updating `server.ts` to pass it to `app.listen`.

---

## PM2 and Nginx Service Persistence

```bash
# Ensure services survive reboots
pm2 startup
pm2 save
sudo systemctl enable nginx
sudo systemctl enable postgresql
```

### Verify after reboot

```bash
sudo reboot
# After reconnect:
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
curl -s http://localhost:4000/api/health
```

---

## Quick Audit One-liner

Run on VPS to get a full picture:

```bash
echo "=== UFW ===" && sudo ufw status numbered && \
echo "=== Listening ports ===" && ss -tlnp && \
echo "=== PM2 ===" && pm2 status && \
echo "=== Nginx ===" && sudo systemctl is-active nginx && \
echo "=== Postgres ===" && sudo systemctl is-active postgresql && \
echo "=== API health ===" && curl -s http://localhost:4000/api/health
```
