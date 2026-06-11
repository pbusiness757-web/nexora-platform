# API ARCHITECTURE

## PURPOSE

The API connects all parts of PayBridge:

* Website
* Admin Panel
* Telegram Bot
* Database
* Crypto payment monitoring
* Rate providers
* News providers
* Operators

---

# SYSTEM ARCHITECTURE

Client Website
↓
Backend API
↓
Database
↓
Admin Panel / Telegram Bot / External Services

---

# CORE MODULES

## 1. Authentication API

Used for admin users and future client accounts.

### Endpoints

POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/refresh-token

---

## 2. Public Rates API

Used by website calculator and live rates block.

### Endpoints

GET /api/rates/crypto
GET /api/rates/fiat
GET /api/rates/pairs
GET /api/rates/calculate

### Example

GET /api/rates/calculate?crypto=USDT&amount=1000&country=KZ&method=corporate_account

Returns:

* Market rate
* Client rate
* Payout currency
* Payout amount
* Estimated payout time
* Rate expiration time

---

## 3. Requests API

Main business API.

### Public Endpoints

POST /api/requests
GET /api/requests/:publicId/status

### Admin Endpoints

GET /api/admin/requests
GET /api/admin/requests/:id
PATCH /api/admin/requests/:id/status
PATCH /api/admin/requests/:id/assign
POST /api/admin/requests/:id/notes

---

## 4. Crypto Payment API

Tracks incoming crypto transactions.

### Endpoints

POST /api/crypto/wallets/generate
GET /api/crypto/transactions/:hash
POST /api/crypto/webhook
GET /api/admin/crypto/transactions

### Supported Assets

* USDT
* BTC
* ETH
* USDC
* TON
* TRX
* LTC

### Supported Networks

* TRC20
* ERC20
* BEP20
* TON
* BTC
* LTC

---

## 5. Payouts API

Used by admin operators.

### Endpoints

GET /api/admin/payouts
GET /api/admin/payouts/:id
PATCH /api/admin/payouts/:id/status
POST /api/admin/payouts/:id/complete
POST /api/admin/payouts/:id/fail

### Payout Methods

* Bank card
* Personal bank account
* Corporate bank account
* Electronic wallet
* Cash via partner

---

## 6. Clients API

### Endpoints

GET /api/admin/clients
GET /api/admin/clients/:id
PATCH /api/admin/clients/:id
GET /api/admin/clients/:id/requests

---

## 7. Business Clients API

### Endpoints

GET /api/admin/business-clients
GET /api/admin/business-clients/:id
POST /api/admin/business-clients
PATCH /api/admin/business-clients/:id

---

## 8. AML API

### Endpoints

GET /api/admin/aml
GET /api/admin/aml/:requestId
POST /api/admin/aml/:requestId/check
PATCH /api/admin/aml/:requestId/decision

### AML Statuses

* Not checked
* Passed
* Manual review
* High risk
* Rejected

---

## 9. Partners API

### Endpoints

GET /api/admin/partners
GET /api/admin/partners/:id
POST /api/admin/partners
PATCH /api/admin/partners/:id

---

## 10. News API

Used for automated crypto market news.

### Endpoints

GET /api/news
GET /api/news/:slug
POST /api/admin/news/sync

### Sources

* Crypto market APIs
* RSS feeds
* Manual admin posts

---

## 11. Reports API

### Endpoints

GET /api/admin/reports/dashboard
GET /api/admin/reports/turnover
GET /api/admin/reports/profit
GET /api/admin/reports/countries
GET /api/admin/reports/operators

---

## 12. Telegram Bot API

Internal endpoints for Telegram bot.

### Endpoints

POST /api/bot/webhook
GET /api/bot/request/:publicId
POST /api/bot/request
POST /api/bot/support-message

---

# REQUEST LIFECYCLE

1. Created
2. Waiting for Crypto Payment
3. Crypto Received
4. AML Review
5. Ready for Payout
6. Payout Processing
7. Paid
8. Completed

Alternative statuses:

* Cancelled
* Failed
* On Hold

---

# PUBLIC REQUEST DATA

Public status page should show only:

* Public request ID
* Current status
* Crypto asset
* Payout country
* Payout method
* Estimated payout amount
* Created date
* Updated date

Never show sensitive recipient details publicly.

---

# SECURITY PRINCIPLES

## Admin API

* Authentication required
* Role-based access
* Action logging
* IP restrictions for critical roles
* 2FA in future version

## Public API

* Rate limiting
* Input validation
* Spam protection
* Request expiration
* No sensitive data leakage

---

# RATE CALCULATION LOGIC

Formula:

Market Rate - Margin = Client Rate

Example:

USDT/RUB market rate: 90.00
Margin: 2.5%
Client rate: 87.75

Client sends: 1000 USDT
Client receives: 87,750 RUB

---

# EXTERNAL INTEGRATIONS

## Rate Providers

* Binance API
* CoinGecko API
* Currency exchange API

## Crypto Monitoring

* Blockchain explorers
* Webhooks
* Node providers

## News Providers

* Crypto news APIs
* RSS feeds

## AML Providers

Future:

* Chainalysis
* Crystal
* Scorechain
* TRM Labs

---

# MVP API PRIORITIES

Version 1 must include:

1. Public rates API
2. Request creation API
3. Request status API
4. Admin requests API
5. Admin payout status API
6. Admin rates management API
7. Basic reports API

Telegram Bot API and AML integrations can be added after the website MVP.
