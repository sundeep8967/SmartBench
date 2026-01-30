# Data Dictionary - Financial Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Data Dictionary](./data-dictionary.md)

This document contains business-focused descriptions of Financial domain entities, their relationships, state machines, and business rules. For technical schema definitions, SQL table structures, constraints, and indexes, see [schema.md](schema.md).

**ENUM Values:** All ENUM values referenced in this document (transaction_type, etc.) are defined in [schema.md](schema.md), which serves as the single source of truth for all technical ENUM definitions. This document provides business context and state machine transitions for these values.

---

## Financial Domain

**Architecture Note:** The MVP uses a direct Stripe-native approach. All payments go directly to Stripe Connect Connected Accounts, and all refunds go directly back to customer payment methods via Stripe API. Financial tracking is handled via:
- Stripe API for payment/refund processing
- `bookings` table fields: `total_amount`, `service_fee_amount`, `worker_payout_amount`
- `bookings.status` field for refund tracking ('Refunded', 'Partially_Refunded')

All financial operations are processed directly through Stripe.

### Refund Calculation Validation

**Context:** Refund calculations must be validated to ensure data integrity, prevent over-refunding, and align refund timing with shift status and business rules.

**Validation Rules:**

1. **Refund Amount Validation:**
   - **Constraint:** Refund amount cannot exceed the original payment amount for the booking or shift period
   - **Validation Point:** Application-level validation before creating refund transaction
   - **Error Handling:** If calculated refund exceeds original payment, system logs error and prevents refund processing
   - **Example:** If original payment was $1,000, refund cannot exceed $1,000 (excluding Service Fees which may be retained)

2. **Refund Timing Validation:**
   - **Shift Status Alignment:** Refund calculations must align with shift status at time of cancellation
   - **Past/Verified Shifts:** System validates that no refund is calculated for shifts with status `Verified` or shifts that occurred in the past
   - **Future Shifts:** System validates that 100% refund is calculated only for shifts with status `Working` or `Pending_Verification` that occur in the future, subject to 24-hour notice rule
   - **24-Hour Notice Calculation:** System validates 24-hour notice calculation (cancellation timestamp to next shift start time in project timezone). System validates that late cancellation penalty applies only when notice < 24 hours. System validates that active shift cancellations (worker clocked in) are always paid (lending company's minimum billable hours apply - see [Epic 6: Story 6.4](../prd/epic-6.md#story-64-refund-logic-stripe-native-processing) for definition) and no penalty is applied to active shift - penalty applies only to next scheduled shift if notice < 24 hours
   - **Today's Shifts:** System validates that late cancellation penalty (50%) is applied only when cancellation occurs < 24 hours before shift start time. System validates that cancellation exactly at shift start time (00:00:00 or shift start time) is treated as "before shift start" with 0 hours notice, triggering penalty if applicable

3. **Weekly Payment Refund Validation:**
   - **Funded Period Alignment:** Refund calculations for weekly payments must align with `funded_period_start` and `funded_period_end` dates
   - **Current Day Logic:** System validates that "current day" is correctly identified based on booking timezone and current date. For shifts spanning midnight, system validates that day containing shift start time is used as "current day"
   - **24-Hour Notice for Current Day:** System validates that if cancellation occurs ≥ 24 hours before next shift start, current day is paid 100% with no penalty. If < 24 hours notice, system validates that late cancellation penalty is applied
   - **Future Days Calculation:** System validates that all future days within the funded period are included in refund calculation. System validates that if cancellation occurs ≥ 24 hours before first future day, all future days are refunded 100%. If < 24 hours notice to first future day, system validates that penalty applies only to first future day, remaining future days refunded 100%
   - **Pro-rated Validation:** System validates that refund amount matches pro-rated calculation (future days / total funded days × funded amount), adjusted for 24-hour notice penalties

4. **Service Fee Validation:**
   - **Fee Retention:** System validates that Service Fee (30%) is retained for borrower-initiated cancellations
   - **Fee Refund:** System validates that Service Fee is refunded for lender-initiated cancellations or trial rejections
   - **Fee Calculation:** System validates that Service Fee is calculated on original booking amount, not refund amount

5. **Stripe Processing:**
   - **Refund Processing:** System validates that all refunds are processed directly to customer's payment method via Stripe API
   - **No User-Facing Fees:** Stripe processing fees are never mentioned to users - they are internal operational expenses

**Refund Calculation Process:**

The refund calculation process implements the business rules defined in [Epic 6: Story 6.4](../prd/epic-6.md#story-64-refund-logic-stripe-native-processing). The system:

1. **Queries `time_log` entries** for the booking to determine shift statuses
2. **Categorizes shifts** by status and date (Past/Verified, Future/Unworked, Today)
3. **Calculates refund amount** according to business rules (see [Epic 6: Story 6.4](../prd/epic-6.md#story-64-refund-logic-stripe-native-processing) for complete refund logic)
4. **Applies Service Fee policy** based on cancellation initiator (borrower vs. lender)
5. **Refund Processing:** All refunds are processed directly to the customer's payment method via Stripe API.
6. **Validates final amount** using the validation rules defined above

**Implementation Requirements:**
- All refund calculations must be logged with full context (shift statuses, dates, amounts, fees)
- Refund validation must occur before processing refund via Stripe API
- Refund calculations must be idempotent (same inputs produce same outputs)
- Refund timing must align with shift status transitions (no refunds for verified shifts)
- All refunds processed directly via Stripe API to customer's payment method

**Related Documentation:**
- See [Epic 6: Story 6.4](../prd/epic-6.md#story-64-refund-logic-stripe-native-processing) for complete refund business rules, scenarios, and calculation examples
- See [Financial Architecture](./financial-architecture.md) for Stripe-native processing implementation details

### Pending Payment

Tracks pending weekly payment charges awaiting Stripe webhook confirmation. Used for weekly progress payment bookings.

**Key Attributes:**
- Payment intent ID
- Amount and funded period
- Status (Pending, Settled, Failed)

**Business Rules:**
- Payment intent ID must be unique
- Status tracks payment lifecycle: Pending → Settled or Failed

### Overtime Calculation Rules

Overtime calculation logic for the SmartBench platform. Overtime is calculated per booking using pre-authorized contract terms stored at booking creation.

> **Note:** For complete overtime calculation rules, acceptance criteria, and workflows, see [Epic 6: Story 6.5](../prd/epic-6.md#story-65-overtime-rules-and-calculations). This section provides a business-focused summary.

**Key Concepts:**
- **Pre-Authorized Contract Model:** OT terms are agreed upon at checkout and stored in `bookings.ot_terms_snapshot` JSONB field. Terms include: `daily_rule` (OT after 8h/day), `weekly_rule` (OT after 40h/week), `weekend_rule` (OT on Sat/Sun), and `ot_rate` (custom dollar amount from `worker_rates.overtime_rate`). The `ot_rate` value is a specific dollar amount (e.g., $52.50) that comes directly from `worker_rates.overtime_rate`, not a calculated multiplier.
- **Booking-Scoped Calculation:** Overtime is calculated per booking (Booking-Worker-Week), not aggregated across multiple borrowers. Each booking has independent OT calculation based on its own `ot_terms_snapshot`. All OT calculations are scoped to the Booking (Borrower-Worker pair). Hours are NOT aggregated across multiple Borrowers to determine OT thresholds.
- **Start-Day Rule:** A shift belongs entirely to the day (and week) it **Starts**. Example: Shift starts Saturday 11:00 PM (Week 1) and ends Sunday 7:00 AM (Week 2). All 8 hours count toward **Week 1** for overtime calculations within that booking.
- **Custom OT Rate:** Lenders define specific dollar amounts for overtime rates (stored in `worker_rates.overtime_rate`), not platform-calculated multipliers. **Critical:** The system does NOT use a 1.5x multiplier or any platform-calculated multiplier. OT rates are specific dollar amounts defined by lenders (e.g., $52.50), not calculated percentages of the hourly rate.
- **Travel Time Overtime Calculation:** Travel hours are treated the same as labor hours for overtime calculation within the booking. Travel hours count toward daily and weekly thresholds. If travel time satisfies OT rules, it is billed at `overtime_rate`. **Travel Time Eligibility:** Travel time is ONLY paid when a worker is assigned to two different projects for the same borrower company. See [Epic 5: Story 5.3](../prd/epic-5.md#story-53-travel-time-tracking) for complete travel time eligibility rules.

**Business Rules:**
- Overtime calculated per booking using `ot_terms_snapshot`, not aggregated across borrowers
- **Booking Scope:** All calculations must be scoped to the Booking (Borrower-Worker pair). Do NOT aggregate hours across multiple Borrowers to determine OT thresholds. Each booking's time_log entries are evaluated independently
- Week resets Sunday 12:01 AM (Project Timezone)
- No blocking or unlock workflows - worker can always clock in (terms pre-authorized at checkout)
- For each minute in a `time_log`, system evaluates against `ot_terms_snapshot`: If minute satisfies ANY true condition (daily > 8h, weekly > 40h, or weekend), bill at `overtime_rate`. Otherwise, bill at `hourly_rate`
- **Priority Logic:** If a minute satisfies ANY of the true conditions (Daily > 8h, Weekly > 40h, or Weekend), it is billed at `overtime_rate`. If multiple conditions are true, still billed at `overtime_rate` (no double-counting)
- Travel hours are treated the same as labor hours - they count toward daily/weekly thresholds and are billed at `overtime_rate` if rules are met
- **No Multiplier Calculation:** The system does NOT calculate OT rates as a percentage (e.g., 1.5x) of the hourly rate. Lenders configure custom OT rates per worker in the `worker_rates` table as specific dollar amounts (e.g., $52.50), not multipliers.

### Week Boundary Handling Examples

This section provides detailed examples of how the Start-Day Rule handles week boundaries and edge cases.

#### Example 1: Shift Spanning Week Boundary (Saturday to Sunday)

**Scenario:**
- **Shift Start:** Saturday, January 25, 2026, 11:00 PM (Week 1: Jan 20-26)
- **Shift End:** Sunday, January 26, 2026, 7:00 AM (Week 2: Jan 27-Feb 2)
- **Total Duration:** 8 hours

**Calculation:**
- **Start-Day Rule Applied:** Shift belongs to Week 1 (week containing start date)
- **Week 1 Hours:** 8 hours (all hours count toward Week 1)
- **Week 2 Hours:** 0 hours (no hours count toward Week 2)
- **Result:** All 8 hours contribute to Week 1 overtime calculation, preventing split across two paychecks

**Overtime Impact:**
- If Week 1 already has 35 hours, this shift brings total to 43 hours (within this booking)
- If `weekly_rule = true` in `ot_terms_snapshot`: Hours 1-40 at `hourly_rate`, hours 41-43 at `overtime_rate`
- If Week 2 has separate shifts, they are calculated independently per booking

#### Example 2: Shift Starting Exactly at Midnight (Week Boundary)

**Scenario:**
- **Shift Start:** Sunday, January 26, 2026, 12:00:00 AM (Week 1: Jan 20-26)
- **Shift End:** Sunday, January 26, 2026, 8:00 AM (Week 1: Jan 20-26)
- **Total Duration:** 8 hours

**Calculation:**
- **Start-Day Rule Applied:** Shift starts at midnight of Sunday (last day of Week 1)
- **Week 1 Hours:** 8 hours (all hours count toward Week 1)
- **Result:** Shift fully belongs to Week 1, even though it starts at the week boundary

#### Example 3: Shift Starting Sunday 11:59 PM, Ending Monday 12:01 AM

**Scenario:**
- **Shift Start:** Sunday, January 26, 2026, 11:59:00 PM (Week 1: Jan 20-26)
- **Shift End:** Monday, January 27, 2026, 12:01:00 AM (Week 2: Jan 27-Feb 2)
- **Total Duration:** 2 minutes (0.033 hours)

**Calculation:**
- **Start-Day Rule Applied:** Shift belongs to Week 1 (week containing start date)
- **Week 1 Hours:** 0.033 hours (2 minutes)
- **Week 2 Hours:** 0 hours
- **Result:** Minimal shift duration, but all time counts toward Week 1

#### Example 4: Multi-Day Shift Within Same Week

**Scenario:**
- **Shift Start:** Monday, January 20, 2026, 7:00 AM (Week 1: Jan 20-26)
- **Shift End:** Wednesday, January 22, 2026, 5:00 PM (Week 1: Jan 20-26)
- **Total Duration:** 58 hours (3 days, 10 hours per day)

**Calculation:**
- **Start-Day Rule Applied:** Shift belongs to Week 1 (week containing start date)
- **Week 1 Hours:** 58 hours (all hours count toward Week 1)
- **Overtime Calculation (if `weekly_rule = true` in `ot_terms_snapshot`):** 
  - Hours 1-40 at `hourly_rate` (standard rate)
  - Hours 41-58 at `overtime_rate` (18 hours of overtime at custom OT rate from snapshot)
- **Result:** All hours aggregated in Week 1, overtime applies to hours over 40 within this booking

#### Example 5: Multiple Bookings for Same Borrower (Booking-Scoped Calculation)

**Scenario:**
- **Worker:** John Doe (`hourly_rate = $35.00`, `overtime_rate = $52.50`)
- **Borrower:** ABC Construction
- **Week:** January 20-26, 2026 (Week 1)
- **Booking 1:** Monday-Wednesday (Jan 20-22), 8 hours/day = 24 hours
  - `ot_terms_snapshot = { "daily_rule": false, "weekly_rule": true, "weekend_rule": false, "ot_rate": 52.50 }`
- **Booking 2:** Thursday-Friday (Jan 23-24), 10 hours/day = 20 hours
  - `ot_terms_snapshot = { "daily_rule": false, "weekly_rule": true, "weekend_rule": false, "ot_rate": 52.50 }`

**Calculation (Per Booking):**
- **Booking 1:** 24 hours in Week 1. All hours < 40, so all at `hourly_rate` ($35.00/hour) = $840.00
- **Booking 2:** 20 hours in Week 1. All hours < 40, so all at `hourly_rate` ($35.00/hour) = $700.00
- **Result:** Each booking calculated independently. No overtime applies because neither booking exceeds 40 hours individually.

**Note:** Under the Pre-Authorized Contract model, bookings are NOT aggregated. Each booking's OT calculation is independent based on its own `ot_terms_snapshot`.

#### Example 6: Single Booking Exceeding 40 Hours (Weekly Rule)

**Scenario:**
- **Worker:** John Doe (`hourly_rate = $35.00`, `overtime_rate = $52.50`)
- **Borrower:** ABC Construction
- **Week:** January 20-26, 2026 (Week 1)
- **Booking:** Monday-Friday (Jan 20-24), 9 hours/day = 45 hours total
  - `ot_terms_snapshot = { "daily_rule": false, "weekly_rule": true, "weekend_rule": false, "ot_rate": 52.50 }`

**Calculation:**
- **Total Hours:** 45 hours in Week 1 (within this booking)
- **Overtime Calculation (weekly_rule = true):**
  - Hours 1-40 at `hourly_rate` ($35.00/hour) = $1,400.00
  - Hours 41-45 at `overtime_rate` ($52.50/hour) = $262.50
- **Total:** $1,662.50

**Result:** Booking-scoped calculation. Hours over 40 within this booking are billed at `overtime_rate` from the snapshot.

#### Example 7: Week Boundary with DST Transition

**Scenario:**
- **Project Timezone:** CST (UTC-6)
- **DST Transition:** Sunday, March 10, 2026 (Spring Forward, 2:00 AM becomes 3:00 AM)
- **Shift Start:** Saturday, March 9, 2026, 11:00 PM CST
- **Shift End:** Sunday, March 10, 2026, 7:00 AM CDT (after DST transition)

**Calculation:**
- **Start-Day Rule Applied:** Shift belongs to Week 1 (week containing Saturday, March 9)
- **Duration Calculation:** System uses Project Timezone consistently
- **Week 1 Hours:** 8 hours (all hours count toward Week 1)
- **Result:** DST transition does not affect week boundary calculation - shift belongs to week of start date

#### Example 8: Shift Spanning Multiple Weeks (Extended Shift)

**Scenario:**
- **Shift Start:** Friday, January 24, 2026, 6:00 PM (Week 1: Jan 20-26)
- **Shift End:** Monday, January 27, 2026, 6:00 AM (Week 2: Jan 27-Feb 2)
- **Total Duration:** 60 hours (2.5 days)

**Calculation:**
- **Start-Day Rule Applied:** Shift belongs to Week 1 (week containing start date)
- **Week 1 Hours:** 60 hours (all hours count toward Week 1 within this booking)
- **Week 2 Hours:** 0 hours (no hours count toward Week 2)
- **Overtime Calculation (if `weekly_rule = true` in `ot_terms_snapshot`):**
  - Hours 1-40 at `hourly_rate`
  - Hours 41-60 at `overtime_rate` (20 hours of overtime)
- **Result:** Entire shift counted in Week 1 for this booking, preventing split across weeks

**Visual Representation:**

| Week | Days | Hours | Rate (if weekly_rule = true) |
|------|------|-------|------|
| Week 1 (Jan 20-26) | Fri 6PM - Mon 6AM | 60 hours | 40h @ hourly_rate, 20h @ overtime_rate |
| Week 2 (Jan 27-Feb 2) | - | 0 hours | - |

#### Example 9: Multiple Shifts Across Week Boundary

**Scenario:**
- **Shift 1:** Saturday, January 25, 11:00 PM - Sunday, January 26, 7:00 AM (8 hours, Week 1)
- **Shift 2:** Sunday, January 26, 8:00 AM - Sunday, January 26, 5:00 PM (9 hours, Week 1)
- **Shift 3:** Monday, January 27, 7:00 AM - Monday, January 27, 5:00 PM (10 hours, Week 2)

**Calculation:**
- **Week 1 Total:** 8 + 9 = 17 hours (no overtime)
- **Week 2 Total:** 10 hours (no overtime)
- **Result:** Each week calculated separately using Start-Day Rule

---

**Back to:** [Data Dictionary](./data-dictionary.md)
