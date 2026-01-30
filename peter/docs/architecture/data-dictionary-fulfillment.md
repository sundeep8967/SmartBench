# Data Dictionary - Fulfillment Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Data Dictionary](./data-dictionary.md)

This document contains business-focused descriptions of Fulfillment domain entities, their relationships, state machines, and business rules. For technical schema definitions, SQL table structures, constraints, and indexes, see [schema.md](schema.md).

**ENUM Values:** All ENUM values referenced in this document (time_log.status, etc.) are defined in [schema.md](schema.md), which serves as the single source of truth for all technical ENUM definitions. This document provides business context and state machine transitions for these values.

---

## Fulfillment Domain

### Time Log

Time clock entries for worker shifts. Tracks clock-in/clock-out times, status, GPS coordinates, and verification state.

**Key Attributes:**
- Booking and Worker references
- Clock-in and clock-out times
- Status (Working, Break, Lunch, Travel_Time, Pending_Verification, Pending_Worker_Review, Pending_Supervisor_Reevaluation, Pending_Supervisor_Verification, Verified, Disputed)
- GPS coordinates and project photo
- Submitted times (worker's edited version)
- Verification status (role-based - any Supervisor, Manager, or Admin in Borrower Company can verify)
- Auto-approval time (calculated deadline: Event Time + 4 Hours)
- Last editor ID (tracks who made the last change: Worker or Supervisor)

**Business Rules:**
- Status lifecycle: Clock-in creates `Working` status
- Active states during shift: `Working`, `Break`, `Lunch`, `Travel_Time`
- **Draft Mode:** When Worker clicks "Stop Work", app enters Draft Mode. Worker sees calculated Start/End/Break times and can edit before submitting. Worker clicks "Submit" to complete Clock Out event (this is when status becomes `Pending_Verification`). If worker edited in Draft Mode, Supervisor's Verification Card displays "Worker Edited" Badge or visual diff.
- After clock-out (Worker clicks Submit): Status becomes `Pending_Verification`
- After authorized Supervisor, Manager, or Admin verification or auto-approval: Status becomes `Verified` (funds released)
- If disputed: Status becomes `Disputed` (funds frozen)
- GPS coordinates may be NULL if GPS unavailable during offline clock-in

**Negotiation Loop Rules:**

**A. Supervisor Kiosk Flow (Happy Path):**
- If Supervisor clocks worker out via Supervisor Kiosk and makes NO edits to calculated hours (e.g., just hits "Stop Shift"), the status becomes `Verified` immediately and funds are released.

**B. The Negotiation Loop (3-Step Verification):**

**Step 1 (Supervisor Review):**
- Worker clocks out → Status: `Pending_Verification`
- Supervisor can **Approve** (Done) or **Edit Time**
- If **Edit Time**: Supervisor changes hours and **MUST** add a note. Status → `Pending_Worker_Review`
- Timer: 4-hour auto-approval timer **resets** to 4 hours when status changes to `Pending_Worker_Review`

**Step 2 (Worker Action):**
- Worker receives the edit
- **Option A (Accept):** Status → `Verified`. Funds Released.
- **Option B (Reject & Comment):** Worker clicks Reject and **MUST** enter a text explanation. Status → `Pending_Supervisor_Reevaluation`
- Timer: 4-hour auto-approval timer **resets** to 4 hours when status changes to `Pending_Supervisor_Reevaluation`

**Step 3 (Supervisor Re-Evaluation):**
- Supervisor sees the rejection and comment
- **Path A (Correction):** Supervisor agrees. They revert/adjust time. Worker accepts. Status → `Verified`
- **Path B (Impasse):** Supervisor disagrees. They click **"File Dispute"**. Status → `Disputed`

**C. Worker Retroactive Flow:**
- **Note:** This workflow is **separate from the Negotiation Loop**. `Pending_Supervisor_Verification` status is used exclusively for worker retroactive entries and follows a direct supervisor verification path (approve or dispute), not the 3-step Negotiation Loop.
- If Worker submits a manual/retroactive entry (due to bad signal, device loss, etc.):
  - Status transitions to `Pending_Supervisor_Verification`
  - Supervisor receives SMS: "Worker submitted manual timesheet entry. Please verify."
  - A 4-hour Auto-Approval timer starts **from the timestamp of the submission** (`auto_approval_time = submission_timestamp + 4 hours`)
  - `last_editor_id` is set to the Worker's user ID
  - Supervisor can **Approve** (Status → `Verified`, Funds Released) OR **Dispute** (Status → `Disputed`, Funds Frozen)
  - If Supervisor does not respond within 4 hours, Worker's entry is accepted (Auto-Approve, Status → `Verified`)

**Auto-Approval Timer Logic:**
- Timer is stored explicitly in database as `auto_approval_time` (TIMESTAMP)
- **Timer Start Event:** The 4-hour timer starts when: (1) A Worker successfully clicks "Submit" on their timesheet (Clock Out event), OR (2) A Supervisor performs a "Force Clock Out" (for forgotten shifts), OR (3) Status transitions to `Pending_Worker_Review` or `Pending_Supervisor_Reevaluation` during the Negotiation Loop (timer resets to full 4 hours from the transition timestamp).
- Timer starts from the edit/submission timestamp, not the clock-out time
- **Timezone Rule:** The `clock_out_time` is stored as UTC timestamp in the database. Auto-approval timer = `clock_out_utc + 4 hours` (UTC calculation). DST transitions do not affect the 4-hour calculation (always exactly 4 hours in UTC). Display times are converted to project timezone for user viewing, but all calculations use UTC internally. **Rationale:** Using UTC for calculations ensures consistent 4-hour intervals regardless of DST transitions, eliminating edge cases where DST "fall back" or "spring forward" could affect timer accuracy.
- **Timer Reset on Status Change:** The 4-hour auto-approval timer **ALWAYS resets to full 4 hours** whenever the status changes to `Pending_Worker_Review` or `Pending_Supervisor_Reevaluation` during the Negotiation Loop. This ensures parties have adequate time to respond to the negotiation. **Explicit Rule:** Timer resets to full 4 hours on each status transition in the Negotiation Loop, giving each party adequate time to review and respond. The reset is unconditional - it always resets to full 4 hours regardless of how much time was remaining on the previous timer.
- **Race Condition Handling:** If a dispute is filed at the exact moment the auto-approval timer expires (T+4h), the dispute takes precedence. The auto-approval job checks dispute status before executing and exits if a dispute exists. **Explicit Rule:** Dispute filing always takes precedence over auto-approval, even if both events occur simultaneously.
- **Timer Cancellation Rules:**
  - When status transitions from `Pending_Verification` to `Pending_Worker_Review` or `Pending_Supervisor_Reevaluation`, the 4-hour auto-approval timer **resets** to 4 hours from the new status timestamp
  - When a dispute is filed, any active auto-approval timer (4-hour) is cancelled immediately
  - When status transitions to `Verified` or `Disputed`, all timers are cancelled
- Background job queries: `SELECT * FROM time_log WHERE auto_approval_time <= NOW() AND status IN ('Pending_Worker_Review', 'Pending_Supervisor_Reevaluation', 'Pending_Supervisor_Verification')`
- **Critical Edge Case - Timer Expiration vs. Status Change:** Background job MUST check `updated_at` timestamp before auto-approving. If `updated_at > auto_approval_time`, this indicates a status change occurred after the timer expired, which means the timer was reset. Skip auto-approval in this case - the new timer is active and should be allowed to run its full 4-hour duration. **Explicit Rule:** This safety check prevents auto-approving timesheets that were edited after the timer expired, ensuring fairness - if a party responds (even late), they get a full 4-hour window from their response timestamp
- Auto-approval occurs if no dispute is filed within 4 hours (Silence = Consent)

**Edit Definition:**
- An "edit" that triggers the Negotiation Loop is defined as any change to `clock_in_time`, `clock_out_time`, `break_duration`, or `lunch_duration` that results in a different billable hours calculation
- Changes exceeding 1 minute threshold account for rounding differences
- **NOT considered edits:** Comments, notes, project photo changes, status updates that don't affect time calculation

**Status Transition Rules:**
- **Worker Edit Prevention at Step 1:** Workers cannot edit timesheets in `Pending_Verification` status (Step 1). Only Supervisor can edit from this status. If worker attempts to edit, system returns error: "Cannot edit timesheet in Pending_Verification. Supervisor must approve, edit, or dispute first."
- **Negotiation Loop Transitions:**
  - Step 1 → Step 2: Supervisor edits time → Status: `Pending_Worker_Review` (timer resets to 4 hours)
  - Step 2 → Step 3: Worker rejects edit → Status: `Pending_Supervisor_Reevaluation` (timer resets to 4 hours)
  - Step 3 → Verified: Supervisor corrects time → Worker accepts → Status: `Verified`
  - Step 3 → Disputed: Supervisor files dispute → Status: `Disputed`
- **Verified Status Lock:** Once a timesheet reaches `Verified` status and funds are released, it CANNOT be edited. Status is final. Corrections require creating a new timesheet entry with separate financial reconciliation

**Dispute During Negotiation Loop:**
- Filing a dispute while in `Pending_Worker_Review`, `Pending_Supervisor_Reevaluation`, or `Pending_Supervisor_Verification`:
  - Immediately cancels the 4-hour auto-approval timer
  - Transitions status to `Disputed`
  - Freezes funds in escrow
  - Opens resolution chat

**Worker Retroactive Entry Conflict Resolution:**
- If worker submits retroactive entry while active timesheet exists for same booking/shift:
  - System detects conflict
  - Existing timesheet transitions to `Pending_Supervisor_Verification` (cancelling 4-hour timer)
  - Worker's submission data merges/replaces existing timesheet data
  - Supervisor notified of correction

**Verification Authority Model:**
- **Role-Based Verification:** Verification is role-based, not assignment-based. ANY user with `Supervisor`, `Manager`, or `Admin` role in the Borrowing Company can verify timesheets, regardless of Site Contact assignment. The system validates verification permission by checking: `User.Company == Booking.Borrower_Company AND User.Role IN ('Supervisor', 'Manager', 'Admin')`. No specific supervisor assignment is required for verification.
- **Site Contact vs. Verification Authority:** The Primary Site Contact (stored in `bookings.primary_site_contact_id`) is the person the worker calls for operational issues (gate codes, running late, site access). Site Contact receives the primary notification when Worker clocks out, but verification authority is separate - any authorized Supervisor, Manager, or Admin in the Borrower Company can verify the timesheet. If Site Contact is unavailable, any other Supervisor, Manager, or Admin in the company can log in and verify. See [Data Dictionary - Booking Domain](./data-dictionary-booking.md#primary-site-contact) for complete Site Contact definition.

**Escalation Protocol Business Rules:**
- **Tacit Approval Clock-In Protocol (Start of Shift):** When Worker Clocks In, Primary Site Contact immediately receives SMS with "Clock-In" notification and deep link (T+0). If Site Contact does not view the "Clock-In" notification within **15 minutes**, system escalates via SMS to **Borrowing Admin** (T+15m). If still not viewed within **25 minutes**, system escalates via SMS to **Lending Admin** (T+25m). Failure to eject worker within 25 minutes = **"Tacit Approval"** of attendance. Worker remains clocked in if no action taken. **Critical Requirement:** System must track "Clock-In Acknowledged" event whenever the deep link is clicked or the app is opened. This event is permanent proof for dispute resolution and must include: `time_log_id`, `user_id` (who acknowledged), `acknowledged_at`, `acknowledgment_method` (deep_link_clicked, app_opened).
- **End of Shift Verification Escalation (Notification Ladder):** When Worker clicks "Submit" (Clock Out event), Primary Site Contact immediately receives SMS with "Verify hours" notification and deep link (T+0, Critical notification - bypasses quiet hours). **Note:** While Site Contact receives the primary notification, ANY Supervisor, Manager, or Admin in the Borrowing Company can verify the timesheet (role-based verification). **Notification Ladder:** (1) T+0: SMS to Supervisor with Deep Link, (2) T+60m: SMS to Supervisor & Borrowing Admin (Reminder), (3) T+3h: SMS to Supervisor & Borrowing Admin (Urgent Warning), (4) T+4h: Auto-Approval Execution (Status becomes `Verified`, Funds Released). **Early Verification Cancellation:** If supervisor verifies before scheduled notification time (T+60m, T+3h, or T+4h), the notification job checks timesheet status before executing and exits if status is already `Verified`. This cancels remaining scheduled notifications. **Explicit Rule:** Auto-approval occurs exactly 4 hours after clock-out (when Worker clicks Submit) regardless of day/time (weekends, holidays included). When auto-approval occurs, system sends notification: "Timesheet auto-approved after 4 hours. Supervisor did not verify within required timeframe." Once auto-approved, timesheet cannot be reversed or disputed. **Race Condition Handling:** If a dispute is filed at the exact moment the auto-approval timer expires (T+4h), the dispute takes precedence. The auto-approval job checks dispute status before executing and exits if a dispute exists.
- **SMS Delivery Failure Handling:** If SMS service returns a delivery error, the system immediately sends the notification via **Email** as fallback **if user has an email address** (phone-first: email is optional for Workers). Critical alerts (Magic Links and "Recall" notices) trigger both SMS and Email simultaneously by default (if email is available).

### Time Log Offline Sync

Stores raw offline events before sync. Used for conflict resolution.

**Key Attributes:**
- Event type and device timestamps
- GPS coordinates and project photos
- Sync status (pending, synced, failed, conflict)

**Business Rules:**
- Sync status tracks sync lifecycle: pending → synced or failed
- `'conflict'` status indicates sync conflict detected (worker offline entry conflicts with supervisor Force Clock Out entry), requires supervisor resolution before sync can complete

---

**Back to:** [Data Dictionary](./data-dictionary.md)
