# TELEGRAM BOT ARCHITECTURE

## PURPOSE

The Telegram Bot is the fastest client interaction channel for PayBridge.

The bot must help clients:

* Calculate payout amount
* Create payout request
* Track request status
* Contact support
* Join referral program

---

# BOT POSITIONING

The bot is not a separate product.

The bot is an extension of the PayBridge platform.

Website builds trust.

Bot converts users into requests.

---

# MAIN MENU

## Buttons

* Create Request
* Calculate Rate
* Request Status
* Business Payments
* Support
* Referral Program
* FAQ

---

# USER FLOW: CREATE REQUEST

## Step 1

User clicks:

Create Request

---

## Step 2

Bot asks:

Who is the recipient?

Options:

* Individual
* Legal Entity / Organization

---

## Step 3

Bot asks:

Select payout country:

* Russia
* Kazakhstan
* Uzbekistan
* Azerbaijan
* Kyrgyzstan

---

## Step 4

Bot asks:

Select payout method:

* Bank card
* Personal bank account
* Corporate bank account
* Electronic wallet
* Cash via partner

---

## Step 5

Bot asks:

Select cryptocurrency:

* USDT
* BTC
* ETH
* TON
* TRX
* USDC
* LTC

---

## Step 6

Bot asks:

Select network:

* TRC20
* ERC20
* BEP20
* TON
* BTC
* LTC

---

## Step 7

Bot asks:

Enter amount.

---

## Step 8

Bot shows calculation:

* Crypto amount
* Payout country
* Payout method
* Market rate
* Client rate
* Final payout amount
* Rate expiration time
* Estimated payout time

---

## Step 9

Bot asks user to enter recipient details.

### For Individual

* Full name
* Card number / bank account / wallet
* Bank name
* Phone if required

### For Organization

* Company name
* Country
* Bank name
* Corporate bank account
* Tax ID / registration number if required
* Payment purpose / invoice number if required

---

## Step 10

Bot creates request and returns:

* Request ID
* Crypto asset
* Network
* Wallet address
* Amount to send
* Rate expiration time
* Status tracking link

---

# USER FLOW: CALCULATE RATE

User selects:

* Cryptocurrency
* Amount
* Payout country
* Payout method
* Recipient type

Bot returns:

* Client rate
* Estimated payout amount
* Estimated processing time

---

# USER FLOW: REQUEST STATUS

User enters Request ID.

Bot returns:

* Current status
* Last update
* Next step
* Support button

---

# REQUEST STATUSES

* Created
* Waiting for Crypto Payment
* Crypto Received
* AML Review
* Ready for Payout
* Payout Processing
* Paid
* Completed
* Cancelled
* Failed
* On Hold

---

# BUSINESS PAYMENTS FLOW

User clicks:

Business Payments

Bot shows:

PayBridge supports crypto payouts to:

* Corporate bank accounts
* Suppliers
* Contractors
* Agencies
* IT companies
* Importers
* Exporters

Bot offers:

* Create Business Request
* Contact Manager
* Upload Invoice
* Learn More

---

# SUPPORT FLOW

User clicks:

Support

Options:

* Question about request
* Business payment
* Rate question
* Technical issue
* Other

Support messages must be visible in Admin Panel.

---

# REFERRAL PROGRAM

Future feature.

User receives:

* Personal referral link
* Invited users count
* Referral volume
* Earned commission

---

# ADMIN NOTIFICATIONS

Bot must notify operators about:

* New request created
* Crypto payment received
* High amount request
* Business payout request
* AML review required
* Support message received

---

# CLIENT NOTIFICATIONS

Bot must notify client when:

* Request created
* Crypto payment received
* Request moved to AML review
* Payout processing started
* Payout completed
* Request cancelled
* Operator replied

---

# SECURITY

The bot must never show sensitive recipient details publicly.

The bot must use private chat only.

For high-value transactions, operator confirmation is required.

---

# MVP BOT FEATURES

Version 1 must include:

1. Calculate rate
2. Create request
3. Show wallet address
4. Track request status
5. Contact support
6. Notify operators

Future:

* Referral program
* Business client cabinet
* Invoice upload
* Mass payouts
* API access
