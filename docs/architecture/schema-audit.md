# Database Schema - Audit & Logging Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Database Schema](./schema.md)

This document contains complete SQL table definitions, constraints, indexes, and foreign keys for the Audit & Logging domain. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [Data Dictionary - Audit & Logging Domain](./data-dictionary-audit.md).**

---

## Audit & Logging Domain

### ratings

```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rater_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rated_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES users(id), -- nullable, for worker ratings
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  attitude INTEGER CHECK (attitude >= 1 AND attitude <= 5),
  effort INTEGER CHECK (effort >= 1 AND effort <= 5),
  teamwork INTEGER CHECK (teamwork >= 1 AND teamwork <= 5),
  skills_ratings JSONB, -- Per-skill ratings
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Technical Constraints:**
- `punctuality`, `attitude`, `effort`, `teamwork` - Enforced at database level with CHECK constraints (Row-Local Truth: each must be between 1 and 5, e.g., `CHECK (punctuality >= 1 AND punctuality <= 5)`)

**JSON Schema for `skills_ratings`:**

The `skills_ratings` field stores an array of skill rating objects. Each object represents a rating for a specific skill that was used during the booking.

**Structure:**
```json
[
  {
    "skill_id": "uuid",
    "skill_name": "string",
    "rating": 1-5,
    "years_experience_used": "decimal"
  }
]
```

**Field Definitions:**
- `skill_id` (UUID, required) - Reference to the skill from the skills hierarchy. Must reference a valid skill ID from the skills system.
- `skill_name` (string, required) - Human-readable skill name (e.g., "Carpentry", "Painting", "Electrical"). Stored for display purposes and audit trail.
- `rating` (integer, required) - Rating value between 1 and 5. Must be validated at application level to ensure value is in range [1, 5].
- `years_experience_used` (decimal, optional) - Years of experience demonstrated for this skill during the booking. Used for context but not required.

**Validation Rules:**
- Array must contain at least one skill rating object (if skills_ratings is not null)
- Each `rating` value must be between 1 and 5 (enforced at application level)
- Each `skill_id` must reference a valid skill from the skills hierarchy (enforced at application level)
- Duplicate `skill_id` values within the same array are not allowed (enforced at application level)

**Example:**
```json
[
  {
    "skill_id": "550e8400-e29b-41d4-a716-446655440000",
    "skill_name": "Carpentry",
    "rating": 5,
    "years_experience_used": 8.5
  },
  {
    "skill_id": "660e8400-e29b-41d4-a716-446655440001",
    "skill_name": "Framing",
    "rating": 4,
    "years_experience_used": 6.0
  }
]
```

**Business Rules:**
- Skills rated are those **actually used on the job** during the booking (see [Epic 5: Story 5.11](../prd/epic-5.md#story-511-rating-system) for complete business rules)
- Skills rating is collected once per booking (after final shift), not per shift
- Supervisor rates all skills used across the entire booking
- Skills ratings are aggregated for worker profiles to show skill-specific ratings (e.g., "Carpentry: 5/5 (3 ratings)")

**Database Index:**
- Consider adding a GIN index on `skills_ratings` for efficient querying: `CREATE INDEX idx_ratings_skills_ratings ON ratings USING GIN(skills_ratings);`

CREATE INDEX idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX idx_ratings_rated_company_id ON ratings(rated_company_id);
CREATE INDEX idx_ratings_rated_user_id ON ratings(rated_user_id);
```

**Technical Constraints:**
- `punctuality`, `attitude`, `effort`, `teamwork` - Enforced at database level with CHECK constraints (Row-Local Truth: each must be between 1 and 5, e.g., `CHECK (punctuality >= 1 AND punctuality <= 5)`)

### disputes

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  time_log_id UUID REFERENCES time_log(id),
  supervisor_id UUID NOT NULL REFERENCES users(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  dispute_option VARCHAR(20) NOT NULL, -- ENUM: 'Option_A', 'Option_B' - REQUIRED for Fork in the Road logic
  status VARCHAR(50) NOT NULL, -- ENUM: 'Open', 'Resolved', 'Arbitration'
  dispute_filed_at TIMESTAMP DEFAULT NOW(), -- Timestamp when dispute was filed (for Resolution Timer)
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_disputes_booking_id ON disputes(booking_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_dispute_option ON disputes(dispute_option);
CREATE INDEX idx_disputes_dispute_filed_at ON disputes(dispute_filed_at) WHERE status = 'Open';
```

**Technical Constraints:**
- `dispute_option` ENUM: 'Option_A' (Dispute Shift Only - Booking remains Active), 'Option_B' (End Booking & Dispute - Booking immediately Cancelled)
- `status` ENUM: 'Open', 'Resolved', 'Arbitration'
- **Fork in the Road Logic:** The `dispute_option` field is REQUIRED and determines booking status immediately upon dispute filing:
  - `Option_A`: Booking remains `Active`, worker CAN clock in for future shifts, only disputed shift funds frozen
  - `Option_B`: Booking immediately transitions to `Cancelled`, worker released, total freeze (disputed shift + cancellation penalty)

### incidents

```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  time_log_id UUID REFERENCES time_log(id), -- nullable, can be filed during or after shift
  supervisor_id UUID NOT NULL REFERENCES users(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  severity VARCHAR(20) NOT NULL, -- ENUM: 'Warning', 'Critical' - REQUIRED
  type VARCHAR(50) NOT NULL, -- ENUM: 'Injury', 'Property_Damage', 'Tardiness', 'Workmanship', 'Conduct' - REQUIRED
  notes TEXT NOT NULL, -- Required text field
  photos JSONB, -- Optional array of photo URLs
  dispute_option VARCHAR(20), -- ENUM: 'Option_A', 'Option_B' - REQUIRED for Critical incidents only
  status VARCHAR(50) NOT NULL, -- ENUM: 'Open', 'Resolved', 'Arbitration'
  incident_filed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  lending_admin_vetoed_at TIMESTAMP, -- Timestamp when Lending Admin exercised veto (Critical incidents, Option A only)
  lending_admin_vetoed_by UUID REFERENCES users(id) -- Lending Admin who exercised veto
);

CREATE INDEX idx_incidents_booking_id ON incidents(booking_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_incident_filed_at ON incidents(incident_filed_at) WHERE status = 'Open';
```

**Technical Constraints:**
- `severity` ENUM: 'Warning' (logged only, no fund freeze), 'Critical' (triggers Fork in the Road)
- `type` ENUM: 'Injury', 'Property_Damage', 'Tardiness', 'Workmanship', 'Conduct'
- `dispute_option` ENUM: 'Option_A' (Keep Worker - Booking remains Active), 'Option_B' (End Booking - Booking immediately Cancelled). **REQUIRED for Critical incidents only.** NULL for Warning-level incidents.
- `status` ENUM: 'Open', 'Resolved', 'Arbitration'
- **Severity-Based Logic:**
  - **If Severity == Warning:** Log incident, Notify Admins, Booking remains Active. No fund freeze. `dispute_option` is NULL.
  - **If Severity == Critical:** Trigger Fork in the Road. `dispute_option` is REQUIRED.
- **Fork in the Road Logic (Critical Only):** The `dispute_option` field is REQUIRED for Critical incidents and determines booking status immediately upon incident filing:
  - `Option_A`: Booking remains `Active`, worker CAN clock in for future shifts, only current shift funds frozen. **Lending Admin Veto:** If Option A selected, Lending Admin receives Urgent Alert and can veto within 24 hours, which immediately cancels booking.
  - `Option_B`: Booking immediately transitions to `Cancelled`, worker released, total freeze (current shift + cancellation penalty)

### company_strikes

```sql
CREATE TABLE company_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  strike_type VARCHAR(50) NOT NULL, -- ENUM: 'Recall_Notice', 'Cancellation', etc.
  strike_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_company_strikes_company_id ON company_strikes(company_id);
CREATE INDEX idx_company_strikes_created_at ON company_strikes(created_at DESC);
```

**Technical Constraints:**
- `strike_type` examples: 'Recall_Notice', 'Cancellation'

### audit_log

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL, -- e.g., 'User_Rate_Changed', 'Company_Settings_Modified'
  target_entity VARCHAR(100) NOT NULL, -- e.g., 'User', 'Company', 'Booking'
  target_id UUID, -- ID of the target entity
  metadata JSONB, -- Additional context
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX idx_audit_log_target_entity ON audit_log(target_entity, target_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
```

**Technical Constraints:**
- `action_type` is stored as `VARCHAR(100)` for flexibility, but application-level validation ensures only valid action types are stored
- **Validation:** Application logic validates `action_type` against the enum values below before insertion
- **Future Consideration:** Consider adding a CHECK constraint or ENUM type in future schema versions if action types become more stable

**Action Type Enum Values:**

The `action_type` field must be one of the following valid action types, grouped by category:

**User Actions:**
- `User_Rate_Changed` - User's hourly rate was modified (metadata includes: `old_rate`, `new_rate`, `changed_by_user_id`)
- `User_Role_Changed` - User's role assignment was modified (metadata includes: `old_roles`, `new_roles`, `changed_by_user_id`)
- `User_State_Changed` - User's state in the worker state machine was modified (metadata includes: `previous_value`, `new_value`, `reason`, `changed_by_user_id`)
  - `previous_value`: Previous user state (e.g., 'Profile_Complete')
  - `new_value`: New user state (e.g., 'Listed')
  - `reason`: Reason for state change (e.g., 'Insurance Expired', 'Admin Toggle', 'Profile Incomplete')
- `User_Profile_Updated` - User profile information was updated (metadata includes: `updated_fields`)

**Company Actions:**
- `Company_Settings_Modified` - Company settings were modified (metadata includes: `modified_fields`, `modified_by_user_id`)
- `Company_Member_Added` - User was added to company (metadata includes: `user_id`, `roles`, `added_by_user_id`)
- `Company_Member_Removed` - User was removed from company (metadata includes: `user_id`, `removed_by_user_id`)
- `Company_Member_Status_Updated` - Company member status was updated (metadata includes: `user_id`, `old_status`, `new_status`, `updated_by_user_id`)

**Booking Actions:**
- `Booking_Status_Changed` - Booking status transition occurred (metadata includes: `previous_value`, `new_value`, `reason`, `booking_id`, `changed_by_user_id`)
  - `previous_value`: Previous booking status (e.g., 'Active')
  - `new_value`: New booking status (e.g., 'Cancelled')
  - `reason`: Reason for status change (e.g., 'Supervisor Dispute', 'Payment Failed', 'Insurance Expired')
- `Booking_Cancelled` - Booking was cancelled (metadata includes: `booking_id`, `cancelled_by_user_id`, `cancellation_reason`)

**Insurance Actions:**
- `Insurance_Policy_Uploaded` - Insurance policy document was uploaded (metadata includes: `insurance_policy_id`, `insurance_type`, `expiration_date`, `uploaded_by_user_id`)
- `Insurance_Policy_Expired` - Insurance policy expired (metadata includes: `insurance_policy_id`, `insurance_type`, `expiration_date`)
- `Insurance_Verification_Override` - Insurance verification was manually overridden by Super Admin (metadata includes: `insurance_policy_id`, `admin_id`, `override_reason`, `override_timestamp`)

**Time Log Actions:**
- `Clock_In_Acknowledged` - Supervisor acknowledged clock-in notification (metadata includes: `time_log_id`, `supervisor_id`, `acknowledged_at`, `acknowledgment_method` - either 'deep_link_clicked' or 'app_opened')
- `Time_Log_Verified` - Time log was verified by supervisor (metadata includes: `time_log_id`, `verified_by_user_id`, `verified_at`)
- `Time_Log_Disputed` - Time log was disputed (metadata includes: `time_log_id`, `dispute_id`, `disputed_by_user_id`)

**System Actions:**
- `Auto_Approval_Triggered` - Timesheet auto-approval was triggered (metadata includes: `time_log_id`, `triggered_at`)
- `Payment_Processed` - Payment was processed (metadata includes: `booking_id`, `payment_amount`, `payment_type`, `transaction_id`)
- `Withdrawal_Requested` - Withdrawal was requested (metadata includes: `company_id`, `withdrawal_amount`, `requested_by_user_id`)

**Note:** This list is not exhaustive and may be extended as new action types are needed. All new action types must follow the naming convention: `Entity_Action` (e.g., `User_Rate_Changed`, `Company_Settings_Modified`).

**State Change Tracking:**

The `audit_log` table is the primary mechanism for tracking state changes across the system. For state transitions (booking status, user state, etc.), the following metadata structure is used:

- **`target_entity`**: The entity type (e.g., 'Booking', 'User')
- **`target_id`**: The UUID of the entity that changed state
- **`metadata` JSONB**: Contains state change details:
  - `previous_value`: The previous state value (e.g., 'Active', 'Profile_Complete')
  - `new_value`: The new state value (e.g., 'Cancelled', 'Listed')
  - `reason`: The reason for the state change (e.g., 'Supervisor Dispute', 'Payment Failed', 'Insurance Expired', 'Admin Toggle')

**Example Audit Log Entries:**

**Booking Status Change:**
```json
{
  "action_type": "Booking_Status_Changed",
  "target_entity": "Booking",
  "target_id": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "previous_value": "Active",
    "new_value": "Cancelled",
    "reason": "Supervisor Dispute",
    "booking_id": "550e8400-e29b-41d4-a716-446655440000",
    "changed_by_user_id": "660e8400-e29b-41d4-a716-446655440001"
  },
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

**User State Change:**
```json
{
  "action_type": "User_State_Changed",
  "target_entity": "User",
  "target_id": "770e8400-e29b-41d4-a716-446655440002",
  "metadata": {
    "previous_value": "Profile_Complete",
    "new_value": "Listed",
    "reason": "Admin Toggle",
    "changed_by_user_id": "880e8400-e29b-41d4-a716-446655440003"
  },
  "user_id": "880e8400-e29b-41d4-a716-446655440003",
  "timestamp": "2026-01-15T11:00:00Z"
}
```

**Querying State Change History:**

To retrieve the complete state change history for an entity, query `audit_log` filtered by `target_entity` and `target_id`:

```sql
SELECT * FROM audit_log
WHERE target_entity = 'Booking'
  AND target_id = '550e8400-e29b-41d4-a716-446655440000'
  AND action_type = 'Booking_Status_Changed'
ORDER BY timestamp ASC;
```

This provides a chronological audit trail of all state transitions for the entity. **Important:** The `audit_log` table is used for history tracking only - the current state is always read from the authoritative columns (`bookings.status`, `users.user_state`), not from event history. This replaces the previous event sourcing pattern where status was derived from events.

**Note:** Policy validation logging has been removed as part of the self-attestation model. Break/lunch policy compliance is now tracked via Terms of Service acceptance in the `user_agreements` table (see [schema-identity.md](./schema-identity.md#user_agreements) for details).

---

**Back to:** [Database Schema](./schema.md)
