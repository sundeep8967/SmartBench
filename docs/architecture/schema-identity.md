# Database Schema - Identity Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Database Schema](./schema.md)

This document contains complete SQL table definitions, constraints, indexes, and foreign keys for the Identity domain. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [Data Dictionary - Identity Domain](./data-dictionary-identity.md).**

---

## Identity Domain

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  mobile_number VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  user_state VARCHAR(50) NOT NULL DEFAULT 'Invited', 
    -- ENUM Values: 'Invited', 'Pending_Profile', 'Profile_Complete', 'Listed', 'Banned'
  stripe_identity_id VARCHAR(255), -- nullable, for KYC verification
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_email_or_mobile CHECK (
    email IS NOT NULL OR mobile_number IS NOT NULL
  )
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile_number ON users(mobile_number);
CREATE INDEX idx_users_user_state ON users(user_state);
```

**Technical Constraints:**
- User must have either `email` OR `mobile_number` (enforced by CHECK constraint)
- `email` must be UNIQUE when present
- `mobile_number` must be UNIQUE when present
- For Workers: `mobile_number` is required (primary identifier)
- For non-Workers: Either `email` or `mobile_number` is required
- `user_state` ENUM: 'Invited', 'Pending_Profile', 'Profile_Complete', 'Listed', 'Banned'
- `user_state` is a **persisted column** that stores the current state directly - it is NOT derived from events or calculated on-the-fly. State transitions are performed via database transactions that update this column directly and log the change to the `audit_log` table.

### companies

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  ein VARCHAR(50), -- Employer Identification Number
  address TEXT,
  default_currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- ISO 4217
  strikes_count INTEGER DEFAULT 0, -- Read-only cached value, updated via trigger on company_strikes table INSERT/DELETE or application logic
  min_billable_hours INTEGER DEFAULT 4,
  break_policy_type VARCHAR(50),
  break_duration_minutes INTEGER,
  break_required_after_hours INTEGER,
  lunch_policy_type VARCHAR(50),
  lunch_duration_minutes INTEGER,
  lunch_required_after_hours INTEGER,
  ot_rate_type VARCHAR(50) DEFAULT 'No_OT', -- ENUM: 'No_OT', 'Custom_Rate'
  ot_rule_daily BOOLEAN DEFAULT FALSE, -- True = Apply OT rate after 8 hours/day
  ot_rule_weekly BOOLEAN DEFAULT FALSE, -- True = Apply OT rate after 40 hours/week
  ot_rule_weekend BOOLEAN DEFAULT FALSE, -- True = Apply OT rate on Sat/Sun
  trial_policy VARCHAR(50) DEFAULT '4_Hours', -- ENUM: 'None', '2_Hours', '4_Hours'
  no_show_fee_hours DECIMAL(4,2) DEFAULT 4.0, -- Lender-configurable no-show fee in hours
  tax_exempt_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_companies_ein ON companies(ein);
```

**Technical Constraints:**
- `ein` - Enforced at Application Level (Relational Check: business rule requires uniqueness validation, may query existing companies)
- `strikes_count` is a read-only cached value updated via trigger on `company_strikes` table INSERT/DELETE operations, or via application logic if triggers are not used. The trigger logic: `UPDATE companies SET strikes_count = (SELECT COUNT(*) FROM company_strikes WHERE company_id = NEW.company_id) WHERE id = NEW.company_id;`
- `ot_rate_type` ENUM: 'No_OT', 'Custom_Rate'
- `ot_rule_daily`, `ot_rule_weekly`, `ot_rule_weekend` are boolean flags that define the Lender's OT Rules. These serve as the defaults for their workers. **OT Rate Configuration:** When `ot_rate_type = 'Custom_Rate'`, lenders configure specific dollar amounts for overtime rates per worker in the `worker_rates` table (`overtime_rate` field). The system does NOT use a 1.5x multiplier or any platform-calculated multiplier. OT rates are specific dollar amounts (e.g., $52.50), not calculated percentages. At checkout, these rules are snapshotted into `bookings.ot_terms_snapshot` along with the worker's `overtime_rate` to create the Pre-Authorized Contract.
- `trial_policy` ENUM: 'None', '2_Hours', '4_Hours' (default: '4_Hours')
- `no_show_fee_hours` DECIMAL(4,2) (default: 4.0) - Lender-configurable no-show fee in hours, used for both Supervisor No-Show and Worker No-Show scenarios
- **Policy Validation Rule:** Lenders must self-attest that their break/lunch policies comply with local labor laws via Terms of Service acceptance. No database-level validation is performed - lenders accept full liability for their policy configuration.
- **Trial Policy Rule:** Trial option (reject button) is only available for the first booking between a specific Borrower and Worker, and only on the first day of that booking

**Note on Policy Storage:**
- Break/lunch policies are stored directly on the `companies` table for backward compatibility. The `company_break_lunch_policies` table (defined below) supports multi-jurisdiction policy configurations (e.g., different policies for different states) and is the recommended approach for companies operating in multiple jurisdictions.

### company_break_lunch_policies

```sql
CREATE TABLE company_break_lunch_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  break_required_after_hours DECIMAL(4,2) NOT NULL,
  break_duration_minutes INTEGER NOT NULL,
  break_is_paid BOOLEAN DEFAULT FALSE,
  lunch_required_after_hours DECIMAL(4,2) NOT NULL,
  lunch_duration_minutes INTEGER NOT NULL,
  lunch_is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_company_jurisdiction_policy UNIQUE (company_id, jurisdiction_id)
);

CREATE INDEX idx_company_break_lunch_policies_company_id ON company_break_lunch_policies(company_id);
CREATE INDEX idx_company_break_lunch_policies_jurisdiction_id ON company_break_lunch_policies(jurisdiction_id);
CREATE INDEX idx_company_break_lunch_policies_company_jurisdiction ON company_break_lunch_policies(company_id, jurisdiction_id);
```

**Technical Constraints:**
- `(company_id, jurisdiction_id)` must be UNIQUE (one policy per company per jurisdiction)
- `break_required_after_hours` and `lunch_required_after_hours` are DECIMAL(4,2) to support fractional hours (e.g., 6.5 hours)
- `break_duration_minutes` and `lunch_duration_minutes` are INTEGER values in minutes
- `break_is_paid` and `lunch_is_paid` default to FALSE (unpaid breaks/lunches)
- **Policy Validation Rule:** Lenders must self-attest that their break/lunch policies comply with local labor laws via Terms of Service acceptance. No database-level validation is performed - lenders accept full liability for their policy configuration.

**Business Rules:**
- Supports multi-jurisdiction policy configurations (e.g., different policies for MN vs WI)
- Lenders can set any values for break/lunch parameters without database blocking
- Lenders must check a box certifying their policies comply with local labor laws (Self-Attestation)
- During booking checkout, lender's configured policies are displayed to borrowers for acknowledgment

### company_members

```sql
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  roles JSONB NOT NULL DEFAULT '[]', 
    -- Array of role strings: ['Admin', 'Manager', 'Supervisor', 'Worker']
  status VARCHAR(50) NOT NULL DEFAULT 'Invited',
    -- ENUM Values: 'Active', 'Invited', 'Suspended'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_status ON company_members(status);
CREATE INDEX idx_company_members_roles ON company_members USING GIN(roles);

-- Prevent concurrent active memberships (enforces sequential employment)
CREATE UNIQUE INDEX idx_company_members_one_active_per_user 
ON company_members(user_id) 
WHERE status = 'Active';
```

**Technical Constraints:**
- `(user_id, company_id)` must be UNIQUE (one membership record per user-company pair)
- `status` ENUM: 'Active', 'Invited', 'Suspended'
- `roles` stored as JSONB array
- **Sequential Employment Constraint:** A user can only have one `'Active'` company membership at a time. This is enforced at the database level via partial unique index `idx_company_members_one_active_per_user`. Sequential employment is supported (worker leaves Company A, then joins Company B), but concurrent employment is not allowed.

**Business Rules:**
- A user can only have one `'Active'` company membership at a time
- Sequential employment is supported: a worker can leave Company A (status changes to `'Suspended'` or `'Invited'`) and then join Company B (status becomes `'Active'`)
- Concurrent employment is prevented: a user cannot be `'Active'` at multiple companies simultaneously
- The partial unique index provides database-level enforcement, but application-level validation (using `validateSequentialEmployment()`) is still required for better error messages and user experience

### insurance_policies

```sql
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  insurance_type VARCHAR(50) NOT NULL, -- ENUM: 'General_Liability' | 'Workers_Compensation'
  expiration_date DATE NOT NULL,
  document_url TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_self_certified_by_lender BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_insurance_policies_company_id ON insurance_policies(company_id);
CREATE INDEX idx_insurance_policies_type_active ON insurance_policies(company_id, insurance_type, is_active) WHERE is_active = true;
```

**Technical Constraints:**
- `insurance_type` ENUM: 'General_Liability', 'Workers_Compensation'
- Only one policy of a specific `insurance_type` per `company_id` can be `is_active = true` - Enforced at Application Level (Relational Check: requires querying existing active policies for the company)

> **Note:** For business rationale behind the active insurance policy uniqueness rule, see [Data Integrity & Business Rules](../prd/goals-and-background-context.md#active-insurance-policy-uniqueness).

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### password_reset_tokens

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

### magic_link_tokens

```sql
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  mobile_number VARCHAR(20),
  purpose VARCHAR(50) NOT NULL, -- ENUM: 'onboarding', 'verification', 'password_reset'
  target_id UUID, -- e.g., timesheet_id for verification
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_magic_link_tokens_token_hash ON magic_link_tokens(token_hash);
CREATE INDEX idx_magic_link_tokens_user_id ON magic_link_tokens(user_id);
CREATE INDEX idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);
```

**Technical Constraints:**
- `token_hash` must be UNIQUE
- `purpose` ENUM: 'onboarding', 'verification', 'password_reset'

### user_preferences

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timezone VARCHAR(50), -- e.g., 'America/Chicago'
  quiet_hours_start TIME, -- e.g., '22:00:00'
  quiet_hours_end TIME, -- e.g., '07:00:00'
  sms_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

**Technical Constraints:**
- `user_id` must be UNIQUE (one preferences record per user)
- `timezone` uses IANA timezone database format (e.g., 'America/Chicago')
- `quiet_hours_start` and `quiet_hours_end` are TIME values (24-hour format)

> **Note:** Notification-related tables (`notification_preferences`, `notification_logs`, `notification_inbox`) have been moved to the Notifications domain. See [schema-notifications.md](./schema-notifications.md) for complete definitions.

### onboarding_sessions

```sql
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1, -- 1-4
  step_data JSONB NOT NULL DEFAULT '{}', -- Store data for each step
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Auto-expire after 30 days
);

CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_company_id ON onboarding_sessions(company_id);
```

**Technical Constraints:**
- `current_step` range: 1-4

### user_agreements

```sql
CREATE TABLE user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_type VARCHAR(50) NOT NULL, -- ENUM: 'Tax_Exemption', 'Insurance_Waiver', 'Labor_Law_Compliance', etc.
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);
CREATE INDEX idx_user_agreements_type ON user_agreements(agreement_type);
```

**Technical Constraints:**
- `agreement_type` examples: 'Tax_Exemption', 'Insurance_Waiver', 'Labor_Law_Compliance'

**Business Rules:**
- **Labor Law Compliance Self-Attestation:** When `agreement_type = 'Labor_Law_Compliance'`, this records that a Lending Admin has self-attested that their company's break/lunch policies comply with local labor laws via Terms of Service acceptance. This provides an audit trail for compliance purposes.
- **Self-Attestation Requirements:** Self-attestation is required when break/lunch policies are first configured and when they are updated. Each policy update creates a new `user_agreements` record with `agreement_type = 'Labor_Law_Compliance'` to maintain a complete audit trail.
- **Multi-Jurisdiction Policies:** For companies using `company_break_lunch_policies` table with different policies per jurisdiction, self-attestation is required **once globally** (not per jurisdiction). The single self-attestation covers all jurisdictions where the company operates, as the lender accepts full liability for all policy configurations across all jurisdictions.

### webauthn_credentials

```sql
CREATE TABLE webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id VARCHAR(255) NOT NULL UNIQUE, -- Base64URL encoded credential ID
  public_key BYTEA NOT NULL, -- Public key for credential verification
  counter BIGINT NOT NULL DEFAULT 0, -- Prevents replay attacks
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
```

**Technical Constraints:**
- `credential_id` must be UNIQUE
- `counter` must be incremented after each successful authentication to prevent replay attacks

### webauthn_challenges

```sql
CREATE TABLE webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge VARCHAR(255) NOT NULL, -- SHA-256 hash of challenge (base64URL encoded)
  purpose VARCHAR(50) NOT NULL, -- ENUM: 'registration', 'authentication'
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
```

**Technical Constraints:**
- `purpose` ENUM: 'registration', 'authentication'
- Challenges expire after 5 minutes to prevent replay attacks
- Challenges should be deleted after successful use

---

**Back to:** [Database Schema](./schema.md)
