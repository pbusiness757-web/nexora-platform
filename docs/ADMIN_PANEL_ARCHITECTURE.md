# SITE ARCHITECTURE

## PROJECT GOAL

Create the most trusted Crypto-to-Bank payout platform in the CIS region.

Primary focus:

* Business payouts
* Supplier payments
* Contractor payments
* Corporate bank account payouts
* Individual payouts

---

# WEBSITE STRUCTURE

## Home

/

### Sections

1. Hero Section
2. Live Exchange Calculator
3. Supported Countries
4. Business Solutions
5. How It Works
6. Live Market Rates
7. Crypto Market News
8. Advantages
9. Testimonials
10. FAQ
11. Footer

---

## Exchange Calculator

/exchange

Functions:

* Select cryptocurrency
* Select payout country
* Select payout method
* Real-time rates
* Estimated payout
* Create application

---

## Business Solutions

/business

Services:

* Supplier Payments
* Contractor Payments
* Payroll Payments
* Bulk Payouts
* Corporate Settlements

---

## Countries

/countries

### Country Pages

/russia
/kazakhstan
/uzbekistan
/azerbaijan
/kyrgyzstan

---

## Rates

/rates

Live:

* BTC
* ETH
* USDT
* TON
* TRX
* USDC
* LTC

Currencies:

* RUB
* KZT
* UZS
* AZN
* KGS

---

## News

/news

Categories:

* Bitcoin
* Ethereum
* Stablecoins
* Regulation
* Market Analysis

---

## Blog

/blog

SEO Content

---

## AML Policy

/aml-policy

---

## FAQ

/faq

---

## Contacts

/contacts

---

# MAIN DIFFERENTIATOR

Crypto payments to:

* Corporate bank accounts
* Business entities
* Suppliers
* Contractors
* Individuals

---

# DESIGN DIRECTION

Premium Fintech

Dark Theme

3D Visuals

Global Payment Network

Banking Infrastructure

Corporate Focus

# ADMIN PANEL ARCHITECTURE

## PURPOSE

The Admin Panel is the operational core of PayBridge.

The website attracts clients.

The Admin Panel processes money, applications, payouts, rates, clients, AML checks and reports.

---

# OPERATING MODEL

Model B: Semi-Automated Operations

Flow:

1. Client creates payout request
2. System generates crypto payment details
3. Client sends cryptocurrency
4. System detects incoming transaction
5. Operator verifies the request
6. Operator performs fiat payout
7. Operator marks request as completed
8. Client receives status update

---

# MAIN ADMIN SECTIONS

## 1. Dashboard

Main overview screen.

### Metrics

* Active requests
* Pending crypto payments
* Crypto received
* AML review required
* Ready for payout
* Payouts in progress
* Completed today
* Cancelled today
* Total daily turnover
* Daily gross profit
* Average payout time

### Business Metrics

* Corporate payouts today
* Individual payouts today
* Total corporate payout volume
* Total individual payout volume

---

## 2. Requests

The most important section.

### Request Table Columns

* Request ID
* Date / Time
* Client
* Client Type
* Recipient Type
* Crypto Asset
* Crypto Amount
* Crypto Network
* Payout Country
* Payout Currency
* Payout Method
* Client Rate
* Estimated Payout Amount
* Status
* Assigned Operator

### Client Type

* Individual
* Business

### Recipient Type

* Individual
* Legal Entity / Organization

### Statuses

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

## 3. Request Details

Detailed page for each request.

### Main Information

* Request ID
* Creation date
* Current status
* Client contact
* Client type
* Recipient type
* Assigned operator

### Crypto Payment Information

* Crypto asset
* Network
* Wallet address
* Expected amount
* Received amount
* Transaction hash
* Confirmations
* Blockchain status

### Payout Information

* Country
* Currency
* Method
* Recipient full name / company name
* Bank name
* Card number
* Bank account number
* Corporate bank account details
* E-wallet details
* Cash pickup details

### Financial Information

* Market rate
* Client rate
* Margin percentage
* Margin amount
* Payout amount
* Internal cost
* Gross profit

### Operator Actions

* Mark crypto as received
* Send to AML review
* Approve payout
* Mark payout as processing
* Mark as paid
* Complete request
* Cancel request
* Put on hold
* Add internal note

---

## 4. Clients

Client database.

### Client Fields

* Client ID
* Name
* Telegram
* Email
* Phone
* Client type
* Country
* Registration date
* Total requests
* Total volume
* Total profit
* Risk level
* Notes

### Client Types

* Individual
* Business

### Client Risk Levels

* Low
* Medium
* High
* Blocked

---

## 5. Business Clients

Separate section for organizations and high-value clients.

### Business Client Fields

* Company name
* Country
* Contact person
* Telegram
* Email
* Website
* Industry
* Average monthly volume
* Preferred payout countries
* Preferred payout methods
* Verification status
* Dedicated manager
* Notes

### Business Use Cases

* Supplier payments
* Contractor payments
* Mass payouts
* Corporate settlements
* Invoice payments

---

## 6. Payouts

Operational payout management.

### Payout Table Columns

* Payout ID
* Request ID
* Recipient type
* Recipient name / company name
* Country
* Currency
* Amount
* Method
* Status
* Operator
* Created at
* Paid at

### Payout Methods

* Bank card
* Personal bank account
* Corporate bank account
* Electronic wallet
* Cash via partner

### Payout Statuses

* Waiting
* Processing
* Paid
* Failed
* Cancelled
* On Hold

---

## 7. Rates

Rate management and margin control.

### Crypto Rates

* BTC
* ETH
* USDT
* USDC
* TON
* TRX
* LTC

### Fiat Currencies

* RUB
* KZT
* UZS
* AZN
* KGS

### Rate Fields

* Market rate
* Source
* Last update time
* Margin percentage
* Client rate
* Manual override
* Active / inactive

### Margin Rules

Default margin:

* Individual clients: 2% - 5%
* Business clients: 1% - 3%
* VIP / high-volume clients: custom

### Important

The client never sees complex pricing logic.

The client sees only final payout amount.

---

## 8. AML / Risk

AML and transaction risk control.

### AML Fields

* Request ID
* Client
* Wallet address
* Transaction hash
* Risk score
* Risk category
* Source of funds status
* Operator decision
* Notes

### AML Statuses

* Not checked
* Passed
* Manual review
* High risk
* Rejected

### Risk Categories

* Clean
* Exchange
* Mixer
* Darknet
* Scam
* Sanctioned entity
* Unknown

---

## 9. Partners

Partners are used for local payouts, cash payouts and liquidity.

### Partner Fields

* Partner ID
* Name
* Country
* Supported currencies
* Supported payout methods
* Daily limit
* Monthly limit
* Current available balance
* Fee
* Status
* Contact person
* Notes

### Partner Statuses

* Active
* Limited
* Paused
* Blocked

---

## 10. Reports

Financial analytics and operational reporting.

### Reports

* Daily turnover
* Weekly turnover
* Monthly turnover
* Profit by country
* Profit by currency
* Profit by crypto asset
* Profit by payout method
* Profit by operator
* Corporate payout volume
* Individual payout volume
* Cancelled requests
* Failed payouts

---

## 11. Operators

Internal team management.

### Operator Fields

* Name
* Email
* Telegram
* Role
* Status
* Created at
* Last login

### Roles

* Owner
* Admin
* Operator
* Finance Manager
* AML Manager
* Support Manager
* Read Only

---

## 12. Support

Client communication and internal notes.

### Support Functions

* View client messages
* Add internal notes
* Attach files
* Mark issue as resolved
* Escalate to manager

---

## 13. Settings

System settings.

### Settings

* Supported countries
* Supported currencies
* Supported crypto assets
* Supported networks
* Minimum request amount
* Maximum request amount
* Default margin
* Business margin
* VIP margin
* Rate update interval
* Request expiration time
* Maintenance mode

---

# SECURITY REQUIREMENTS

## Access Control

* Admin login required
* Role-based permissions
* Two-factor authentication
* Action logs
* IP restrictions for critical roles

## Audit Log

Every critical action must be logged:

* Status change
* Rate change
* Margin change
* Payout approval
* Payout completion
* AML decision
* Client risk level change

---

# MVP ADMIN PANEL

Version 1 must include:

1. Dashboard
2. Requests
3. Request Details
4. Payouts
5. Rates
6. Clients
7. Reports
8. Settings

AML, Partners, Business Clients and advanced roles can be added in Version 2.

---

# CORE PRINCIPLE

The Admin Panel must be built around requests.

Every operation starts with a request.

Every request connects:

* Client
* Crypto transaction
* Rate
* Margin
* Payout
* Status
* Operator
* Report
