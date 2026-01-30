# Data Dictionary - Audit & Logging Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Data Dictionary](./data-dictionary.md)

This document contains business-focused descriptions of Audit & Logging domain entities, their relationships, state machines, and business rules. For technical schema definitions, SQL table structures, constraints, and indexes, see [schema.md](schema.md).

---

## Audit & Logging Domain

### Rating

Rating system for workers and supervisors. Aggregated per booking after all shifts are verified.

**Key Attributes:**
- Booking reference
- Rater and rated company references
- Rated user (for worker ratings)
- Rating scores (punctuality, attitude, effort, teamwork)
- Per-skill ratings
- Comment

**Business Rules:**
- Rating Trigger: After last shift of booking verified (not after each shift)
- Ratings are aggregated per Booking
- Worker can rate Supervisor/Company (separate rating, not performance-based)
- Rating scores must be between 1 and 5

### Reputation Metrics

Behavior-driving metrics that replace generic "5-star ratings" with specific, actionable indicators. These metrics gamify reliability for Workers, stability for Lenders, and payment speed for Borrowers.

**Worker Metric: On-Time Reliability %**

**Definition:** `(Count of Clock-Ins within 5 mins of Start) / (Total Shifts) * 100`

**Data Points Required:**
- `time_log.clock_in_time` - Worker's actual clock-in timestamp
- `bookings.start_date` and shift start time - Expected start time for each shift
- Calculation: Count shifts where `ABS(clock_in_time - expected_start_time) <= 5 minutes`

**Display:** Percentage badge on Worker Card in marketplace search results (e.g., "On-Time: 95%")

**Business Rules:**
- Calculated across all completed shifts for the worker
- Only counts shifts that have been verified (status = 'Verified')
- 5-minute window allows for reasonable arrival variance while maintaining punctuality standards

**Lender Metric: Fulfillment Score**

**Definition:** Inverse of Cancellation Rate. `(1 - (Cancelled Bookings / Total Confirmed Bookings)) * 100`

**Data Points Required:**
- `bookings.status` - Track status changes to identify cancellations
- `bookings.cancelled_at` - Timestamp when booking was cancelled (if applicable)
- `bookings.cancelled_by` - Who cancelled (Lender vs Borrower) - for Lender metric, only count Lender-initiated cancellations
- Calculation: Count bookings with `status = 'Cancelled'` where `cancelled_by` is Lender, divided by total confirmed bookings

**Display:** "Reliable Partner" badge for top tier Lenders (e.g., >95% fulfillment score)

**Business Rules:**
- Only counts Lender-initiated cancellations (not Borrower cancellations)
- High score means Lender rarely cancels confirmed bookings
- Badge displayed in marketplace to help Borrowers identify reliable partners

**Borrower Metric: Fast Verifier**

**Definition:** Average time between Worker Clock Out and Supervisor Verification. `AVG(verified_at - clock_out_time)` across all verified shifts.

**Data Points Required:**
- `time_log.clock_out_time` - When worker clocked out
- `time_log.verified_at` - When supervisor verified the timesheet
- Calculation: `AVG(EXTRACT(EPOCH FROM (verified_at - clock_out_time)) / 3600)` to get average hours

**Display:** Badge visible to Lenders when receiving booking request:
- "Fast Verifier" (< 2 hours average)
- "Quick Approver" (< 4 hours average)

**Business Rules:**
- Only counts verified shifts (status = 'Verified')
- Incentivizes Borrowers to approve hours quickly so Lenders get paid faster
- Badge helps Lenders identify Borrowers who will release funds promptly

**Metrics Storage:**
- Metrics can be computed on-the-fly from existing `time_log` and `bookings` tables
- Consider materialized views or cached calculations for performance if needed
- Metrics should be recalculated periodically (e.g., daily) to reflect recent performance

### Dispute

**Context: Timesheet Disputes (The "Math")**

Dispute resolution tracking for disagreements on hours worked, break times, or time calculations. Freezes funds in escrow when supervisor disputes a timesheet.

**Key Attributes:**
- Booking and Time Log references
- Supervisor and Worker references
- Dispute Option (Option_A or Option_B) - REQUIRED for Fork in the Road logic
- Status (Open, Resolved, Arbitration)
- Dispute filed timestamp (for Resolution Timer)
- Resolution timestamp

**Business Rules:**
- **Context:** Disputes are for disagreements on hours (the "math") - time calculations, break durations, clock-in/out times
- **Initiation:** Triggered from Verification Screen (Step 3 - Impasse of Negotiation Loop when status is `Pending_Supervisor_Reevaluation`) OR within 4-hour window after clock-out (when Worker clicks Submit) OR from any Negotiation Loop step when party chooses to dispute
- **Fork in the Road Logic:** When a dispute is filed, the supervisor MUST select one of two paths:
  - **Option A: "Dispute Shift Only"** - Booking remains `Active`, worker CAN clock in for future shifts, only disputed shift funds frozen
  - **Option B: "End Booking & Dispute"** - Booking immediately transitions to `Cancelled`, worker released, total freeze (disputed shift + cancellation penalty)
- Dispute can only freeze funds currently in Escrow (current day's shift)
- Once Supervisor verifies shift (or auto-approval hits after 4 hours), funds permanently released
- System Admin does NOT judge disputes - only holds funds based on logic
- **Explicit Rule:** A booking is either `Active` (work continues) or `Cancelled` (work stops). There is no middle ground for disputes. The fork decision determines the booking status immediately - Option A = Active, Option B = Cancelled

### Incident

**Context: Incident Reports (The "Behavior")**

Incident reporting for safety, conduct, and attendance issues. Separate from timesheet disputes (which are for "math" - hours disagreements).

**Key Attributes:**
- Booking and Time Log references (optional - can be filed during or after shift)
- Supervisor and Worker references
- Severity (`Warning` or `Critical`) - REQUIRED
- Type (`Injury`, `Property_Damage`, `Tardiness`, `Workmanship`, `Conduct`) - REQUIRED
- Notes (Text field) - REQUIRED
- Optional photos
- Dispute Option (Option_A or Option_B) - REQUIRED for Critical incidents only
- Status (Open, Resolved, Arbitration)
- Incident filed timestamp
- Resolution timestamp

**Business Rules:**
- **Context:** Incidents are for safety, conduct, and attendance issues (the "behavior") - separate from timesheet disputes (the "math")
- **Initiation:** Can be filed at any time (during or after shift)
- **Incident Filed During Negotiation Loop:** If a Critical incident is filed while a timesheet is in Negotiation Loop status (`Pending_Worker_Review` or `Pending_Supervisor_Reevaluation`), the incident report takes precedence and the Negotiation Loop is terminated. **Explicit Rule:** (1) The 4-hour auto-approval timer for the Negotiation Loop is immediately cancelled, (2) The timesheet status transitions to `Disputed` (for Option A) or the booking is cancelled (for Option B) based on the Fork in the Road decision, (3) Funds are held via Stripe escrow/hold per the incident report workflow, (4) The dispute resolution chat opens with system-injected evidence including both the incident report details and any Negotiation Loop history (supervisor edits, worker rejections, etc.). **Rationale:** Incident reports are "Fast-Track Disputes" that skip the Negotiation Loop entirely. If an incident occurs during an active negotiation, the safety/conduct issue takes precedence over the time calculation dispute.
- **Severity-Based Logic:**
  - **If Severity == Warning:** Log incident, Notify Admins (Borrowing Admin and Lending Admin), Booking remains **Active**. Worker can continue working. No fund freeze. **Explicit Rule:** Warning-level incidents are logged for record-keeping but do not trigger dispute workflow or fund freeze.
  - **If Severity == Critical:** Trigger **Fork in the Road** (see below). **Explicit Rule:** Only Critical incidents trigger the Fork in the Road decision and fund freeze.
- **Fork in the Road Logic (Critical Only):** When a Critical incident is filed, the supervisor MUST select one of two paths:
  - **Option A: "Keep Worker" (Continue Employment):** Booking Status remains `Active`, worker can clock in for future shifts, only current shift funds frozen in Escrow. **CRITICAL CHANGE:** If Option A is chosen for a Critical incident, the **Lending Admin** receives an Urgent Alert (SMS + Email, bypasses quiet hours) and has the right to **VETO** this decision and Recall/Cancel the worker immediately to protect their liability. **Veto Workflow:** (1) Lending Admin receives Urgent Alert, (2) Lending Admin can click "Veto & Recall Worker" button, (3) System immediately cancels booking (status → `Cancelled`), releases worker, removes future shifts, (4) Funds frozen via Stripe escrow/hold, (5) Dispute resolution workflow proceeds. **Explicit Rule:** Lending Admin veto right applies only to Critical incidents where Option A (Keep Worker) was selected. The veto must be exercised within 24 hours of the incident report. **Edge Case - Veto During Active Shift:** If Lending Admin vetoes while worker is clocked in for a shift (status = "Working"), the system: (1) Automatically clocks out worker immediately, (2) Sets active shift's time_log status to `Disputed`, (3) Cancels booking immediately, (4) Freezes active shift funds + cancellation penalty via Stripe escrow/hold, (5) Worker becomes available in search immediately (real-time availability via PostgreSQL query - no sync delay). **Explicit Rule:** Lending Admin veto during active shift follows the same immediate termination logic as Option B dispute during active shift - worker is automatically clocked out and shift is marked as Disputed.
  - **Option B: "End Booking & Dispute" (Termination):** Booking Status immediately transitions to `Cancelled`, worker released, future shifts removed, Total Freeze (Current Shift + Cancellation Penalty) held in Escrow.
- **Explicit Rule:** A booking is either `Active` (work continues) or `Cancelled` (work stops). There is no middle ground for incidents. The fork decision determines the booking status immediately. Only Critical incidents trigger the fork.

### Company Strike

Reliability strike tracking for companies. Provides audit trail for platform reliability metrics.

**Key Attributes:**
- Company reference
- Strike type (Recall_Notice, Cancellation, etc.)
- Strike reason
- Creation timestamp

**Business Rules:**
- Provides essential audit trail (e.g., Strike 1: "Late Recall", Strike 2: "No Show")
- The `strikes_count` on the Company table is a read-only cached value
- Used to track company reliability and may result in platform restrictions if strike count exceeds thresholds (see Epic 6: Story 6.11 for 3 Strike Rule)

### Audit Log

Audit log for non-financial actions. Immutable record of system changes and user actions. The `audit_log` table replaces the previous event sourcing pattern and serves as the primary mechanism for tracking state change history across the system. **Important:** The `audit_log` table is used for history tracking and compliance auditing only - the current state is always read from authoritative columns (`bookings.status`, `users.user_state`), not from event history or audit log reconstruction.

**Key Attributes:**
- User reference (who performed the action)
- Action type (e.g., 'User_Rate_Changed', 'Company_Settings_Modified', 'Booking_Status_Changed')
- Target entity and target ID
- Metadata (JSONB containing state change details)
- Timestamp, IP address, user agent

**Business Rules:**
- Logged Actions: Examples include "User A changed Worker B's rate", "Admin modified company settings", "User role changed", "Company member status updated", "Booking status changed from Active to Cancelled"
- **State Change Tracking:** For state transitions (booking status, user state, etc.), the audit log stores:
  - `previous_value`: The previous state (e.g., 'Active', 'Profile_Complete')
  - `new_value`: The new state (e.g., 'Cancelled', 'Listed')
  - `reason`: The reason for the state change (e.g., 'Supervisor Dispute', 'Payment Failed', 'Insurance Expired', 'Admin Toggle')
- **Clock-In Acknowledged Event:** When a supervisor views a clock-in notification (via deep link click or app open), the system logs an event with `action_type = 'Clock_In_Acknowledged'`. This event is permanent proof for dispute resolution and must include in metadata: `time_log_id`, `supervisor_id`, `acknowledged_at`, `acknowledgment_method` (deep_link_clicked, app_opened). This event establishes legal proof that the supervisor knew the worker was on-site. The event is available in Super Admin dashboard (read-only) and is injected into dispute resolution chat as system messages.
- Audit logs are immutable and retained per legal requirements

**State Change Examples:**

**Booking Status Change:**
When a booking status transitions (e.g., from `Active` to `Cancelled`), the system logs an entry:
- `action_type`: 'Booking_Status_Changed'
- `target_entity`: 'Booking'
- `target_id`: UUID of the booking
- `metadata`: `{ "previous_value": "Active", "new_value": "Cancelled", "reason": "Supervisor Dispute", "booking_id": "...", "changed_by_user_id": "..." }`
- `user_id`: User who triggered the change (nullable for system events)

**User State Change:**
When a user state transitions (e.g., from `Profile_Complete` to `Listed`), the system logs an entry:
- `action_type`: 'User_State_Changed'
- `target_entity`: 'User'
- `target_id`: UUID of the user
- `metadata`: `{ "previous_value": "Profile_Complete", "new_value": "Listed", "reason": "Admin Toggle", "changed_by_user_id": "..." }`
- `user_id`: Admin who triggered the change

**Querying State Change History:**

To retrieve the complete state change history for a booking or user, query `audit_log` filtered by `target_entity` and `target_id`:

```sql
-- Get all booking status changes
SELECT * FROM audit_log
WHERE target_entity = 'Booking'
  AND target_id = '550e8400-e29b-41d4-a716-446655440000'
  AND action_type = 'Booking_Status_Changed'
ORDER BY timestamp ASC;

-- Get all user state changes
SELECT * FROM audit_log
WHERE target_entity = 'User'
  AND target_id = '770e8400-e29b-41d4-a716-446655440002'
  AND action_type = 'User_State_Changed'
ORDER BY timestamp ASC;
```

This provides a chronological audit trail of all state transitions for compliance and debugging purposes. **Important:** The current state is always read from the authoritative columns (`bookings.status`, `users.user_state`), not from event history. The audit log provides the history, but does not determine the current state. This replaces the previous event sourcing pattern where status was derived from event history.

---

**Back to:** [Data Dictionary](./data-dictionary.md)
