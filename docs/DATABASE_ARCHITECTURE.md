# DATABASE ARCHITECTURE

## DATABASE

PostgreSQL

---

# TABLE: USERS

Stores platform users.

Fields:

* id
* uuid
* email
* password_hash
* role
* status
* created_at
* updated_at

Roles:

* owner
* admin
* operator
* finance_manager
* aml_manager
* support_manager

---

# TABLE: CLIENTS

Stores all clients.

Fields:

* id
* uuid
* type
* full_name
* company_name
* telegram
* email
* phone
* country
* risk_level
* notes
* created_at

Client Types:

* individual
* business

---

# TABLE: REQUESTS

Main business table.

Fields:

* id
* public_id
* client_id
* recipient_type
* crypto_asset
* network
* crypto_amount
* payout_country
* payout_currency
* payout_method
* payout_amount
* client_rate
* market_rate
* margin_percent
* margin_amount
* status
* operator_id
* created_at
* updated_at

---

# TABLE: RECIPIENTS

Stores payout recipients.

Fields:

* id
* request_id
* recipient_type
* full_name
* company_name
* country
* bank_name
* account_number
* card_number
* wallet_address
* notes

Recipient Types:

* individual
* legal_entity

---

# TABLE: CRYPTO_TRANSACTIONS

Stores blockchain transactions.

Fields:

* id
* request_id
* crypto_asset
* network
* wallet_address
* tx_hash
* expected_amount
* received_amount
* confirmations
* status
* detected_at

---

# TABLE: PAYOUTS

Stores fiat payouts.

Fields:

* id
* request_id
* recipient_id
* amount
* currency
* method
* status
* operator_id
* payout_reference
* created_at
* paid_at

Methods:

* bank_card
* personal_account
* corporate_account
* e_wallet
* cash_partner

---

# TABLE: BUSINESS_CLIENTS

Stores corporate client data.

Fields:

* id
* client_id
* company_name
* registration_number
* tax_number
* website
* industry
* monthly_volume
* manager_id
* created_at

---

# TABLE: PARTNERS

Local payout partners.

Fields:

* id
* name
* country
* currencies
* payout_methods
* daily_limit
* fee_percent
* status
* notes

---

# TABLE: RATES

Live rates.

Fields:

* id
* asset
* market_rate
* client_rate
* margin_percent
* source
* updated_at

---

# TABLE: AML_CHECKS

AML monitoring.

Fields:

* id
* request_id
* wallet_address
* risk_score
* risk_level
* decision
* notes
* checked_at

---

# TABLE: SUPPORT_TICKETS

Client support.

Fields:

* id
* client_id
* request_id
* subject
* message
* status
* assigned_to
* created_at

---

# TABLE: NEWS

Website news.

Fields:

* id
* title
* slug
* category
* source
* content
* image
* published_at

---

# TABLE: AUDIT_LOGS

Critical system actions.

Fields:

* id
* user_id
* action
* entity_type
* entity_id
* old_value
* new_value
* created_at

---

# CORE PRINCIPLE

Every request connects:

Client
↓
Crypto Transaction
↓
AML Check
↓
Payout
↓
Reports
↓
Audit Logs
