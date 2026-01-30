# Database Schema - Booking Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Database Schema](./schema.md)

This document contains complete SQL table definitions, constraints, indexes, and foreign keys for the Booking domain. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [Data Dictionary - Booking Domain](./data-dictionary-booking.md).**

---

## Booking Domain

### jurisdictions

```sql
CREATE TABLE jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- e.g., 'Federal USA', 'Minnesota', 'Wisconsin'
  overtime_rule_strategy VARCHAR(50) NOT NULL, -- e.g., 'Federal_40'
  weekly_reset_day INTEGER DEFAULT 0, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jurisdictions_active ON jurisdictions(is_active) WHERE is_active = true;
```

**Technical Constraints:**
- `weekly_reset_day` range: 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)

**Business Rules:**
- Implements Strategy Pattern for overtime calculation
- System loads the correct calculator strategy at runtime based on the project's jurisdiction
- The `jurisdictions` table handles Identity (name) and Overtime Strategy (weekly reset day, overtime rule strategy) only
- **Important:** The `jurisdictions` table is NOT used for break/lunch policy validation. Break/lunch policies use the self-attestation model (see [Epic 2: Story 2.9](../prd/epic-2.md#story-29-lender-policy-configuration)). The `jurisdictions` table is used exclusively for:
  - Overtime calculation strategy selection
  - Holiday calendar definitions (via `holiday_calendar` table)
  - Business day calculations
- **Note:** The `company_break_lunch_policies` table references `jurisdiction_id` to allow lenders to configure different policies per jurisdiction, but this is for organizational purposes only. The jurisdiction reference does NOT trigger any state law validation - lenders self-attest compliance for all policies regardless of jurisdiction.

### holiday_calendar

```sql
CREATE TABLE holiday_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  holiday_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique holidays per jurisdiction
  CONSTRAINT unique_holiday_per_jurisdiction UNIQUE (jurisdiction_id, holiday_date)
);

CREATE INDEX idx_holiday_calendar_jurisdiction_id ON holiday_calendar(jurisdiction_id);
CREATE INDEX idx_holiday_calendar_date ON holiday_calendar(holiday_date) WHERE is_active = true;
CREATE INDEX idx_holiday_calendar_active ON holiday_calendar(is_active) WHERE is_active = true;
```

**Technical Constraints:**
- `holiday_date` must be a valid DATE
- Unique constraint ensures no duplicate holidays per jurisdiction
- Foreign key to `jurisdictions` table ensures referential integrity

**Business Rules:**
- Holidays are defined per jurisdiction (MN/WI for MVP)
- Holidays exclude dates from business day calculations
- Used for: Withdrawal timing (T+2 business days), recall notice business day calculations
- **Note:** Holiday calendar does NOT affect auto-approval timing. Auto-approval occurs exactly 4 hours after clock-out regardless of weekends, holidays, or business days.
- System checks holiday calendar when calculating business days for withdrawal timing and recall notice periods
- Active holidays (`is_active = true`) are included in business day calculations

### projects

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE, -- Borrower Company
  address TEXT NOT NULL,
  timezone VARCHAR(50) NOT NULL, -- e.g., 'America/Chicago'
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_jurisdiction_id ON projects(jurisdiction_id);
```

**Business Rules:**
- **Timezone Authority:** The `timezone` field is authoritative for all booking times. All shift start/end times, availability windows, and time-based calculations use the project's timezone as the source of truth. While timestamps are stored in UTC in the database, all time-based calculations and business logic use the project's timezone.

### bookings

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  borrower_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lender_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL, 
    -- ENUM: 'Pending_Payment', 'Confirmed', 'Active', 'Suspended_Insurance', 'Disputed', 'Payment_Paused_Dispute', 'Completed', 'Cancelled'
  funded_period_end TIMESTAMP, -- nullable, for weekly progress payments
  payment_type VARCHAR(50) NOT NULL, -- ENUM: 'Full_Upfront' | 'Weekly_Progress'
  currency_code VARCHAR(3) NOT NULL DEFAULT 'USD', -- ISO 4217
  termination_notice_days INTEGER, -- Copied from Lender's company settings at booking creation. Required business-day notice period for Borrower-initiated cancellation on Long-Term bookings (Default: 3 days).
  cancelled_at TIMESTAMP, -- nullable, timestamp when booking was cancelled (for Fulfillment Score metric)
  cancelled_by UUID REFERENCES users(id), -- nullable, user who cancelled booking (Lender vs Borrower tracking)
  primary_site_contact_id UUID REFERENCES users(id), -- nullable, primary site contact for operational communication (gate codes, running late, etc.)
  ot_terms_snapshot JSONB, -- Snapshot of OT rules at booking creation: { "daily_rule": boolean, "weekly_rule": boolean, "weekend_rule": boolean, "ot_rate": number }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT bookings_date_range_check CHECK (end_date >= start_date)
);

CREATE INDEX idx_bookings_project_id ON bookings(project_id);
CREATE INDEX idx_bookings_worker_id ON bookings(worker_id);
CREATE INDEX idx_bookings_borrower_company_id ON bookings(borrower_company_id);
CREATE INDEX idx_bookings_lender_company_id ON bookings(lender_company_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_weekly_payment ON bookings(payment_type, status, funded_period_end) 
  WHERE payment_type = 'Weekly_Progress';
CREATE INDEX idx_bookings_cancelled ON bookings(status, cancelled_at, cancelled_by) 
  WHERE status = 'Cancelled';
CREATE INDEX idx_bookings_primary_site_contact ON bookings(primary_site_contact_id);
CREATE INDEX idx_bookings_ot_terms ON bookings USING GIN(ot_terms_snapshot);
CREATE INDEX idx_bookings_availability_check ON bookings(worker_id, status, start_date, end_date)
  WHERE status IN ('Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance');
```

**Technical Constraints:**
- `cancelled_at` and `cancelled_by` are nullable (only populated when booking is cancelled)
- `cancelled_by` tracks who initiated cancellation (Lender vs Borrower) for Fulfillment Score metric calculation
- `ot_terms_snapshot` must be populated at checkout (enforced at application level)
- `ot_terms_snapshot` JSONB structure: `{ "daily_rule": boolean, "weekly_rule": boolean, "weekend_rule": boolean, "ot_rate": number }`. The `ot_rate` value is a specific dollar amount (e.g., 52.50 for $52.50) that comes directly from `worker_rates.overtime_rate` at checkout. The system does NOT use a 1.5x multiplier or any platform-calculated multiplier. OT rates are specific dollar amounts defined by lenders, not calculated percentages.

**Technical Constraints:**
- `end_date >= start_date` - Enforced at database level with CHECK constraint (Row-Local Truth: `CONSTRAINT bookings_date_range_check CHECK (end_date >= start_date)`)
- `currency_code` - Enforced at Application Level (Relational Check: must match borrower company's `default_currency`)
- `worker_id` - Enforced at Application Level (Relational Check: must be a member of `lender_company_id`)

> **Note:** For business rationale behind currency consistency, worker-lender relationship, and date range validation rules, see [Data Integrity & Business Rules](../prd/goals-and-background-context.md#data-integrity--business-rules).
- `status` ENUM: 'Pending_Payment', 'Confirmed', 'Active', 'Suspended_Insurance', 'Disputed', 'Payment_Paused_Dispute', 'Completed', 'Cancelled'
- `payment_type` ENUM: 'Full_Upfront', 'Weekly_Progress'

> **Note:** For the authoritative State Machine diagram, transition rules, and validation logic, see [Data Dictionary - Booking Domain](./data-dictionary-booking.md#booking-status-state-machine).

**Business Rules:**
- `status` is the **authoritative source of truth** for booking status. The status column stores the current state directly - it is NOT derived from events or calculated on-the-fly. Status transitions must be performed via database transactions that:
  1. Validate the transition is allowed (application-level validation)
  2. Update the `bookings.status` column directly (authoritative source)
  3. Insert a record into the `audit_log` table to track the history with `previous_value`, `new_value`, and `reason` in the metadata JSONB field
- The `audit_log` table provides a chronological audit trail for compliance and debugging, but the current status is always read from the `bookings.status` column, not from event history. See [Data Dictionary - Booking Domain](./data-dictionary-booking.md#booking-status-state-machine) for complete state machine definitions and transition rules.
- `termination_notice_days` is used for long-term booking cancellation logic. When a Borrower initiates cancellation on a Long-Term booking, the system enforces the notice period (in business days) defined by this field. The value is copied from the Lender's company settings at the time of booking creation, ensuring that the notice period requirement is locked in for the duration of the booking.
- `ot_terms_snapshot` stores the Pre-Authorized Contract terms agreed upon at checkout. **Business Rule:** This must be populated at Checkout. The Borrower must strictly accept these terms to create the booking. The snapshot ensures that OT rules cannot change mid-booking, even if the Lender's company settings change later. The `ot_rate` value comes directly from `worker_rates.overtime_rate` at the time of checkout (a specific dollar amount, not a calculated multiplier).
- `primary_site_contact_id` designates the person the worker contacts for operational issues (gate codes, running late, site access). This is separate from verification authority, which is role-based (any Supervisor, Manager, or Admin in the Borrower Company can verify timesheets). Site Contact can be changed by Company Admins and Managers at any time.

**Critical Index for Search Availability:**
- `idx_bookings_availability_check` - **Purpose:** Optimizes the `NOT EXISTS` subquery in worker search queries that checks for conflicting bookings. This partial index (WHERE clause) only indexes bookings in blocking statuses (`Confirmed`, `Active`, `Pending_Payment`, `Payment_Paused_Dispute`, `Suspended_Insurance`), reducing index size and improving query performance. The column order (`worker_id`, `status`, `start_date`, `end_date`) is optimized for the availability check query pattern used by PostgreSQL native search. This index is critical for real-time availability checking - without it, search queries will be significantly slower. See [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) and [Performance Optimization](./performance-optimization.md) for details.


---

**Back to:** [Database Schema](./schema.md)
