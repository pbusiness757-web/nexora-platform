# TECH STACK

## PURPOSE

Define the technical foundation for PayBridge.

The stack must support:

* Fast MVP launch
* Website
* Admin Panel
* Telegram Bot
* Real-time rates
* Crypto payment tracking
* PostgreSQL database
* Future client cabinet
* Future API for business clients

---

# CORE PRINCIPLE

Build simple first.

Scale later.

No overengineering before first real transactions.

---

# FRONTEND WEBSITE

## Recommended

Next.js

Why:

* Fast
* SEO friendly
* Good for landing pages
* Good for dynamic calculator
* Good for future multilingual pages
* Easy deployment

## Styling

Tailwind CSS

Why:

* Fast development
* Clean UI
* Easy design system
* Good for responsive layout

---

# ADMIN PANEL

## Recommended

Next.js Admin App

Can be built as:

* Separate app
* Protected admin route
* Future internal dashboard

## UI

Tailwind CSS

Component library options:

* shadcn/ui
* Radix UI
* Headless UI

Recommended:

shadcn/ui

---

# BACKEND

## Recommended

Node.js + Express

Why:

* Simple
* Fast to build
* Good for API
* Good for Telegram bot integration
* Good ecosystem

Alternative future:

NestJS

For MVP:

Express is enough.

---

# DATABASE

## Recommended

PostgreSQL

Why:

* Reliable
* Good for financial data
* Strong relational structure
* Good reporting
* Scalable

---

# ORM

## Recommended

Prisma

Why:

* Clean schema
* Fast development
* Type safety
* Easy migrations
* Works well with PostgreSQL

---

# TELEGRAM BOT

## Recommended

Node.js + Telegraf

Why:

* Popular
* Stable
* Easy Telegram bot creation
* Works well with Express backend

---

# REAL-TIME RATES

## Crypto Data Sources

Primary:

* Binance API

Secondary:

* CoinGecko API

Backup:

* CoinMarketCap API

## Fiat Data Sources

Options:

* Exchange rate API
* Bank API
* Manual admin override

## Rate Update Interval

MVP:

30 seconds - 60 seconds

Future:

10 seconds - 30 seconds

---

# CRYPTO PAYMENT MONITORING

## MVP

Manual + semi-automatic

Options:

* Blockchain explorer APIs
* Public node providers
* Webhook providers

## Future

Dedicated wallet infrastructure

Options:

* Fireblocks
* BitGo
* Coinbase Commerce
* Crypto payment gateway

---

# NEWS INTEGRATION

## MVP

Crypto news RSS / API aggregation

## Future

Admin-curated news system

News must be moderated before publication if needed.

---

# AUTHENTICATION

## MVP

Admin login:

* Email
* Password
* JWT token
* Secure cookies

## Future

* 2FA
* IP whitelist
* Role-based access control
* Session management

---

# HOSTING

## MVP Option

Frontend:

Vercel

Backend:

VPS / Render / Railway

Database:

Managed PostgreSQL

## More Controlled Option

Single VPS:

* Nginx
* Node.js
* PostgreSQL
* PM2
* SSL

Recommended for financial project:

Controlled VPS after MVP.

---

# SECURITY

## Required

* HTTPS
* Environment variables
* Input validation
* Rate limiting
* Admin authentication
* Audit logs
* No sensitive logs
* Database backups
* Secure API keys

---

# PROJECT STRUCTURE

Root:

* website
* server
* admin
* bot
* docs
* design
* prompts

---

# DEVELOPMENT ORDER

1. Backend API
2. Database schema
3. Website calculator
4. Request creation
5. Admin panel requests
6. Rate system
7. Telegram bot
8. Reports
9. SEO pages
10. News integration

---

# MVP TECHNOLOGY DECISION

Website:

Next.js + Tailwind CSS

Admin:

Next.js + shadcn/ui

Backend:

Node.js + Express

Database:

PostgreSQL

ORM:

Prisma

Bot:

Telegraf

Deployment:

Vercel + VPS or full VPS

---

# FUTURE UPGRADES

* Client cabinet
* Business dashboard
* API for corporate clients
* Automated payouts
* Advanced AML integrations
* Multi-language content
* Partner network dashboard
