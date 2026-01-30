# Test Strategy

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Comprehensive test strategy for the SmartBench platform, covering unit, integration, E2E, and performance testing.

---

## Table of Contents

- [Test Philosophy](#test-philosophy)
- [Test Pyramid](#test-pyramid)
- [Test Types & Requirements](#test-types-requirements)
- [Test Coverage Requirements](#test-coverage-requirements)
- [Epic-Specific Test Requirements](#epic-specific-test-requirements)
- [Test Data Management](#test-data-management)
- [Test Environment Strategy](#test-environment-strategy)
- [CI/CD Integration](#cicd-integration)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Test Maintenance](#test-maintenance)

---

## Test Philosophy

### Core Principles

1. **Test at the Right Level:** Test business logic at the unit level, integration at the API level, and user journeys at the E2E level
2. **Fast Feedback:** Unit tests should run in seconds, integration tests in minutes, E2E tests in tens of minutes
3. **Maintainability:** Tests should be easy to read, understand, and maintain
4. **Confidence:** Tests should provide confidence that the system works correctly
5. **Pragmatic Coverage:** Focus on critical paths, business logic, and user journeys

### Testing Priorities

**P0 - Critical (Must Test):**
- Revenue-impacting functionality (payments, bookings)
- Security-critical paths (authentication, authorization)
- Data integrity operations (financial transactions, Stripe processing)
- Regulatory compliance requirements
- Previously broken functionality (regression prevention)

**P1 - High (Should Test):**
- Core user journeys
- Frequently used features
- Features with complex logic
- Integration points between systems

**P2 - Medium (Nice to Test):**
- Secondary features
- Admin functionality
- Reporting features

**P3 - Low (Test if Time Permits):**
- Rarely used features
- Cosmetic issues
- Non-critical optimizations

---

## Test Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /____\     Critical user journeys only
     /      \    
    /        \   Integration Tests (35%)
   /__________\  API endpoints, DB operations, external services
  /            \
 /              \ Unit Tests (60%)
/________________\ Business logic, domain models, utilities
```

**Distribution:**
- **60% Unit Tests:** Fast, isolated, test business logic
- **35% Integration Tests:** Test component interactions, API endpoints, database operations
- **5% E2E Tests:** Test complete user journeys, critical workflows

---

## Test Types & Requirements

### Unit Tests

**Purpose:** Test individual functions, methods, and business logic in isolation.

**Coverage Requirement:** 80% code coverage

**What to Test:**
- **Critical Business Logic:**
  - Financial Calculator (Wednesday Rule logic)
  - Overtime Calculator (Start-Day Rule, week boundary handling)
  - Time tracking calculations
  - Refund calculations
  - Service Fee calculations
- **Domain Logic:**
  - All domain model methods
  - Validation logic
  - State machine transitions
  - Business rule enforcement
- **Utility Functions:**
  - Helper functions
  - Formatters
  - Validators
  - Data transformers

**Test Location:** Co-located with source code
```
src/modules/{domain}/features/{feature}/__tests__/
```

**Best Practices:**
- Mock external dependencies (database, APIs, services)
- Test both happy paths and error cases
- Test edge cases and boundary conditions
- Keep tests fast (< 100ms per test)
- Use descriptive test names

**Example:**
```typescript
describe('FinancialCalculator', () => {
  describe('calculateWeeklyPayment', () => {
    it('should calculate payment for full week (Monday-Sunday)', () => {
      // Test implementation
    });
    
    it('should apply Wednesday Rule for partial week', () => {
      // Test implementation
    });
    
    it('should handle timezone boundaries correctly', () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

**Purpose:** Test component interactions, API endpoints, database operations, and external service integrations.

**Coverage Requirement:** 60% code coverage

**What to Test:**
- **API Endpoints:**
  - All REST API endpoints
  - Request/response validation
  - Authentication and authorization
  - Error handling
  - Rate limiting
- **Database Transactions:**
  - Atomic operations
  - Row locking
  - Transaction rollbacks
  - Foreign key constraints
  - Unique constraints
- **External Service Integrations:**
  - Stripe Payment Flow (webhook handling, reconciliation)
  - SMS/Email delivery (Twilio, SendGrid)
  - GPS coordinate capture (Google Maps API)
- **Cross-Module Communication:**
  - Event-driven workflows
  - Service boundaries
  - Event publishing and consumption

**Test Location:**
```
src/modules/{domain}/features/{feature}/__tests__/integration/
```

**Best Practices:**
- Use test database (separate from development)
- Reset database state between tests
- Mock external services (Stripe, Twilio, etc.)
- Test real database operations
- Test transaction boundaries
- Verify data integrity

**Example:**
```typescript
describe('POST /api/bookings', () => {
  it('should create booking with valid data', async () => {
    // Test implementation with real database
  });
  
  it('should reject booking with invalid payment method', async () => {
    // Test implementation
  });
  
  it('should handle concurrent booking attempts', async () => {
    // Test implementation with row locking
  });
});
```

### E2E Tests

**Purpose:** Test complete user journeys and critical workflows end-to-end.

**Coverage Requirement:** Critical workflows only (5% of total tests)

**Required E2E Tests:**
1. **Complete Booking Workflow:**
   - Search workers → Add to cart → Checkout → Payment → Booking confirmation
2. **Time Clock Workflow:**
   - Clock in → Work → Clock out → Verification → Time log creation
3. **Payment Processing Workflow:**
   - Weekly progress payment → Webhook → Stripe transfer to Connected Account
4. **Dispute Resolution Workflow (Chat-Based Resolution with Fork in the Road Logic):**
   - **Option A Dispute (Dispute Shift Only):**
     - Dispute creation → Booking remains `Active` → Worker CAN clock in → Only disputed shift funds frozen → Chat-based resolution → Super Admin processes resolution → Funds released per agreement
     - Multiple Option A disputes → Booking remains `Active` → All disputed shifts frozen independently → Workers CAN clock in for non-disputed shifts
     - **P0 Test:** Verify worker CAN clock in for future shifts when Option A dispute is active
     - **P0 Test:** Verify weekly payment is paused (`Payment_Paused_Dispute` status) but clock-in is NOT blocked
     - **P0 Test:** Verify only disputed shift funds are frozen in Stripe escrow (Stripe hold), not entire booking
   - **Option B Dispute (End Booking & Dispute):**
     - Dispute creation → Booking immediately `Cancelled` → Worker released → Total freeze (disputed shift + cancellation penalty) → Resolution → Settlement → Refund
     - **P0 Test:** Verify worker is immediately released and available in search when Option B is selected
     - **P0 Test:** Verify both disputed shift funds AND cancellation penalty are frozen in Stripe escrow (Stripe hold)
     - **P0 Test:** Verify worker becomes available in search immediately when booking cancelled (real-time availability via PostgreSQL query - no sync delay)
   - **Multiple Disputes:**
     - **P0 Test:** Verify booking remains `Active` until ALL Option A disputes are resolved
     - **P0 Test:** Verify Option B takes precedence and immediately cancels booking even if Option A disputes exist
   - **Dispute Timeout:**
     - **P0 Test:** Verify future shifts cancelled but booking remains `Active` (status `Payment_Paused_Dispute`) when Option A dispute times out
     - **P0 Test:** Verify no timeout action needed for Option B disputes (booking already cancelled)
   - **Edge Cases:**
     - Dispute filed during payment failure (status remains `Active`) → Option A → `Payment_Paused_Dispute`, Option B → `Cancelled`
     - Dispute filed during `Suspended_Insurance` → Option A → `Payment_Paused_Dispute` (insurance still required), Option B → `Cancelled`
     - Dispute timeout with Option A → Future shifts cancelled, booking remains `Active` (status `Payment_Paused_Dispute`)
     - Dispute timeout with Option B → Already `Cancelled`, no additional action
     - Insurance expiration during Option A dispute → `Suspended_Insurance` (insurance takes precedence)
     - Insurance expiration during Option B dispute → Already `Cancelled`, no change
     - **P0 Test:** Verify subscription expiration during Option A dispute → Status remains `Payment_Paused_Dispute` (no status change), dispute remains active
     - **P0 Test:** Verify dispute filed during active shift (worker clocked in) → Option A allows continuation, Option B immediately clocks out worker
     - **P0 Test:** Verify Option B dispute cannot be filed on already-cancelled booking (returns error)
5. **Event-Driven Compliance Model:**
   - Insurance expiration during active booking → Suspended_Insurance status → Payment loop excludes booking → Insurance renewal → Booking resumes
   - Payment failure → Status remains Active → Payment retry → Booking continues (no status change on failure)

**Test Location:**
```
tests/e2e/
```

**Best Practices:**
- Use real browser automation (Playwright, Cypress)
- Test against staging environment
- Use test data that mirrors production
- Test critical user journeys only
- Keep tests maintainable and readable
- Use page object pattern

**Rationale:** Limited E2E scope for MVP to reduce maintenance overhead while ensuring critical paths work end-to-end.

---

## Test Coverage Requirements

### Overall Coverage Targets

- **Unit Tests:** 80% code coverage minimum
- **Integration Tests:** 60% code coverage minimum
- **E2E Tests:** 100% coverage of critical workflows

### Coverage by Epic

**All Epics Must Include:**
- Unit tests for all business logic (80% coverage)
- Integration tests for all API endpoints (60% coverage)
- At least one E2E test for the primary user workflow in the epic

### Coverage Gaps

Coverage gaps must be justified in code review comments. Acceptable reasons:
- Generated code (migrations, API clients)
- Third-party library wrappers
- Deprecated code scheduled for removal
- Code that will be refactored in next sprint

---

## Epic-Specific Test Requirements

### Epic 1: Foundation & Core Infrastructure

**Unit Tests:**
- Authentication logic (JWT generation, validation)
- RBAC permission checks
- Stripe payment processing calculations
- User model state transitions
- Company membership logic

**Integration Tests:**
- Auth endpoints (`POST /api/auth/login`, `POST /api/auth/refresh`)
- Company creation (`POST /api/companies`)
- Stripe Connect account initialization
- User profile endpoints

**E2E Test:**
- User registration → Company creation → Stripe Connect account setup

### Epic 1.1: Project Management

**Unit Tests:**
- Project validation logic
- Address validation
- Timezone handling

**Integration Tests:**
- Project CRUD endpoints
- Project listing with filters
- Project update authorization

**E2E Test:**
- Create project → Edit project → View project list

### Epic 2: Worker Onboarding & Profile Management

**Unit Tests:**
- Profile validation logic
- Insurance verification logic
- Roster management logic
- Worker state machine transitions
- Skills hierarchy validation

**Integration Tests:**
- Worker profile API (`POST /api/workers/profile`, `PUT /api/workers/profile`)
- Insurance upload/verification endpoints
- Roster invite endpoints (`POST /api/companies/{id}/roster/invite`)
- Magic link generation and validation

**E2E Test:**
- Worker invite → Profile completion → Listing activation

### Epic 3: Marketplace & Search

**Unit Tests:**
- Search filtering logic (PostgreSQL native search with `pg_trgm` for fuzzy matching)
- Availability calculations (real-time `NOT EXISTS` queries against `bookings` table)
- Geo-distance calculations (using `earthdistance` or `postgis` extensions)
- Optimistic concurrency checkout validation (database-level locking with `SELECT FOR UPDATE`)

**Integration Tests:**
- Search endpoint (`GET /api/marketplace/workers/search`) - Verify PostgreSQL native search queries database directly
- Availability management endpoints - Verify real-time availability checks (no sync delay)
- Cart endpoints (`POST /api/cart`, `PUT /api/cart/{id}`) - Verify cart operations don't affect search availability
- Checkout availability validation endpoints - Verify final availability check uses database-level locking
- **PostgreSQL Extension Failure Tests:**
  - Search query with `pg_trgm` extension unavailable (fallback to exact `ILIKE` matching)
  - Search query with `earthdistance`/`postgis` extension unavailable (disable geo search, text search continues)
  - Search query with both extensions unavailable (return error, disable search)
  - Extension becomes unavailable during active query execution (mid-query failure handling)
- **Degraded Search Mode Tests:**
  - Text-only search mode (geo extension unavailable) - verify text search works, geo filtering disabled, appropriate error codes returned
  - Full search mode (all extensions available) - verify all features work (text search, geo search, availability checks)
  - Extension restoration tests - verify search returns to full mode after extension restoration
- **Connection Pool Exhaustion Tests:**
  - Search query when connection pool is exhausted (return error, fail fast)
  - Connection pool exhaustion recovery (verify queries succeed after pool recovers)
  - Circuit breaker activation when pool exhaustion occurs repeatedly
- **Replica Lag Tests:**
  - Search query with replica lag < 100ms (normal operation, queries routed to replica)
  - Search query with replica lag > 500ms (automatic fallback to primary database)
  - Replica lag recovery (queries resume routing to replica when lag returns to < 100ms)
- **Concurrent Search + Booking Creation Tests:**
  - Multiple users search for same worker simultaneously, then attempt checkout (verify only one succeeds)
  - Search query executes while booking is being created (verify search may or may not see new booking, but checkout prevents double-booking)
  - Booking created between search query and checkout attempt (verify checkout detects conflict)
- **Saved Search Alert Edge Case Tests:**
  - Saved search alert with invalid criteria (deleted zip code, invalid trade) - verify query executes but returns zero workers
  - Saved search alert query failure (database error, extension unavailability) - verify error handling and retry logic
  - Saved search alert with worker matching criteria but not available - verify worker excluded from alert results
- **Extension Installation Failure Tests:**
  - Extension installation failure during deployment (verify migration rollback, error handling)
  - Extension rollback procedures (verify extensions can be removed if needed, search functionality disabled gracefully)
  - Extension installation on replicas during runtime (verify installation timing, query routing during installation)
  - Extension installation order validation (verify dependency order: pg_trgm → cube → earthdistance)
  - Extension installation failure if dependency missing (verify migration fails if cube installation fails before earthdistance)
- **Cache Invalidation Edge Case Tests:**
  - Cache invalidation queue overflow scenarios (verify alert triggered, caching disabled, queue processing)
  - Redis failover during cache invalidation (verify invalidation retry after Redis recovery, idempotent operations)
  - Cache invalidation during extension updates (verify cache invalidated when extensions installed/updated)

**E2E Test:**
- Search workers → Filter results → Add to cart → View cart
- **Concurrent Booking E2E Test:** Multiple users search for same worker → Both add to cart → Both attempt checkout → Verify only one succeeds
- **Note:** All search tests use PostgreSQL native search patterns - no search index sync workflows or Meilisearch-specific test patterns

### Epic 4: Booking & Payment Processing

**Unit Tests:**
- Booking validation logic
- Payment calculation logic
- Site Contact selection logic
- Weekly payment scheduling logic (Wednesday Rule)
- Cart synchronization logic
- **Event-Driven Compliance Model:**
  - Insurance validation separation from payment processing
  - Insurance Hard Stop workflow (independent of payment timing)
  - Payment failure handling (status remains Active until hard cutoff)
  - Suspended_Insurance status handling (compliance event-driven)
  - **Dispute Fork Logic:**
    - Option A dispute: Booking remains `Active`, worker CAN clock in, only disputed shift funds frozen
    - Option B dispute: Booking immediately `Cancelled`, worker released, total freeze (disputed shift + cancellation penalty)
    - Dispute filed during different booking statuses (`Active`, `Suspended_Insurance`, `Payment_Paused_Dispute`)
    - Multiple Option A disputes on same booking
    - Option A + Option B disputes (Option B takes precedence)
    - Dispute timeout job with Option A vs Option B
    - Insurance expiration during Option A vs Option B disputes

**Integration Tests:**
- Booking creation (`POST /api/bookings`)
- Payment processing endpoints
- Site Contact update endpoints (`PUT /api/bookings/{bookingId}`)
- Weekly payment endpoints (verify insurance validation NOT performed during payment loop)
- Cart checkout endpoint
- **Event-Driven Compliance Model:**
  - Insurance expiration monitoring job (nightly job triggers Suspended_Insurance)
  - Weekly payment processing (verify only Active bookings processed, no insurance checks)
  - Payment retry endpoint (verify insurance validation NOT checked)
  - Booking status transitions (payment failure keeps status Active until hard cutoff, Suspended_Insurance blocks clock-in)
  - **Dispute Resolution:**
    - Dispute creation endpoints (`POST /api/timesheets/{timesheetId}/dispute`, `POST /api/incidents`)
    - Verify `disputeOption` parameter required (Option A or Option B)
    - Option A dispute: Verify booking remains `Active`, worker can clock in
    - Option B dispute: Verify booking immediately `Cancelled`, worker released
    - Dispute timeout job execution (Option A vs Option B handling)
    - Weekly payment dispute check (Option A skips payment, Option B already cancelled)
    - Insurance expiration during active disputes

**E2E Test:**
- Complete booking workflow (search → cart → checkout → payment)
- **Event-Driven Compliance Model:**
  - Insurance expiration during active booking → Suspended_Insurance status → payment loop excludes booking
  - Payment failure → Status remains Active → payment retry → booking continues

### Epic 5: Time Tracking & Verification

**Unit Tests:**
- Time log data validation logic (format, required fields, business rules)
- GPS coordinate capture logic
- Break/lunch policy enforcement (based on lender-configured settings, not state validation)
- Self-attestation workflow (ToS acceptance, audit trail tracking)
- **Negotiation Loop Logic (3-Step Verification):**
  - Step 1: Supervisor edits time from `Pending_Verification` → Status: `Pending_Worker_Review`, timer resets to 4 hours
  - Step 2: Worker accepts edit → Status: `Verified`, funds released
  - Step 2: Worker rejects with comment → Status: `Pending_Supervisor_Reevaluation`, timer resets to 4 hours
  - Step 3: Supervisor corrects time → Status: `Pending_Worker_Review` (loops back to Step 2), timer resets to 4 hours
  - Step 3: Supervisor files dispute (Impasse) → Status: `Disputed`, funds frozen
  - Timer reset on status transitions: Verify full 4-hour reset on each status change
  - Auto-approval timer cancellation when dispute filed
  - Verified status lock: Cannot edit verified timesheets
- **Dispute Fork Logic:**
  - Option A dispute creation: Verify booking remains `Active`, worker can clock in
  - Option B dispute creation: Verify booking immediately `Cancelled`, worker released
  - Dispute filed during different timesheet statuses (`Pending_Verification`, `Pending_Worker_Review`, `Pending_Supervisor_Reevaluation`, `Pending_Supervisor_Verification`)
  - Dispute timeout calculation (3 hours after `dispute_filed_at`)
  - Dispute timeout with Option A: Future shifts cancelled, booking remains `Active`
  - Dispute timeout with Option B: Already `Cancelled`, no action
- Offline sync logic
- Verification workflow logic

**Integration Tests:**
- Clock in/out endpoints (`POST /api/time-log/clock-in`, `POST /api/time-log/{id}/clock-out`)
- **Negotiation Loop Endpoints:**
  - Supervisor edit endpoint (`POST /api/timesheets/{id}/edit`) - Verify only allowed from `Pending_Verification`, timer resets to 4 hours
  - Worker review endpoint (`POST /api/timesheets/{id}/worker-review`) - Verify accept/reject actions, timer resets on rejection
  - Supervisor re-evaluation endpoint (`POST /api/timesheets/{id}/supervisor-reevaluation`) - Verify correct/file_dispute actions, timer resets on correction
- **Dispute Resolution Chat Endpoints:**
  - Get chat messages (`GET /api/disputes/{disputeId}/chat`) - Verify system-injected evidence messages
  - Send chat message (`POST /api/disputes/{disputeId}/chat/messages`) - Verify only Company Admins can send messages
- Verification endpoints (`POST /api/time-log/{id}/verify`)
- Offline sync endpoints
- GPS coordinate capture endpoints

**E2E Test:**
- Time clock workflow (clock in → work → clock out → verification)

### Epic 6: Financial Operations & Admin

**Unit Tests:**
- Refund calculation logic
- Overtime calculation logic
- Stripe withdrawal/payout logic
- Service Fee calculation logic
- Stripe transaction processing logic

**Integration Tests:**
- Refund endpoints (`POST /api/bookings/{id}/refund/calculate`, `POST /api/bookings/{id}/cancel`)
- Overtime status endpoint (`GET /api/bookings/{id}/overtime/status`)
- Stripe payout endpoints (`GET /api/stripe/balance`, `POST /api/stripe/withdraw`) - Direct Stripe API integration
- Weekly payment retry endpoint (`POST /api/bookings/{id}/weekly-payment/retry`)

**E2E Test:**
- Payment processing workflow (weekly progress payment → webhook → Stripe transfer to Connected Account)

### Epic 7: Super Admin Dashboard

**Unit Tests:**
- Statistics calculation logic
- User/company management logic
- Impersonation logic
- Audit trail logic

**Integration Tests:**
- Super admin dashboard endpoints
- User management endpoints
- Company management endpoints
- Impersonation endpoints
- Audit timeline endpoints

**E2E Test:**
- Super admin login → View dashboard → Manage user → View audit timeline

---

## Dispute Resolution Test Scenarios (Fork in the Road Logic)

**Priority:** P0 - Critical (Must Test)

These test scenarios verify the "Fork in the Road" dispute resolution logic that replaced the old "Clock-In Block" and "Pause" concepts.

### Unit Tests

**Dispute Filing Logic:**
- Fork selection (Option A vs Option B) validation
- Option A: Booking status remains `Active`, worker can clock in
- Option B: Booking status immediately transitions to `Cancelled`, worker released
- Dispute option required validation (cannot file without selecting A or B)
- Dispute cannot be filed on already-cancelled booking

**Worker Availability Logic:**
- Option B dispute immediately cancels booking (status = 'Cancelled')
- Worker becomes available in search immediately (real-time availability via PostgreSQL query - no sync delay)
- Search query uses NOT EXISTS clause against bookings table to exclude workers with confirmed/active bookings
- Multiple bookings: Only cancelled booking dates are excluded from availability check

**Payment Processing Logic:**
- Option A dispute: Weekly payment paused (`Payment_Paused_Dispute` status) but clock-in NOT blocked
- Option B dispute: No payment processing (booking already cancelled)
- Payment retry during active Option A dispute: Status remains `Payment_Paused_Dispute` until all disputes resolved

**Dispute Timeout Logic:**
- Option A timeout: Future shifts cancelled, booking remains `Active` (status `Payment_Paused_Dispute`)
- Option B timeout: Already `Cancelled`, no action needed
- Multiple Option A disputes: Booking remains `Active` until ALL disputes resolved

### Integration Tests

**Dispute Filing Endpoint:**
- `POST /api/disputes` - Verify fork selection (Option A/B) is required
- Verify `422 Unprocessable Entity` error when `disputeOption` not provided
- Verify Option B immediately cancels booking and releases worker
- Verify Option A keeps booking `Active` and allows clock-in

**Worker Search Endpoint:**
- Verify worker becomes available in search immediately after Option B dispute (real-time availability - no sync delay)
- Verify search query excludes workers with confirmed/active bookings using NOT EXISTS clause
- Verify multiple bookings: Only cancelled booking dates are excluded from availability check

**Payment Processing:**
- Verify weekly payment check excludes bookings with Option A disputes (`Payment_Paused_Dispute` status)
- Verify payment retry only triggers when ALL Option A disputes resolved
- Verify payment success during active dispute does not resolve dispute

### E2E Tests

**P0 Test Scenarios:**

1. **Option A Dispute - Worker Clock-In Access:**
   - File Option A dispute on timesheet
   - Verify booking status remains `Active`
   - Verify worker CAN clock in for future shifts
   - Verify only disputed shift funds frozen in escrow
   - Verify weekly payment paused (`Payment_Paused_Dispute` status)

2. **Option B Dispute - Worker Released:**
   - File Option B dispute on timesheet
   - Verify booking immediately transitions to `Cancelled`
   - Verify worker is released and available in search immediately (real-time availability via PostgreSQL query - no sync delay)
   - Verify both disputed shift funds AND cancellation penalty frozen in Stripe escrow (Stripe hold)
   - Verify search query excludes cancelled booking dates using NOT EXISTS clause against bookings table

3. **Multiple Option A Disputes:**
   - File Option A dispute on Shift 1
   - File Option A dispute on Shift 2
   - Verify booking remains `Active`
   - Verify worker CAN clock in for non-disputed shifts
   - Verify booking remains `Payment_Paused_Dispute` until ALL disputes resolved
   - Resolve Shift 1 dispute → Verify booking still `Payment_Paused_Dispute`
   - Resolve Shift 2 dispute → Verify booking transitions to `Active`, payment retry triggered

4. **Option A + Option B Precedence:**
   - File Option A dispute on Shift 1
   - File Option B dispute on Shift 2
   - Verify Option B takes precedence → Booking immediately `Cancelled`
   - Verify worker released and available in search

5. **Dispute Timeout - Option A:**
   - File Option A dispute
   - Wait 3 hours (or simulate timeout)
   - Verify future shifts cancelled
   - Verify booking remains `Active` (status `Payment_Paused_Dispute`)
   - Verify worker CAN still clock in for shifts that haven't been cancelled

6. **Subscription Expiration During Option A Dispute:**
   - File Option A dispute
   - Expire subscription
   - Verify status remains `Payment_Paused_Dispute` (no status change, subscription expiration doesn't change status)
   - Verify dispute remains active
   - Renew subscription → Verify status returns to `Payment_Paused_Dispute` (not `Active`)

7. **Dispute Filed During Active Shift:**
   - Worker clocks in
   - Supervisor files Option A dispute during active shift
   - Verify worker can continue working (no automatic clock-out)
   - Worker clocks out → Verify time_log status set to `Disputed`
   - Repeat with Option B → Verify worker automatically clocked out, booking cancelled

8. **Option B Dispute on Cancelled Booking:**
   - Cancel booking manually
   - Attempt to file Option B dispute
   - Verify error: "Booking is already cancelled. Cannot file dispute on cancelled booking."

9. **Chat-Based Dispute Resolution:**
   - File dispute → Verify chat interface opens with system-injected evidence messages
   - Verify system messages include: Supervisor edit notes, Worker rejection comments, GPS data, Photos, Timesheet data, Clock-in acknowledgment
   - Verify Lending Admin and Borrowing Admin can send messages
   - Verify admins reach agreement in chat
   - Verify Super Admin is notified when admins agree
   - Verify Super Admin can process resolution (release funds to lender, refund to borrower, or split)
   - Verify funds released per agreement via Stripe API
   - **P0 Test:** Verify no Evidence Locker UI exists - all evidence appears in chat stream
   - **P0 Test:** Verify no Settlement Offer buttons exist - resolution achieved through chat communication

---

## Test Data Management

### Test Data Strategy

**Unit Tests:**
- Use factories/fixtures for test data
- Create minimal data needed for each test
- Clean up after each test

**Integration Tests:**
- Use database seeds for common test data
- Reset database state between tests
- Use transactions for test isolation

**E2E Tests:**
- Use dedicated test accounts
- Use test payment methods (Stripe test mode)
- Clean up test data after test runs

### Test Data Files

```
tests/
  fixtures/
    users.json
    companies.json
    bookings.json
  factories/
    userFactory.ts
    companyFactory.ts
    bookingFactory.ts
  seeds/
    testSeed.sql
```

### Sensitive Data

- Never commit real user data to test files
- Use anonymized or generated test data
- Use environment variables for test credentials
- Use Stripe test mode for payment testing

---

## Test Environment Strategy

### Test Environments

**Local Development:**
- Unit tests run against mocks
- Integration tests run against local test database
- E2E tests run against local development server

**CI/CD Pipeline:**
- Unit tests run in parallel
- Integration tests run against test database
- E2E tests run against staging environment

**Staging:**
- Full integration test suite
- E2E test suite
- Performance tests
- Security tests

### Test Database

- Separate test database from development
- Reset database state between test runs
- Use migrations to set up test schema
- Use seeds for common test data

---

## CI/CD Integration

### Test Execution in CI/CD

**On Every Commit:**
- Run unit tests (fast feedback)
- Run linter
- Run type checker

**On Pull Request:**
- Run full unit test suite
- Run integration test suite
- Run E2E tests for affected features
- Generate coverage report

**On Merge to Main:**
- Run full test suite (unit + integration + E2E)
- Run performance tests
- Run security tests
- Deploy to staging

### Test Reporting

- Coverage reports (Codecov, Coveralls)
- Test results dashboard
- Failure notifications (Slack, email)
- Test execution time tracking

---

## Performance Testing

### Performance Test Types

**Load Testing:**
- Test system under expected load
- Identify performance bottlenecks
- Verify response time SLAs

**Stress Testing:**
- Test system beyond expected load
- Identify breaking points
- Verify graceful degradation

**Endurance Testing:**
- Test system under sustained load
- Identify memory leaks
- Verify system stability

### Performance Test Scenarios

**Critical Paths:**
- Worker search (high volume)
- Booking creation (concurrent bookings)
- Payment processing (Wednesday 10 AM window)
- Time log creation (concurrent clock-ins)

**Load Testing During Concurrent Operations:**
- Load testing should include scenarios where search queries execute concurrently with:
  - Weekly payment processing (Wednesday 10 AM) - verify search performance is not degraded during payment processing window
  - Bulk booking cancellations - verify search queries remain responsive during high-frequency booking status changes
  - Insurance expiration monitoring (affecting multiple workers) - verify search performance during background job execution that affects worker availability
- **Performance Targets:** Search query performance should remain within targets (p95 < 200ms) even during concurrent high-load operations. Monitor search query latency and error rates during concurrent operations to ensure system stability.

### Performance Targets

- API response time: < 200ms (p95)
- Search response time: < 500ms (p95)
- Payment processing: < 2s (p95)
- Database query time: < 100ms (p95)

**Performance Baseline Assumptions:**
- **Search Performance:** Performance targets for worker search reflect direct PostgreSQL queries only - no search index sync overhead, no sync delays, no separate search infrastructure latency. All performance baselines assume real-time database queries with PostgreSQL native search (pg_trgm for text search, earthdistance/postgis for geo search).
- **Real-Time Availability:** Availability checks are real-time database queries - no sync delay assumptions in performance baselines. Search queries execute directly against the `bookings` table for availability checks.
- **No Sync Overhead:** Performance tests explicitly exclude any search index sync jobs, sync workflows, or sync delay overhead from performance measurements. All search performance metrics reflect direct database query performance only.

---

## Security Testing

### Security Test Types

**Authentication Testing:**
- Test JWT token validation
- Test refresh token rotation
- Test session expiration
- Test password policies
- **Phone-First Authentication Tests:**
  - Test login with mobile number only (no email address)
  - Test login with email address (non-worker users)
  - Test login with identifier (email OR mobile number) - verify both paths work
  - Test profile creation without email address (workers)
  - Test sequential employment transitions (worker moves from Company A to Company B)
  - Test company context resolution at login (single active membership auto-login)
  - Test company context resolution at login (multiple active memberships - selection screen)
  - Test JWT token payload contains mobileNumber for phone-first users
  - Test JWT token payload email field is optional (null for workers without email)

**Authorization Testing:**
- Test RBAC permissions
- Test resource access controls
- Test API endpoint authorization
- Test data isolation

**Input Validation Testing:**
- Test SQL injection prevention
  - **Search Query SQL Injection Tests:**
    - Test all search parameters for SQL injection vulnerabilities
    - Test `query` parameter with SQL injection payloads: `' OR '1'='1`, `'; DROP TABLE users; --`, etc.
    - Test `trade` parameter with SQL injection payloads
    - Test `zipCode` parameter with SQL injection payloads
    - Test numeric parameters (`minRating`, `rateMin`, `rateMax`) with SQL injection payloads
    - Test array parameters (`skills`, `certifications`) with SQL injection payloads
    - Test date parameters (`availabilityStartDate`, `availabilityEndDate`) with SQL injection payloads
    - Verify parameterized queries prevent SQL injection (queries should fail safely, not execute malicious SQL)
    - Test with special characters: quotes, semicolons, comment markers (`--`, `/* */`)
    - Test with extremely long strings (> 200 characters) to verify length limits
    - Test with null bytes and other control characters
    - Verify error messages do not expose database schema or query structure
  - Test XSS prevention
  - Test CSRF protection
  - Test rate limiting
    - **Rate Limiting Bypass Tests:**
      - Test multiple user accounts from same IP (verify IP-level rate limiting)
      - Test token rotation to reset rate limits (verify token rotation detection)
      - Test distributed requests across multiple devices/IPs (verify distributed request detection)
      - Test rate limit header accuracy (verify headers cannot be manipulated)
      - Test rate limit enforcement at both user-level and IP-level
      - Test rate limit recovery after cooldown period
      - Test rate limit behavior during high load scenarios

**Data Protection Testing:**
- Test encryption at rest
- Test encryption in transit
- Test PII handling
- Test audit logging

### Security Test Tools

- OWASP ZAP for vulnerability scanning
- Burp Suite for API security testing
- Custom security test suites
- Penetration testing (quarterly)

---

## Test Maintenance

### Test Maintenance Strategy

**Regular Reviews:**
- Review test coverage quarterly
- Review test execution time
- Review flaky tests
- Review test maintenance burden

**Test Refactoring:**
- Refactor tests when code changes
- Remove obsolete tests
- Consolidate duplicate tests
- Improve test readability

**Test Documentation:**
- Document test strategy changes
- Document test data requirements
- Document test environment setup
- Document known test limitations

### Handling Flaky Tests

**Identification:**
- Track test failure rates
- Identify intermittent failures
- Monitor test execution time

**Resolution:**
- Fix race conditions
- Improve test isolation
- Add retry logic (sparingly)
- Remove or rewrite flaky tests

---

## Related Documentation

- [Repository Structure & Development Standards](./repository-structure-development-standards.md) - Testing requirements and standards
- [Error Handling & Resilience](./error-handling-resilience.md) - Error handling patterns for testing
- [API Contracts](./api-contracts.md) - API endpoint specifications for integration testing
- [Database Schema](./schema.md) - Database schema for test data setup

---

**Note:** This test strategy should be reviewed and updated quarterly to reflect changes in the system, new requirements, and lessons learned from test execution.
