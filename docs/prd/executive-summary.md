# Executive Summary & Architectural Vision

We are building the MVP for SmartBench, a B2B construction labor marketplace. While the initial launch is restricted to MN/WI (USA), the architecture **must** support future expansion to other states and countries without a codebase rewrite.

**The Core Directive:** Build a **Modular Monolith** using **Domain-Driven Vertical Slicing**.

We will deploy as a single unit (Monolith) for speed, but code must be organized by Domain (Modules) with strict boundaries. This allows us to extract specific domains (e.g., Billing) into Microservices later with minimal refactoring.

## Executive Summary of Key Decisions

Before addressing specific line items, these 5 core architectural decisions set the context for all resolutions:

1. **Project Persistence:** Projects are persistent entities. A `POST /projects` workflow will exist independent of bookings.

2. **Two-Track Cancellation Logic:** We distinguish between **Short-Term (Reservation)** and **Long-Term (Notice Period)** bookings. Refunds are processed directly through Stripe.
   *   **Refund Policy:** Refunds are processed directly to the customer's payment method via Stripe API. For Borrower Fault (Convenience Cancellation), the Service Fee (30%) is retained as revenue. For Lender Fault (No-Show/Trial Rejection), the customer receives a 100% full refund.
   *   **Convenience:** Borrowers pay a fee (50% or Notice Period) for early cancellation. The Service Fee (30%) is retained by the platform.
   *   **Cause:** If an incident occurs, the supervisor must choose a "Fork in the Road" decision: **Option A (Dispute Shift Only)** - booking remains `Active`, only disputed shift funds frozen; or **Option B (End Booking & Dispute)** - booking immediately `Cancelled`, total freeze (disputed shift + cancellation penalty) held pending Lender acceptance or Dispute Resolution.
   *   See [Epic 6: Refund Logic](./epic-6.md#story-64-refund-logic-stripe-native-processing) for complete refund rules including all scenarios (full refunds, partial cancellations, trial period refunds, weather dependency refunds, and dispute settlement integration).
   *   **Technical Reference:** See [Financial Architecture](../architecture/financial-architecture.md) for technical implementation details of Stripe-native refund processing.

3. **Pay or Release Model {#3-pay-or-release-model}:** The "Wednesday Rule" follows a time-based "Pay or Release" model with three checkpoints.
   * **Wednesday 10 AM:** Charge attempted for *Next Week*. If failure, booking status remains `Active` (no status change), "Action Required" notification sent.
   * **Wednesday 2 PM:** Final Warning notification sent if still unpaid.
   * **Wednesday 11:59 PM:** Hard Cutoff - Worker Released. Booking status set to `Completed` (effective Sunday), end_date set to Sunday, all future shifts cancelled.
   * *Result:* Worker is released at end of day Wednesday. Zero risk of unpaid work on Monday. Worker immediately becomes available in search for next week.
   * (See [Booking Status State Machine](../architecture/data-dictionary-booking.md#booking-status-state-machine) and [Epic 4: Weekly Progress Payment System](./epic-4.md#story-45-weekly-progress-payment-system) for detailed implementation.)

4. **Offline Data Strategy:** Data resides on the Supervisor's device in a "Pending Sync" state. If the device is lost/destroyed before sync, the data is considered lost (manual admin override required).

5. **Service Fee Policy:**
   * **Service Fee:** 30% of Worker Rate, added on top of labor costs. Formula: `Total Charge = (Worker Rate * Hours) + (Worker Rate * Hours * 0.30)`
   * **Borrower Fault (Cancellation):** Platform retains the 30% Service Fee (applies to both upfront and weekly progress refunds). Refund Amount = Total Charge - Service Fee.
   * **Lender Fault (No-Show/Trial Rejection/Recall):** Customer receives 100% Full Refund to their card. Platform absorbs the original Stripe processing fee as a cost of doing business.
   * (See [Epic 6: Refund Logic](./epic-6.md#story-64-refund-logic-stripe-native-processing) for detailed policy implementation.)
   * **Technical Reference:** See [Financial Architecture](../architecture/financial-architecture.md) for technical implementation details of Service Fee calculation and Stripe-native refund processing.

6. **Zero-Touch System Admin:** The platform implements a "Zero-Touch System Admin" philosophy where System Admins focus exclusively on platform-level enforcement and monitoring, while Company Admins handle all operational verification, insurance certification, and listing approvals. This ensures scalability and reduces platform liability. (See [User Roles and Actors](./user-roles-and-actors.md#admin-role-philosophy-liability-boundaries) for detailed role definitions.)

7. **Site Contact & Role-Based Verification Model:** The `bookings` table contains a `primary_site_contact_id` field for operational communication (gate codes, running late, site access). Site Contact is separate from verification authority, which is role-based: ANY user with `Supervisor`, `Manager`, or `Admin` role in the Borrowing Company can verify timesheets. This design simplifies the workflow by separating operational contact (Site Contact) from verification authority (role-based check). Site Contact can be changed by Admins at any time, and verification is always available to authorized roles without requiring specific assignment.

8. **Data Integrity Enforcement:** Data integrity is enforced at both database and application levels. Critical business rules (currency consistency, worker-lender relationships, insurance policy uniqueness) are validated to ensure data accuracy and consistency.

9. **State Machine Validation:** All state transitions are validated with explicit rules defining valid and invalid transitions. Invalid transitions (e.g., Cancelled → Active after payment) are prevented. All status changes are tracked for audit purposes.

**Technical Reference:** See [Database Schema](../architecture/schema.md) for technical implementation details including foreign key constraints, CHECK constraints, and state machine validation logic.

> **Note:** For detailed implementation of these architectural decisions, including technical specifications, design patterns, and implementation details, see [Architecture Document](../architecture.md).

---