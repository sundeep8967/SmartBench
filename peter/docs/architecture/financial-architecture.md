# C. Financial Architecture (Stripe Direct Payments)

**Business Rules Reference:** For business policies and rules (Service Fee Policy, Stripe-native refund logic, cancellation policies, etc.), see:
- [Executive Summary](../prd/executive-summary.md) - Core financial decisions and policies
- [Epic 6: Financial Operations & Admin](../prd/epic-6.md) - Complete refund logic and financial business rules

This document focuses on technical implementation details. Business rules and policies are defined in the PRD.

**Decision:** We use Stripe Connect Express with Manual Payouts configuration. All payments and refunds are processed directly through Stripe API.

## 1. Stripe Connect Express Integration

**Decision:** All payments flow through Stripe Connect Express accounts. Stripe handles KYC/KYB/Tax Reporting. Payments go directly to Lender's Stripe Connected Account. Refunds go directly back to Borrower's payment method via Stripe API.

**Implementation Details:** All financial operations use direct Stripe API calls.

## 2. Data Integrity

**Decision:** Money stored as Cents (BigInt) in `bookings` table fields: `total_amount`, `service_fee_amount`, `worker_payout_amount`.

**Financial Calculations:** All financial calculations use Dinero.js library to prevent floating point errors. Monetary values stored as BIGINT (cents) in database, initialized as Dinero objects in application code.

**Schema Reference:** See [schema-financial.md](./schema-financial.md) for financial table definitions.

## 3. Recurring Payments (The "Wednesday Rule")

**Business Rules:** For complete business rules regarding the "Wednesday Rule" (Pay or Release model with three checkpoints: 10 AM payment attempt, 2 PM final warning, 11:59 PM hard cutoff), see [Epic 4: Story 4.5 - Weekly Progress Payment System](../prd/epic-4.md#story-45-weekly-progress-payment-system).

**Technical Implementation:** The system implements a weekly charge cycle with a time-based "Pay or Release" model. For detailed technical implementation including workflow logic, webhook processing, and settlement engine design, see [Weekly Payments Blueprint](./blueprints/booking/weekly-payments.md).

## 4. Stripe Connect Webhook Events and Handlers

**Decision:** All Stripe webhook events are processed through a single webhook endpoint with idempotency checks and event routing.

**Webhook Endpoint:** `/webhooks/stripe`

### Handled Webhook Events

| Event Type | Purpose | Handler Action |
|------------|---------|----------------|
| `payment_intent.succeeded` | Payment successfully processed (initial booking or weekly progress payment) | **Initial Booking:** Update booking status to `Confirmed` or `Active`, record payment in `bookings` table. **Weekly Progress Payment:** Identify by `pending_payments` record context (payment_type = 'Weekly_Progress'), extend `funded_period_end`, mark payment as settled (see [Weekly Payments Blueprint](./blueprints/booking/weekly-payments.md)) |
| `payment_intent.payment_failed` | Payment attempt failed (initial booking or weekly progress payment) | **Initial Booking:** Booking status remains `Pending_Payment` or transitions to `Cancelled`. **Weekly Progress Payment:** Booking status remains `Active` (no status change), send "Action Required" notification to borrower admin |
| `payment_intent.requires_action` | Payment requires additional authentication | Store `payment_intent_id` in `pending_payments` with status `Requires_Action`, notify borrower to complete payment |
| `account.updated` | Connected account information changed | Update company Stripe account metadata, verify account status, handle account restrictions |
| `identity.verification_session.verified` | KYB verification completed | Update company onboarding status, mark company as verified (see [Company Onboarding Blueprint](./blueprints/identity/company-onboarding.md)) |
| `charge.refunded` | Refund processed | Update booking status to `Refunded` or `Partially_Refunded` |

### Webhook Processing Flow

1. **Event Receipt:** Stripe sends webhook to `/webhooks/stripe` endpoint
2. **Signature Verification:** Verify webhook signature using Stripe webhook secret
3. **Idempotency Check:** Query `pending_payments` table to ensure event not already processed
4. **Event Routing:** Route to appropriate handler based on event type
5. **Atomic Processing:** Process event in database transaction
6. **Acknowledgment:** Return 200 OK to Stripe (prevents retries)

**Implementation Details:** See [Weekly Payments Blueprint](./blueprints/booking/weekly-payments.md#the-settlement-stripe-webhook) for detailed webhook processing logic.

## 5. Stripe API Failure Handling and Retry Logic

**Decision:** Implement exponential backoff retry strategy with circuit breaker pattern for Stripe API calls. Use reconciliation jobs to handle missed webhooks.

### Retry Strategy

**Exponential Backoff Configuration:**
- Initial delay: 2 seconds
- Maximum delay: 60 seconds
- Maximum retries: 3 attempts
- Jitter: ±20% random variation to prevent thundering herd

**Retryable Errors:**
- Network timeouts
- 429 (Rate Limit) responses
- 500/502/503/504 (Server errors)
- Connection errors

**Non-Retryable Errors:**
- 400 (Bad Request) - Invalid parameters
- 401 (Unauthorized) - Authentication failure
- 402 (Payment Required) - Payment method declined
- 404 (Not Found) - Resource doesn't exist

### Circuit Breaker Pattern

**Circuit States:**
- **Closed:** Normal operation, all requests pass through
- **Open:** Too many failures, reject requests immediately
- **Half-Open:** Testing if service recovered, allow limited requests

**Circuit Breaker Thresholds:**
- Failure rate threshold: 50% over 1-minute window
- Request volume threshold: Minimum 10 requests before opening circuit
- Half-open timeout: 30 seconds
- Recovery threshold: 3 successful requests to close circuit

**Implementation:** Use circuit breaker library (e.g., `opossum` for Node.js) to wrap all Stripe API calls.

### Stripe API Unavailability Handling (Fail Fast)

**Strategy:**
In the event of a Stripe API outage, the system adopts a **"Fail Fast"** strategy. We do **not** queue booking requests or hold inventory in a `Pending_Payment` state for extended periods.

**Booking Creation Workflow by Failure Type:**

1. **Stripe API Outage (Service Unavailable):**
   - **Immediate Failure:** If the Circuit Breaker opens or the API call fails, the request returns an immediate error to the user: *"Payment processing temporarily unavailable."*
   - **Booking State:** The Booking is **not** created. No database record is created.
   - **Inventory State:** The inventory remains in the User's Cart (no locking mechanism - worker remains visible until booking confirmed).
   - **User Action:** The user may manually retry the payment. Worker remains visible to other users until booking is confirmed.
   - **Retry Behavior:** On successful retry, a new booking is created with status `Pending_Payment` and payment processing proceeds normally.

2. **Card Decline (Payment Method Issue):**
   - **Booking State:** Booking is created with status `Pending_Payment` before payment attempt.
   - **Payment Failure:** Payment attempt fails due to card decline (402 Payment Required).
   - **State Transition:** `PaymentFailed` event triggers status transition to `Cancelled`.
   - **Worker Availability:** Worker becomes available again immediately (transaction rollback).
   - **User Action:** User can update payment method and retry (creates new booking with new `Pending_Payment` status).

3. **Network Error (Transient Failure):**
   - **Booking State:** Booking is created with status `Pending_Payment` before payment attempt.
   - **Payment Failure:** Payment attempt fails due to network timeout or connection error.
   - **State Transition:** `PaymentFailed` event triggers status transition to `Cancelled`.
   - **Worker Availability:** Worker becomes available again immediately (transaction rollback).
   - **User Action:** User can retry payment (creates new booking with new `Pending_Payment` status).

**Explicit Rule:** Bookings are only created when payment processing can be attempted. If Stripe API is unavailable (circuit breaker open), the booking is not created and the cart is preserved to allow retry without losing the booking configuration. This prevents inventory hoarding during outages while maintaining a good user experience.

**Rationale:**
*   Prevents inventory hoarding during outages.
*   Reduces system complexity by using optimistic concurrency (no cart locking mechanism).
*   All payments go directly through Stripe.

**Note:** Webhook reconciliation for missed webhooks (not API outages) is handled separately. See [Weekly Payments Blueprint](./blueprints/booking/weekly-payments.md#webhook-failure-handling-inngest-reconciliation-job) for webhook reconciliation logic.

### Error Monitoring and Alerting

**Critical Alerts:**
- Circuit breaker opens (Stripe API unavailable)
- Payment failure rate > 10% over 5-minute window
- Reconciliation job finds > 10 missed webhooks
- Webhook signature verification failures

**Warning Alerts:**
- Retry rate > 20% of payment attempts
- Payment processing latency > 5 seconds (p95)
- High rate of `Requires_Action` payment intents

**Related Documentation:**
- [Weekly Payments Blueprint](./blueprints/booking/weekly-payments.md) - Detailed webhook processing and reconciliation logic
- [Error Handling Blueprint](./blueprints/system/error-handling.md) - General error handling patterns
