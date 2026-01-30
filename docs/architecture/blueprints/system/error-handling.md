# Feature Blueprint: Error Handling & Resilience

**Domain:** System  
**Related Epics:** All epics (cross-cutting concern)

---

## Requirement Reference

For detailed business rules and context, see:
- [Architecture Document](../../../architecture.md) - High-level error handling strategy
- [Error Message Catalog](../../error-message-catalog.md) - Centralized catalog of all user-facing error messages
- All Epic documents for feature-specific error handling requirements

---

## Technical Strategy (The "How")

### Error Model

**Error Classification:**
- **User Errors:** Invalid input, business rule violations (4xx responses)
- **System Errors:** Internal failures, external service failures (5xx responses)
- **Transient Errors:** Network timeouts, temporary service unavailability (retryable)
- **Permanent Errors:** Invalid configuration, data corruption (not retryable)

**Error Response Format:**
```typescript
{
  error: {
    code: string;        // Machine-readable error code
    message: string;     // User-friendly error message
    details?: any;       // Additional context for debugging
    retryable: boolean;  // Whether operation can be retried
    correlationId: string; // For tracing across services
  }
}
```

### Exception Hierarchy

**Base Exception Classes:**
- `ApplicationError` - Base class for all application errors
- `ValidationError` - Input validation failures (400)
- `AuthenticationError` - Authentication failures (401)
- `AuthorizationError` - Permission failures (403)
- `NotFoundError` - Resource not found (404)
- `BusinessRuleError` - Business logic violations (400)
- `ExternalServiceError` - External API failures (502)
- `DatabaseError` - Database operation failures (500)
- `TransientError` - Temporary failures (retryable)

---

## Error Handling Patterns

### 1. Retry Policies

**External Service Retries:**
- **Stripe Webhooks:** Exponential backoff retry (3 attempts: 1s, 5s, 30s) with webhook signature verification on each retry
- **Stripe Payment Processing:** Exponential backoff retry (3 attempts: 2s, 10s, 60s) for transient payment failures. For weekly payment retries, manual retry available after "Action Required" notification
- **SMS Delivery (Twilio):** Retry failed SMS with exponential backoff (3 attempts: 2s, 10s, 60s), fallback to email if all retries fail **and user has an email address** (phone-first: email is optional for Workers)
- **Email Delivery (SendGrid):** Retry failed emails with exponential backoff (3 attempts: 5s, 30s, 300s), log to dead letter queue after final failure
- **S3 File Operations:** Retry with exponential backoff (5 attempts: 1s, 2s, 4s, 8s, 16s) for transient network errors
- **Tax Calculation Service:** Retry with exponential backoff (3 attempts: 1s, 5s, 15s) for transient calculation failures. Use cached tax rates if service unavailable
- **Refund Processing:** Retry with exponential backoff (3 attempts: 2s, 10s, 30s) for transient refund failures. For card refunds, queue for manual processing if all retries fail

**Database Transaction Retries:**
- **Deadlock Retries:** Automatic retry for deadlock exceptions (up to 3 attempts with 100ms jitter)
- **Connection Pool Exhaustion:** Queue requests with timeout, retry with backoff when pool available

**Retry Implementation:**
```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableError(error) || attempt === maxRetries - 1) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay + Math.random() * 100); // Add jitter
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

### 2. Circuit Breaker Patterns

**Implementation:** Circuit breaker for external service calls to prevent cascade failures.

**Circuit States:**
- **Closed:** Normal operation, requests flow through
- **Open:** Service failing, requests fail fast without calling service
- **Half-Open:** Testing if service recovered, limited requests allowed

**Circuit Breaker Configuration:**
- **Stripe API:** Open after 5 failures in 60s window, half-open after 30s, close after 2 successful requests
- **SMS/Email Services:** Open after 10 failures in 5min window, half-open after 2min, close after 3 successful requests
- **Database Connections:** Open after connection pool exhaustion, half-open after 10s, close after successful connection

**Circuit Breaker Implementation:**
```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= 5) {
      this.state = 'open';
      this.nextAttemptTime = Date.now() + 30000; // 30s cooldown
    }
  }
}
```

---

### 3. Idempotency Keys

**Decision:** All financial operations require idempotency keys to prevent duplicate processing.

**Idempotency Requirements:**
- **Payment Processing:** All Stripe payment intents must include idempotency key (format: `payment-{booking_id}-{timestamp}-{nonce}`)
- **Stripe Transactions:** All payment records include idempotency key to prevent duplicate charges/refunds
- **Webhook Processing:** Stripe webhook events processed with idempotency key to prevent duplicate settlement
- **Refund Operations:** Refund requests include idempotency key to prevent duplicate refunds

**Idempotency Key Storage:**
- Store idempotency keys in Redis with 24-hour TTL
- Check idempotency key before processing financial operations
- Return cached response if idempotency key already processed

**Idempotency Implementation:**
```typescript
async function processWithIdempotency<T>(
  idempotencyKey: string,
  operation: () => Promise<T>
): Promise<T> {
  // Check if already processed
  const cached = await redis.get(`idempotency:${idempotencyKey}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Execute operation
  const result = await operation();

  // Cache result
  await redis.setex(
    `idempotency:${idempotencyKey}`,
    86400, // 24 hours
    JSON.stringify(result)
  );

  return result;
}
```

---

### 4. Dead Letter Queue Strategy

**Decision:** Failed operations that cannot be retried are queued for manual review and processing.

**Dead Letter Queue Use Cases:**
- **Failed Webhook Processing:** Stripe webhooks that fail after all retries (requires manual reconciliation)
- **Failed Email/SMS:** Delivery failures after all retries (requires manual notification)
- **Failed Payment Processing:** Payment intents that fail validation (requires manual review)
- **Failed Time Log Sync:** Offline sync data that fails validation after all retries (requires supervisor review)

**Dead Letter Queue Implementation:**
- Store failed operations in `failed_operations` table with full context
- Include original request, error details, retry count, and timestamp
- Alert operations team for manual review
- Provide admin interface for retry or resolution

**Dead Letter Queue Schema:**
```sql
CREATE TABLE failed_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(100) NOT NULL,
  original_request JSONB NOT NULL,
  error_details JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolution_status VARCHAR(50) -- 'pending', 'retried', 'resolved', 'ignored'
);
```

---

### 5. Database Transaction Rollback Strategies

**Decision:** Use database transactions with explicit rollback for all multi-step operations.

**Transaction Patterns:**
- **Financial Operations:** All Stripe transactions wrapped in database transaction, rollback on any failure
- **Booking Creation:** Booking, payment, and notification steps in transaction, rollback if payment fails
- **Time Log Verification:** Verification status update and notification in transaction, rollback on notification failure
- **Weekly Payment Processing:** Payment creation, Stripe transaction recording, and notification in transaction, rollback on any failure

**Rollback Handling:**
- Log all rollbacks with context for debugging
- Compensating actions for external service calls (e.g., cancel Stripe payment intent if booking creation fails)
- Alert on unexpected rollbacks for investigation

**Transaction Implementation:**
```typescript
async function createBookingWithPayment(bookingData: BookingData) {
  return await db.transaction(async (trx) => {
    try {
      // 1. Create booking
      const booking = await trx('bookings').insert(bookingData).returning('*');

      // 2. Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: bookingData.total_amount,
        currency: 'usd',
        metadata: { booking_id: booking[0].id }
      });

      // 3. Record payment in pending_payments table
      await trx('pending_payments').insert({
        booking_id: booking[0].id,
        payment_intent_id: paymentIntent.id,
        amount: bookingData.total_amount,
        status: 'Pending',
        // ...
      });

      // 4. Send notifications
      await sendBookingConfirmation(booking[0].id);

      return booking[0];
    } catch (error) {
      // Transaction automatically rolls back
      // Compensating action: Cancel payment intent if created
      if (paymentIntent) {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      }
      throw error;
    }
  });
}
```

---

## Logging Standards

**Library:** Winston or Pino (structured logging)

**Format:** JSON structured logs with correlation IDs

**Log Levels:**
- **ERROR:** System errors, failed operations, exceptions
- **WARN:** Recoverable errors, degraded functionality
- **INFO:** Important business events, successful operations
- **DEBUG:** Detailed debugging information (development only)

**Required Context:**
- **Correlation ID:** Unique ID for tracing requests across services
- **Service Context:** Service name, version, environment
- **User Context:** User ID, company ID, roles (when available)
- **Request Context:** HTTP method, path, request ID
- **Error Context:** Error type, stack trace, retry count

**Logging Implementation:**
```typescript
logger.error('Payment processing failed', {
  correlationId: req.correlationId,
  userId: req.user.id,
  companyId: req.companyId,
  bookingId: booking.id,
  error: {
    type: error.constructor.name,
    message: error.message,
    stack: error.stack
  },
  retryCount: retryCount
});
```

---

## User-Facing Error Messages

**Error Message Catalog:**

All user-facing error messages are defined in the [Error Message Catalog](../../error-message-catalog.md). This blueprint focuses on technical error handling patterns (retry logic, circuit breakers, idempotency) rather than duplicating user-facing messages.

**Business Context References:**

For business rules and acceptance criteria related to error handling, see:
- [Epic 1: Foundation & Core Infrastructure](../../../prd/epic-1.md) - Authentication and validation errors
- [Epic 2: Worker Onboarding & Profile Management](../../../prd/epic-2.md) - Profile validation and insurance errors
- [Epic 3: Marketplace & Search](../../../prd/epic-3.md) - Search and marketplace errors
- [Epic 4: Booking & Payment Processing](../../../prd/epic-4.md) - Booking and payment errors
- [Epic 5: Time Tracking & Verification](../../../prd/epic-5.md) - Time tracking and verification errors
- [Epic 6: Financial Operations & Admin](../../../prd/epic-6.md) - Financial operation errors

**Error Message Principles:**
- User-friendly language (no technical jargon)
- Actionable guidance (what user should do)
- Appropriate tone (not blaming user)
- Consistent format across platform

See [Error Message Catalog](../../error-message-catalog.md) for complete list of all user-facing error messages and their contexts.

---

## Error Monitoring and Alerting

**Monitoring:**
- Track error rates by type, endpoint, and service
- Monitor retry success rates
- Track circuit breaker state changes
- Monitor dead letter queue size

**Alerting:**
- Alert on error rate spikes (> 5% of requests)
- Alert on circuit breaker opening
- Alert on dead letter queue growth (> 100 items)
- Alert on critical operation failures (payments, fund releases)

---

## Edge Cases & Failure Handling

### External Service Failures

**Scenario:** Stripe API is down during payment processing
- **Solution:** Circuit breaker opens, requests fail fast, retry after cooldown
- **User Impact:** Payment fails with clear error message, user can retry
- **Recovery:** Automatic retry when circuit breaker closes

### Database Deadlocks

**Scenario:** Concurrent transactions cause deadlock
- **Solution:** Automatic retry with jitter, up to 3 attempts
- **User Impact:** Transparent retry, user sees success after retry
- **Recovery:** Transaction succeeds on retry

### Notification Delivery Failures

**Scenario:** SMS/Email service fails to deliver notification
- **Solution:** Retry with exponential backoff, fallback to alternative channel **if available** (phone-first: email fallback only when user has email address)
- **User Impact:** Notification may be delayed but eventually delivered via primary or fallback channel. For phone-only users, failed SMS notifications are logged to dead letter queue for manual review.
- **Recovery:** Notification delivered on retry or via fallback channel (if available)

### Weekly Payment Processing Failures

**Scenario:** Weekly payment charge fails during Wednesday 10 AM processing
- **Solution:** "Action Required" notification sent, manual retry available via API endpoint `/api/bookings/{bookingId}/weekly-payment/retry`
- **User Impact:** Borrower receives notification, can retry payment manually. Worker released if not resolved by Wednesday 11:59 PM
- **Recovery:** Payment succeeds on manual retry, booking continues normally (status remains `Active`)
- **Error Codes:** `PAYMENT_FAILED`, `PAYMENT_RETRY_FAILED`, `WEEKLY_PAYMENT_NOT_ELIGIBLE`

**Scenario:** Stripe API unavailable during weekly payment processing
- **Solution:** Circuit breaker opens, payment attempt queued for retry when service recovers
- **User Impact:** "Action Required" notification sent, payment retry available when service recovers
- **Recovery:** Automatic retry when circuit breaker closes or manual retry via API

### Tax Calculation Failures

**Scenario:** Tax calculation service unavailable during checkout
- **Solution:** Retry with exponential backoff (3 attempts: 1s, 5s, 15s), use cached tax rates if available
- **User Impact:** Checkout may be delayed, cached tax rates used if service unavailable
- **Recovery:** Tax calculation succeeds on retry, checkout completes
- **Error Codes:** `TAX_CALCULATION_FAILED`, `TAX_EXEMPTION_INVALID` *(Post-MVP)*

**Scenario:** Tax exemption validation fails *(Post-MVP - tax exemption functionality deferred)*
- **Status:** Deferred to post-MVP. Tax exemption functionality not required for MVP since Minnesota does not charge sales tax for temporary labor services.
- **Solution:** Return validation error, allow user to correct exemption information
- **User Impact:** Checkout blocked with clear error message, user can update exemption
- **Recovery:** User corrects exemption information, checkout proceeds

### Refund Processing Failures

**Scenario:** Refund calculation fails due to invalid booking status
- **Solution:** Return validation error with specific reason, prevent refund processing
- **User Impact:** Refund request blocked with clear error message
- **Recovery:** User resolves booking status issue, refund request succeeds
- **Error Codes:** `REFUND_CALCULATION_FAILED`, `INVALID_REFUND_REQUEST`

**Scenario:** Card refund fails (card expired, account closed)
- **Solution:** Retry refund via Stripe API with exponential backoff, notify user of failure
- **User Impact:** Refund processing retried, user notified of status
- **Recovery:** User updates payment method for future refunds, or manual refund processing required
- **Error Codes:** `CARD_REFUND_FAILURE`

**Scenario:** Refund processing service unavailable
- **Solution:** Retry with exponential backoff (3 attempts: 2s, 10s, 30s), queue for manual processing if all retries fail
- **User Impact:** Refund may be delayed, queued for manual processing
- **Recovery:** Refund processed automatically on retry or manually by admin
- **Error Codes:** `REFUND_PROCESSING_FAILURE`


---

## Related Documentation

- [Architecture Document](../../../architecture.md) - High-level error handling strategy
- [Background Jobs Blueprint](./background-jobs.md) - Scheduled job error handling
- [Weekly Payments Blueprint](../booking/weekly-payments.md) - Payment processing error handling
- [Epic 4: Booking & Payment Processing](../../../prd/epic-4.md) - Booking error handling acceptance criteria
- [Epic 5: Time Tracking & Verification](../../../prd/epic-5.md) - Time tracking error handling acceptance criteria
- [Epic 6: Financial Operations & Admin](../../../prd/epic-6.md) - Financial operations error handling acceptance criteria