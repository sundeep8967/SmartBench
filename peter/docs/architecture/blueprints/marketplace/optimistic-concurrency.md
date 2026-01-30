# Feature Blueprint: Optimistic Concurrency for Worker Availability
**Domain:** Marketplace
**Related Epics:** [Epic 3: Marketplace & Search](../../../prd/epic-3.md), [Epic 4: Booking & Payment Processing](../../../prd/epic-4.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 3.4: Real-Time Availability Check](../../../prd/epic-3.md#story-34-real-time-availability-check)
- [Epic 4.1: Booking Cart Management](../../../prd/epic-4.md#story-41-booking-cart-management)

## Technical Strategy (The "How")

### Optimistic Concurrency Approach

**Core Principle:** Workers remain visible in search results until booking is fully paid and confirmed. The cart is a simple selection list with no reservation power. Final availability validation occurs at checkout (before payment processing) using database-level locking to prevent double-booking.

**Real-Time Availability:** Since search queries hit the database directly (PostgreSQL native search), availability is **real-time and native**. There is no sync delay between database updates and search results. The Search Query and Checkout validation both query the exact same source of truth (`bookings` table), eliminating dual-write race conditions and ensuring strict data consistency.

**Key Behaviors:**
1. Workers appear in search results even when in another user's cart
2. Cart has no reservation power - multiple users can add the same worker to their carts
3. **Real-Time Availability:** Search queries check availability directly against the `bookings` table in real-time - no index sync delay
4. Final availability check occurs at checkout (immediately before payment)
5. First user to complete payment wins; second user receives error
6. Workers become unavailable in search only after booking status = 'Confirmed'
7. **Single Source of Truth:** Both search queries and checkout validation query the same `bookings` table, ensuring consistency and eliminating race conditions from dual-write scenarios

### Day-Based Availability Logic

**Availability Calculation:**
```typescript
function getUnavailableDays(startDate: Date, endDate: Date): string[] {
  const unavailableDays: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Add entire day (YYYY-MM-DD format)
    unavailableDays.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return unavailableDays;
}

// Example: Booking from Jan 15 2 PM to Jan 16 10 AM
// Unavailable: ['2026-01-15', '2026-01-16'] (both entire days)
```

### Cart Implementation (No Locking)

**Simple Cart Addition:**
```typescript
async function addToCart(req: Request, res: Response) {
  const { workerId, startDate, endDate } = req.body;
  const borrowerCompanyId = req.user.companyId;

  // No locking - just add to cart
  // Worker remains visible in search results
  const [cartItem] = await db('cart_items').insert({
    borrower_company_id: borrowerCompanyId,
    worker_id: workerId,
    start_date: startDate,
    end_date: endDate
  }).returning('*');

  res.json({
    success: true,
    cartItemId: cartItem.id
  });
}
```

### Search Query (No Lock Exclusion)

**Modified Search Query:**
```typescript
function buildSearchQuery(filters: SearchFilters, page: number, pageSize: number) {
  let query = buildBaseSearchQuery(filters, page, pageSize);

  // Exclude workers with bookings in blocking statuses for requested dates
  // Blocking statuses: Confirmed, Active, Pending_Payment, Payment_Paused_Dispute,
  // Suspended_Insurance
  // Note: Workers in carts are NOT excluded
  if (filters.availabilityDateRange) {
    query = query.whereNotExists(function() {
      this.select('*')
        .from('bookings as b')
        .whereRaw('b.worker_id = u.id')
        .whereIn('b.status', ['Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance'])
        .where(function() {
          this.whereBetween('b.start_date', [
            filters.availabilityDateRange.start,
            filters.availabilityDateRange.end
          ])
          .orWhereBetween('b.end_date', [
            filters.availabilityDateRange.start,
            filters.availabilityDateRange.end
          ])
          .orWhere(function() {
            this.where('b.start_date', '<=', filters.availabilityDateRange.start)
              .where('b.end_date', '>=', filters.availabilityDateRange.end);
          });
        });
    });
  }

  return query;
}
```

### Checkout with Final Availability Check

**Explicit Rule:** Final availability validation occurs at checkout (immediately before payment processing). This is the only point where double-booking is prevented. The check uses database-level locking (`SELECT FOR UPDATE`) to ensure atomicity and prevent race conditions.

**Single Source of Truth:** The checkout availability check queries the same `bookings` table that the search query uses. Since both operations read from the same database table in real-time, there is no sync delay or dual-write scenario. This ensures strict data consistency and eliminates race conditions that would exist with a separate search index.

**Atomic Checkout:**
```typescript
async function checkout(req: Request, res: Response) {
  const { cartItemIds } = req.body;
  const borrowerCompanyId = req.user.companyId;

  // Start transaction
  return await db.transaction(async (trx) => {
    const bookings = [];

    for (const cartItemId of cartItemIds) {
      // Get cart item with row lock
      const cartItem = await trx('cart_items')
        .where({ id: cartItemId, borrower_company_id: borrowerCompanyId })
        .forUpdate() // Row lock to prevent concurrent checkout
        .first();

      if (!cartItem) {
        throw new Error(`Cart item ${cartItemId} not found`);
      }

      // FINAL AVAILABILITY CHECK (with row lock)
      const availability = await checkWorkerAvailabilityWithLock(
        trx,
        cartItem.worker_id,
        cartItem.start_date,
        cartItem.end_date
      );

      if (!availability.available) {
        throw new Error(`Worker ${cartItem.worker_id} no longer available: ${availability.reason}`);
      }

      // Create booking
      const [booking] = await trx('bookings').insert({
        project_id: req.body.projectId,
        worker_id: cartItem.worker_id,
        borrower_company_id: borrowerCompanyId,
        lender_company_id: await getWorkerCompanyId(cartItem.worker_id),
        start_date: cartItem.start_date,
        end_date: cartItem.end_date,
        status: 'Pending_Payment',
        payment_type: req.body.paymentType
      }).returning('*');

      bookings.push(booking);
      
      // Remove cart item
      await trx('cart_items').where({ id: cartItemId }).delete();
    }

    // Process payment (Stripe)
    const paymentResult = await processPayment(req.body.paymentMethod, bookings);

    if (!paymentResult.success) {
      throw new Error('Payment failed');
    }

    // Payment succeeded: Update booking status to 'Confirmed'
    // Worker now becomes unavailable in search results
    for (const booking of bookings) {
      await trx('bookings')
        .where({ id: booking.id })
        .update({ status: 'Confirmed' });
    }

    return { success: true, bookings };
  });
}

async function checkWorkerAvailabilityWithLock(
  trx: any,
  workerId: string,
  startDate: Date,
  endDate: Date
): Promise<{ available: boolean; reason?: string }> {
  // Check for conflicting bookings in blocking statuses (with row lock)
  // Blocking statuses: Confirmed, Active, Pending_Payment, Payment_Paused_Dispute,
  // Suspended_Insurance
  // These represent active bookings that should prevent double-booking
  const conflictingBooking = await trx('bookings')
    .where({ worker_id: workerId })
    .whereIn('status', ['Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance'])
    .where(function() {
      this.whereBetween('start_date', [startDate, endDate])
        .orWhereBetween('end_date', [startDate, endDate])
        .orWhere(function() {
          this.where('start_date', '<=', startDate)
            .where('end_date', '>=', endDate);
        });
    })
    .forUpdate() // Row lock to prevent concurrent bookings
    .first();

  if (conflictingBooking) {
    return { available: false, reason: 'Worker already booked for these dates' };
  }

  return { available: true };
}
```

## Cart Synchronization Behavior

### Server-Side Authority

**Principle:** Cart state is server-side authoritative. All cart operations (add, remove, update) are processed on the server, and the server's cart state is the single source of truth.

**Implementation:**
- Cart state stored in `cart_items` table (database)
- Client applications fetch cart state from server on load
- No local cart state persistence (or local state is immediately synced with server)

### Conflict Resolution

**Strategy:** Last-write-wins for conflicts.

**Behavior:**
- If user adds items on Device A, then adds different items on Device B, Device B's operations overwrite conflicting items
- The most recent server-side operation (by timestamp) determines the final cart state
- Concurrent operations from multiple devices are serialized by the server (database transactions ensure ordering)

**Example Scenario:**
1. User adds Worker A to cart on Device A (timestamp: 10:00:00)
2. User adds Worker B to cart on Device B (timestamp: 10:00:05)
3. User adds Worker C to cart on Device A (timestamp: 10:00:10)
4. **Result:** Cart contains Worker A, Worker B, and Worker C (all operations applied in order)

**Conflict Scenario:**
1. User adds Worker A to cart on Device A (timestamp: 10:00:00)
2. User removes Worker A from cart on Device B (timestamp: 10:00:05)
3. **Result:** Worker A is removed (last write wins - remove operation overwrites add)

### Device Synchronization

**Behavior:** When a user logs in from a new device, the cart is loaded from the server (not merged with any local state).

**Implementation:**
- On device login/session start, fetch cart from server: `GET /api/cart`
- Server returns current cart state from `cart_items` table
- Client replaces any local cart state with server state
- No merge logic - server state is authoritative

**Multi-Device Behavior:**
- If the same worker is added to cart on two devices simultaneously, the last write wins
- Server processes operations in order (database transactions ensure serialization)
- Final operation determines whether the worker is in the cart or not

### Atomic Operations

**Guarantee:** Cart operations (add/remove) are atomic server-side operations.

**Implementation:**
- Each add or remove operation is processed as a single database transaction
- Transaction ensures cart consistency (no partial updates)
- Concurrent operations are serialized by database locking

## Edge Cases & Failure Handling

### Race Conditions

**Scenario:** Two borrowers try to book same worker simultaneously
- **Solution:** Database row locking (`SELECT FOR UPDATE`) at checkout
- **Handling:** First transaction succeeds, second fails with clear error
- **UX:** Show "Worker no longer available" message
- **Real-Time Consistency:** Since both search and checkout query the same `bookings` table directly, there is no sync delay or dual-write race condition. The database transaction ensures atomicity.

### Concurrent Checkout Attempts

**Scenario:** User clicks checkout button multiple times
- **Solution:** Idempotency key or transaction deduplication
- **Handling:** Process first request, ignore duplicates
- **UX:** Disable checkout button after first click

### Payment Failure After Availability Check

**Scenario:** Payment fails after availability check passes
- **Solution:** Transaction rollback releases worker immediately
- **Handling:** Rollback transaction, worker becomes available again
- **UX:** Show payment error, allow retry. Worker remains available for other users.

### Worker Booked Between Cart Addition and Checkout

**Scenario:** Worker is booked by another user after being added to cart
- **Solution:** Final availability check at checkout detects conflict using database-level locking (`SELECT FOR UPDATE`)
- **Handling:** Checkout fails with clear error message. The final availability check queries the same `bookings` table that search queries use, ensuring real-time consistency. Since both operations read from the same database source in real-time, there is no sync delay - if a booking was created between search and checkout, the checkout validation will immediately detect it.
- **UX:** Show "Worker no longer available" message, allow user to remove from cart and select different worker
- **Real-Time Detection:** The checkout availability check uses `SELECT FOR UPDATE` with row-level locking, ensuring it sees the most current booking state. If a booking was created between the search query and checkout attempt, the checkout validation will detect the conflict and prevent double-booking.

### Booking Created Between Search Query and Checkout

**Scenario:** A booking is created for a worker between when a user sees the worker in search results and when they attempt checkout
- **Real-Time Consistency:** Since search queries and checkout validation both query the same `bookings` table directly in real-time, there is no sync delay. If a booking is created between search and checkout, the checkout validation will immediately detect it.
- **Database-Level Locking:** The checkout availability check uses `SELECT FOR UPDATE` with row-level locking, ensuring atomicity and preventing race conditions. The lock ensures that:
  - The checkout transaction sees the most current booking state
  - Concurrent checkout attempts are serialized (only one can succeed)
  - No double-booking can occur even if multiple users attempt to book the same worker simultaneously
- **User Experience:** If a booking conflict is detected at checkout, the user receives an error message indicating the worker is no longer available. The user can then remove the worker from their cart and select a different worker.
- **No False Positives:** The real-time database query ensures that workers shown as available in search results are actually available at the time of checkout (within the constraints of transaction isolation). The only scenario where a worker might appear available but be unavailable at checkout is if another user completes checkout between the search query and this user's checkout attempt - this is expected behavior and is handled gracefully.

### Search Query Execution During Booking Status Transitions

**Scenario:** A search query executes while a booking status is transitioning (e.g., from `Active` to `Cancelled`).

**Behavior:**
- **Transaction Isolation:** Search queries use READ COMMITTED isolation level (PostgreSQL default)
- **Consistent Snapshot:** Query sees either old status or new status (never partial)
- **Timing Dependency:** Whether query sees old or new status depends on transaction commit timing
- **Acceptable Behavior:** This is expected PostgreSQL behavior - no special handling needed
- **Final Check:** Final availability check at checkout uses `SELECT FOR UPDATE` to ensure consistency

**Example:**
- Time T1: Search query starts, sees booking with status = 'Active'
- Time T2: Booking status changes to 'Cancelled' (transaction commits)
- Time T3: Search query completes
- Result: Query sees either old state (status = 'Active') - worker excluded, or new state (status = 'Cancelled') - worker included
- Never sees partial state due to transaction isolation

**Concurrent Query Scenarios:**
- **Multiple Simultaneous Searches During Status Transition:** Multiple search queries executing simultaneously during a booking status transition will each see a consistent snapshot (either old or new status). The READ COMMITTED isolation level ensures no partial state is visible.
- **Search Query Executing While Checkout Transaction in Progress:** If a search query executes while a checkout transaction is in progress (booking being created), the search query may or may not see the new booking depending on transaction commit timing. This is acceptable because: (1) The checkout transaction uses `SELECT FOR UPDATE` to prevent double-booking, (2) If checkout completes before search query, the worker is correctly excluded from results, (3) If search query completes before checkout commits, the worker may appear in results but will be correctly excluded at final checkout validation.

### Unlisted Worker Checkout Handling

**Scenario:** A worker is unlisted (state changes from `Listed` to `Profile_Complete`) while a user has that worker in their cart.

**Behavior:**
- **Real-Time Updates:** Search queries are real-time - unlisted workers disappear from new search results immediately
- **Existing Results:** Workers already in search results remain visible until user refreshes or performs new search
- **Cart Handling:** If unlisted worker is in cart, checkout validation detects unlisted state
- **Checkout Validation:** Final availability check at checkout validates worker is still `Listed`
  - If worker is unlisted, checkout fails with error: "Worker is no longer available. Please remove from cart."
  - User can remove unlisted worker from cart and select different worker
- **User Experience:** This is expected behavior - workers can be unlisted at any time

**Implementation:**
```typescript
async function checkWorkerAvailabilityWithLock(
  trx: any,
  workerId: string,
  startDate: Date,
  endDate: Date
): Promise<{ available: boolean; reason?: string }> {
  // Check worker is still listed
  const worker = await trx('users')
    .where({ id: workerId })
    .where('user_state', 'Listed')
    .forUpdate()
    .first();
  
  if (!worker) {
    return { available: false, reason: 'Worker is no longer available' };
  }
  
  // Check for conflicting bookings (existing logic)
  // ...
}
```

## Data Model Impact

### Tables Modified/Created

**Schema Reference:** See [schema-marketplace.md](../../schema-marketplace.md) for the `cart_items` table definition, indexes, constraints, and foreign keys.

**Key Changes:**
- `cart_items` table does NOT include `locked_until` field
- No Redis keys needed for cart locking
- Cart is a simple selection list with no reservation mechanism

### Performance Considerations

1. **Database Locks:** Use `SELECT FOR UPDATE` only at checkout (minimal lock duration)
2. **Search Performance:** No need to exclude workers in carts from search (simpler queries)
3. **No Lock Cleanup:** No expired locks to clean up (no locking mechanism)
4. **Concurrency:** Optimistic approach allows higher concurrency (workers visible until booked)
