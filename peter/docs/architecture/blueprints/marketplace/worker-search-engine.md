# Feature Blueprint: Worker Search Engine
**Domain:** Marketplace
**Related Epics:** [Epic 3: Marketplace & Search](../../../prd/epic-3.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 3.1: Worker Search Engine](../../../prd/epic-3.md#story-31-worker-search-engine)

## Technical Strategy (The "How")

### PostgreSQL Search Strategy

**Search queries query the database directly using read-optimized SQL. This ensures real-time data consistency, eliminates dual-write race conditions, and simplifies infrastructure by removing the need for a separate search index.**

#### Core Architecture and Filter Interface
- Single efficient SQL query joins `users`, `worker_profiles`, `worker_rates`, and `zip_codes` tables
- Text search uses `pg_trgm` extension for fuzzy matching on trade and skills
- Geo search uses `earthdistance` or `postgis` extension for radius-based filtering
- Availability check uses `WHERE NOT EXISTS` clause against `bookings` table for real-time availability
- No synchronization workflows needed - data is always current

**Filter Interface:**
```typescript
interface SearchFilters {
  trade?: string;
  zipCode?: string;
  availabilityStartDate?: Date;
  availabilityEndDate?: Date;
  minRating?: number;
  minExperienceYears?: number;
  certifications?: string[];
  rateMin?: number;
  rateMax?: number;
  distanceRadius?: number; // miles
  searchZipCode?: string; // For distance filtering
  skills?: string[]; // Hierarchical skills
  minOnTimeReliability?: number; // Minimum on-time reliability percentage
  availabilityDateRange?: {
    start: Date;
    end: Date;
  };
  query?: string; // Full-text search query
}
```

**Core Search Query Structure:**
```sql
SELECT
  u.id,
  u.user_state,
  wp.trade,
  wp.skills,
  wp.years_of_experience,
  wp.certifications,
  wp.languages,
  wp.tools_equipment,
  wp.photo_url,
  wp.location_zip_code,
  wp.max_travel_distance_miles,
  c.id as company_id,
  wr.lending_rate,
  (wr.lending_rate * 1.30) as all_inclusive_price,
  COALESCE(AVG((r.punctuality + r.attitude + r.effort + r.teamwork) / 4.0), 0) as avg_rating,
  COUNT(DISTINCT r.id) as rating_count,
  -- Calculate on-time reliability (from time_log)
  -- Calculate distance
  (point(zip.longitude, zip.latitude) <@> point($search_long, $search_lat)) as distance_miles
FROM users u
INNER JOIN worker_profiles wp ON u.id = wp.user_id
INNER JOIN company_members cm ON u.id = cm.user_id AND cm.status = 'Active'
INNER JOIN companies c ON cm.company_id = c.id
INNER JOIN zip_codes zip ON wp.home_zip_code = zip.zip_code
LEFT JOIN worker_rates wr ON u.id = wr.worker_id AND wr.is_active = true
LEFT JOIN ratings r ON r.rated_user_id = u.id
WHERE
  u.user_state = 'Listed'
  AND cm.roles @> '["Worker"]'::jsonb
  -- Text Search (using pg_trgm for fuzzy matching)
  AND (
    $query IS NULL OR
    wp.trade ILIKE '%' || $query || '%' OR
    wp.skills::text ILIKE '%' || $query || '%' OR
    similarity(wp.trade, $query) > 0.3  -- pg_trgm similarity threshold
  )
  -- Trade filter
  AND ($trade IS NULL OR wp.trade = $trade)
  -- Skills filter (hierarchical/nested)
  AND ($skills IS NULL OR wp.skills @> $skills::jsonb)
  -- Rating filter
  AND ($min_rating IS NULL OR COALESCE(AVG((r.punctuality + r.attitude + r.effort + r.teamwork) / 4.0), 0) >= $min_rating)
  -- Experience filter
  AND ($min_experience IS NULL OR wp.years_of_experience >= $min_experience)
  -- Certifications filter
  AND ($certifications IS NULL OR wp.certifications @> $certifications::jsonb)
  -- Rate range filter
  AND ($rate_min IS NULL OR wr.lending_rate >= $rate_min)
  AND ($rate_max IS NULL OR wr.lending_rate <= $rate_max)
  -- On-Time Reliability filter (calculated from time_log)
  -- Distance radius filter (using earthdistance)
  AND (
    $distance_radius IS NULL OR
    $search_zip IS NULL OR
    (point(zip.longitude, zip.latitude) <@> point($search_long, $search_lat)) <= $distance_radius
  )
  -- Availability Check (The Critical Change)
  -- Exclude workers with bookings in blocking statuses: Confirmed, Active, Pending_Payment,
  -- Payment_Paused_Dispute, Suspended_Insurance
  -- These statuses represent active bookings that should block availability
  AND NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.worker_id = u.id
    AND b.status IN ('Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance')
    AND b.end_date >= $req_start
    AND b.start_date <= $req_end
  )
GROUP BY u.id, wp.id, cm.id, c.id, wr.id, zip.longitude, zip.latitude
HAVING
  -- On-Time Reliability filter (if specified)
  ($min_on_time_reliability IS NULL OR calculated_on_time_reliability >= $min_on_time_reliability)
ORDER BY avg_rating DESC
LIMIT $page_size
OFFSET ($page - 1) * $page_size;
```

#### Key Implementation Details

1. **Text Search:** Uses `ILIKE` with `pg_trgm` extension for fuzzy text matching on trade and skills fields. The `similarity()` function provides configurable similarity thresholds.

2. **Availability Check:** Instead of checking a synced `blocked_dates` array, the query uses a `WHERE NOT EXISTS` clause against the `bookings` table to exclude workers with bookings in blocking statuses during the requested date range. This ensures real-time availability without sync delays.

   **Blocking Statuses (Worker Unavailable):**
   - `Confirmed` - Booking confirmed and paid
   - `Active` - Booking active, worker currently assigned
   - `Pending_Payment` - Payment pending, booking created but not yet confirmed
   - `Payment_Paused_Dispute` - Payment paused due to active dispute (Option A)
   - `Suspended_Insurance` - Insurance expired/revoked, booking suspended

   **Non-Blocking Statuses (Worker Available):**
   - `Cancelled` - Booking cancelled, worker released
   - `Completed` - Booking completed, worker released

   **Transaction Isolation:** The availability check uses PostgreSQL's default transaction isolation level (READ COMMITTED). If a booking status transitions during query execution, the query sees a consistent snapshot - either the old status or the new status, but not a partial transition. This ensures availability checks are atomic and consistent.

   **Edge Case - Status Transition During Query:** If a booking status transitions from blocking to non-blocking (e.g., `Cancelled`) during search query execution, the query may or may not see the new status depending on transaction timing. However, the final availability check at checkout uses `SELECT FOR UPDATE` with row-level locking, ensuring the most up-to-date status is checked before booking creation.

   **Concurrent Query Scenarios:**
   - **Multiple Simultaneous Searches During Booking Status Transition:** Multiple search queries executing simultaneously during a booking status transition will each see a consistent snapshot (either old or new status). The READ COMMITTED isolation level ensures no partial state is visible. The final checkout validation with `SELECT FOR UPDATE` ensures only one booking can be created for conflicting dates.
   - **Search Query Executing While Checkout Transaction in Progress:** If a search query executes while a checkout transaction is in progress (booking being created), the search query may or may not see the new booking depending on transaction commit timing. This is acceptable because: (1) The checkout transaction uses `SELECT FOR UPDATE` to prevent double-booking, (2) If checkout completes before search query, the worker is correctly excluded from results, (3) If search query completes before checkout commits, the worker may appear in results but will be correctly excluded at final checkout validation.
   - **Read Replica Lag Scenarios:** If using read replicas for search queries, replica lag may cause search results to show workers that were recently booked (if booking committed to primary but not yet replicated). This is mitigated by: (1) Short replica lag (< 100ms typical), (2) Final checkout validation always queries primary database with `SELECT FOR UPDATE`, (3) Cache invalidation on booking creation reduces stale results. For critical availability checks, consider routing to primary database instead of replica.
   
   **Replica Lag Thresholds and Fallback Procedures:**
   - **Acceptable Lag Threshold:** Replica lag < 100ms is considered acceptable for search queries. Typical replica lag is < 50ms under normal conditions.
   - **Warning Threshold:** Replica lag between 100ms and 500ms triggers monitoring alerts but does not automatically failover.
   - **Fallback Threshold:** Replica lag > 500ms triggers automatic fallback to primary database for search queries. This ensures search results reflect the most current data when replica lag becomes excessive.
   - **Fallback Implementation:** When replica lag exceeds 500ms, the search query builder should automatically route queries to the primary database instead of the replica. This fallback is transparent to users - no error is returned, queries simply execute against the primary database.
   - **Lag Detection:** Replica lag is monitored continuously via PostgreSQL replication metrics (`pg_stat_replication` view). The application should check replica lag before routing search queries to replicas.
   - **Fallback Recovery:** Once replica lag returns to < 100ms for 5 consecutive checks (1 minute at 12-second intervals), queries automatically resume routing to replicas.
   - **Monitoring:** Replica lag metrics should be tracked separately for each replica instance. Alert when any replica exceeds 500ms lag for > 1 minute.

3. **Geo Search:** Uses SQL earth distance calculations (`earthdistance` extension with `<@>` operator or `postgis` with `ST_Distance`) to filter workers by radius from a search location.

4. **Real-Time Data:** All data comes directly from PostgreSQL tables, ensuring no sync delay between database updates and search results.

5. **Timezone Handling for Availability Checks:** Date comparisons in the availability check (`NOT EXISTS` subquery) use consistent timezone handling:
   - **Storage:** All booking dates (`start_date`, `end_date`) are stored as DATE type (no time component) in UTC
   - **Comparison:** Date comparisons in the availability check use DATE arithmetic, which is timezone-independent for day-level comparisons
   - **Day-Based Availability:** The system uses day-based availability logic - if a worker is booked for ANY portion of a day, the entire day is considered unavailable. This eliminates timezone edge cases at day boundaries
   - **DST Transitions:** Since availability is day-based (not time-based), Daylight Saving Time transitions do not affect availability calculations
   - **Project Timezone:** While booking times use project timezone for shift scheduling, availability date comparisons use DATE type which is timezone-agnostic for day-level filtering
   - **Partial Day Bookings:** If a booking starts mid-day (e.g., 2 PM on Jan 15) and ends mid-day (e.g., 10 AM on Jan 16), the entire days Jan 15 and Jan 16 are considered unavailable. The system does not support partial-day availability - any booking that overlaps a day makes that entire day unavailable. This simplifies availability logic and eliminates edge cases around time-of-day boundaries.

#### Availability Check Edge Cases and Examples

**Edge Case 1: Mid-Day Booking Creation**

**Scenario:** A booking is created at 2:00 PM on January 15th for dates January 15-20.

**Behavior:**
- **Immediate Impact:** Once the booking is created (status = `Pending_Payment` or `Confirmed`), the worker becomes unavailable for the entire day of January 15th, even though the booking was created mid-day.
- **Search Query Behavior:** Any search query executed after the booking is created will exclude this worker for January 15th (and subsequent days through January 20th).
- **Retroactive Blocking:** The day is blocked retroactively - if a user had the worker in their cart before 2:00 PM, they will still see the worker in search results until they attempt checkout, at which point the final availability check will detect the conflict.
- **Transaction Timing:** The availability check uses `SELECT FOR UPDATE` at checkout, ensuring the most current booking state is checked before booking creation.

**Example:**
```sql
-- Booking created at 2:00 PM on Jan 15
INSERT INTO bookings (worker_id, start_date, end_date, status)
VALUES ('worker-123', '2026-01-15', '2026-01-20', 'Pending_Payment');

-- Search query executed at 2:30 PM on Jan 15 for dates Jan 15-20
-- Worker is excluded from results because:
-- NOT EXISTS check finds the booking with:
--   start_date <= '2026-01-20' AND end_date >= '2026-01-15'
--   AND status IN ('Pending_Payment', ...)
```

**Edge Case 2: Day Boundary Bookings (Near Midnight)**

**Scenario:** A booking is created at 11:59 PM on January 15th for dates January 15-20.

**Behavior:**
- **Day Boundary Handling:** Since booking dates are stored as DATE type (no time component), a booking created at 11:59 PM on January 15th is stored with `start_date = '2026-01-15'`.
- **Availability Impact:** The worker is unavailable for the entire day of January 15th, regardless of when during the day the booking was created.
- **No Race Condition:** There is no race condition at day boundaries because:
  - Date comparisons use DATE arithmetic (timezone-independent)
  - The `NOT EXISTS` subquery checks date ranges, not timestamps
  - Transaction isolation ensures consistent snapshot of booking state
- **Example:** If a booking is created at 11:59 PM on Day 1, it affects Day 1 availability (entire day blocked), not Day 2. Day 2 availability is only affected if the booking's `end_date` includes Day 2.

**Example:**
```sql
-- Booking created at 11:59 PM on Jan 15 (stored as start_date = '2026-01-15')
INSERT INTO bookings (worker_id, start_date, end_date, status)
VALUES ('worker-123', '2026-01-15', '2026-01-20', 'Confirmed');

-- Search query for Jan 15-20 executed at 12:01 AM on Jan 16
-- Worker is excluded because:
-- NOT EXISTS check finds booking with:
--   start_date <= '2026-01-20' AND end_date >= '2026-01-15'
--   (Date comparison is timezone-independent, no midnight edge case)
```

**Edge Case 3: Transaction Timing and Availability Visibility**

**Scenario:** Multiple users search for the same worker simultaneously, then attempt checkout.

**Behavior:**
- **Search Query Timing:** Multiple search queries executing simultaneously will each see a consistent snapshot of booking state (READ COMMITTED isolation level). If a booking is created between two search queries, the second query may or may not see the new booking depending on transaction commit timing.
- **Checkout Availability Check:** The final availability check at checkout uses `SELECT FOR UPDATE` with row-level locking, ensuring:
  - The checkout transaction sees the most current booking state
  - Concurrent checkout attempts are serialized (only one can succeed)
  - No double-booking can occur even if multiple users attempt to book simultaneously
- **Race Condition Prevention:** The `SELECT FOR UPDATE` lock ensures atomicity - if User A's checkout transaction is in progress when User B attempts checkout, User B's transaction will wait for User A's transaction to complete, then check availability with the updated state.

**Example Timeline:**
```
Time 10:00:00 AM: User A searches for worker-123, sees worker available for Jan 15-20
Time 10:00:05 AM: User B searches for worker-123, sees worker available for Jan 15-20
Time 10:00:10 AM: User A starts checkout (SELECT FOR UPDATE lock acquired)
Time 10:00:11 AM: User B starts checkout (waits for User A's lock)
Time 10:00:12 AM: User A's booking created (status = 'Pending_Payment')
Time 10:00:13 AM: User A's transaction commits, lock released
Time 10:00:14 AM: User B's transaction acquires lock, checks availability
Time 10:00:15 AM: User B's availability check finds User A's booking, checkout fails
```

**Edge Case 4: Booking Cancellation and Immediate Availability**

**Scenario:** A booking is cancelled at 3:00 PM on January 15th, and a user searches for the worker at 3:01 PM.

**Behavior:**
- **Immediate Availability:** Once the booking status transitions to `Cancelled`, the worker becomes available immediately in search results (no sync delay).
- **Search Query Behavior:** Any search query executed after the cancellation will include the worker in results for the previously booked dates.
- **Transaction Consistency:** The search query uses READ COMMITTED isolation, so it will see the cancelled booking state immediately after the cancellation transaction commits.
- **Checkout Validation:** The final availability check at checkout will also see the cancelled booking state, ensuring consistency between search and checkout.

**Example:**
```sql
-- Booking cancelled at 3:00 PM on Jan 15
UPDATE bookings 
SET status = 'Cancelled' 
WHERE id = 'booking-456' AND status = 'Active';

-- Search query executed at 3:01 PM for dates Jan 15-20
-- Worker is included in results because:
-- NOT EXISTS check does NOT find any blocking bookings:
--   (Cancelled status is not in blocking statuses list)
```

**Edge Case 5: Partial Day Booking Overlap**

**Scenario:** A booking exists from January 15 2:00 PM to January 16 10:00 AM. A user searches for availability on January 16.

**Behavior:**
- **Day-Based Logic:** Since the booking overlaps January 16 (ends at 10:00 AM), the entire day of January 16 is considered unavailable.
- **Search Query:** A search query for January 16 will exclude this worker, even though the booking only covers the morning portion of the day.
- **Rationale:** This day-based approach simplifies availability logic and eliminates edge cases around time-of-day boundaries. The system does not support partial-day availability.

**Example:**
```sql
-- Existing booking: Jan 15 2:00 PM to Jan 16 10:00 AM
-- Stored as: start_date = '2026-01-15', end_date = '2026-01-16'

-- Search query for Jan 16 availability
-- Worker is excluded because:
-- NOT EXISTS check finds booking with:
--   start_date <= '2026-01-16' AND end_date >= '2026-01-16'
--   (Date overlap detected, entire day blocked)
```

**Edge Case 6: Booking Status Transition During Search Query Execution**

**Scenario:** A booking status transitions from `Active` to `Cancelled` while a search query is executing.

**Behavior:**
- **Transaction Isolation:** The search query uses READ COMMITTED isolation level, which ensures it sees a consistent snapshot of booking state. The query will see either the old status (`Active`) or the new status (`Cancelled`), but not a partial transition.
- **Consistency Guarantee:** If the query sees the old status, the worker is excluded from results. If the query sees the new status, the worker is included in results. The final availability check at checkout uses `SELECT FOR UPDATE` to ensure the most current state is checked.
- **No Partial State:** PostgreSQL's transaction isolation ensures no partial state is visible - the query sees either the complete old state or the complete new state.

**Example:**
```sql
-- Time T1: Search query starts, sees booking with status = 'Active'
-- Time T2: Booking status changes to 'Cancelled' (transaction commits)
-- Time T3: Search query completes

-- Result: Query sees either:
--   Option A: Old state (status = 'Active') - worker excluded
--   Option B: New state (status = 'Cancelled') - worker included
--   (Never sees partial state due to transaction isolation)
```

### Search Endpoint

**API Implementation:**
```typescript
async function searchWorkers(req: Request, res: Response) {
  const filters: SearchFilters = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  // Build PostgreSQL query with filters
  const query = buildPostgresSearchQuery(filters, page, pageSize);
  
  // Execute search against PostgreSQL
  const searchResults = await db.raw(query);

  // Format results (hide company name)
  const formattedResults = searchResults.rows.map((worker: any) => ({
    id: worker.id,
    trade: worker.trade,
    skills: worker.skills,
    yearsOfExperience: worker.years_of_experience,
    certifications: worker.certifications,
    languages: worker.languages,
    toolsEquipment: worker.tools_equipment,
    photoUrl: worker.photo_url,
    // Company name hidden
    companyId: undefined, // Not returned
    companyName: undefined, // Not returned until added to cart
    lendingRate: worker.lending_rate,
    allInclusivePrice: worker.all_inclusive_price,
    avgRating: worker.avg_rating,
    ratingCount: worker.rating_count,
    onTimeReliabilityPercent: worker.on_time_reliability_percent,
    distanceMiles: worker.distance_miles,
    // Badges
    badges: calculateBadges(worker), // Gold Tier, Verified, etc.
    // Overtime badge
    overtimeIncluded: worker.overtime_included,
  }));

  // Get total count for pagination
  const totalCount = await getTotalCount(filters);

  const response = {
    results: formattedResults,
    pagination: {
      page: page,
      pageSize: pageSize,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
    // Facets can be calculated via separate aggregation queries if needed
  };

  res.json(response);
}
```

**Note:** PostgreSQL query optimization and proper indexing are critical for performance. Redis caching may be used for frequently accessed search results with appropriate cache invalidation.

### Faceted Search Implementation

**Strategy:** Facets are calculated using separate aggregation queries that execute in parallel with the main search query. This approach provides better performance and flexibility compared to including facets in the main query.

**Available Facets:**
- **Trade:** Count of workers by trade (e.g., "Electrician: 45", "Plumber: 32")
- **Skills:** Count of workers by skill (hierarchical/nested skills supported)
- **Certifications:** Count of workers by certification type
- **Rate Range:** Distribution of workers across rate ranges (e.g., "$40-50/hr: 20", "$50-60/hr: 35")
- **Distance Range:** Distribution of workers by distance from search location (e.g., "0-10 miles: 15", "10-20 miles: 25")
- **On-Time Reliability:** Distribution by reliability percentage ranges
- **Rating:** Distribution by average rating ranges

**Facet Query Implementation:**
```typescript
async function getSearchFacets(filters: SearchFilters): Promise<FacetResults> {
  // Execute aggregation queries in parallel
  const [tradeFacets, skillFacets, certFacets, rateFacets, distanceFacets] = await Promise.all([
    // Trade facets
    db('worker_profiles as wp')
      .innerJoin('users as u', 'wp.user_id', 'u.id')
      .innerJoin('company_members as cm', 'u.id', 'cm.user_id')
      .where('u.user_state', 'Listed')
      .where('cm.roles', '@>', '["Worker"]')
      .applyAvailabilityFilters(filters) // Apply same availability filters as main query
      .groupBy('wp.trade')
      .select('wp.trade', db.raw('COUNT(*) as count'))
      .orderBy('count', 'desc'),
    
    // Skills facets (flattened from JSONB)
      // Similar aggregation for skills, certifications, etc.
  ]);

  return {
    trades: tradeFacets,
    skills: skillFacets,
    certifications: certFacets,
    rateRanges: rateFacets,
    distanceRanges: distanceFacets
  };
}
```

**Caching Strategy:**
- **Facet Cache Key:** `facets:{filters_hash}` (same filter hash as search results)
- **Cache TTL:** 10 minutes (longer than search results cache since facets change less frequently)
- **Cache Invalidation:** Invalidate on worker profile updates, booking status changes, or rating updates (same triggers as search results)
- **Performance:** Facets are cached separately from search results, allowing independent cache invalidation and better cache hit rates

**Performance Considerations:**
- **Parallel Execution:** Facet queries execute in parallel with the main search query to minimize total response time
- **Query Optimization:** Each facet query uses the same base filters and availability checks as the main search query, ensuring consistency
- **Index Usage:** Facet queries benefit from the same indexes as the main search query (trade, skills, certifications, etc.)
- **Result Limiting:** Facet queries can be limited to top N results per facet category to reduce query complexity (e.g., top 10 trades, top 20 skills)
- **Read Replicas:** Facet queries can be routed to read replicas (same as main search queries) with replica lag fallback procedures

**Facet Calculation Timing:**
- **On-Demand:** Facets are calculated on-demand when requested by the client (not included in every search response)
- **Optional Parameter:** Client can request facets via query parameter: `GET /api/marketplace/workers/search?includeFacets=true`
- **Lazy Loading:** Facets can be loaded separately via dedicated endpoint: `GET /api/marketplace/workers/search/facets?filters=...`

**Edge Cases:**
- **Empty Results:** If main search returns no results, facets still reflect the full dataset (not filtered by availability, only by search criteria)
- **High Cardinality:** For high-cardinality facets (e.g., skills with hundreds of values), limit to top N most common values
- **Performance Degradation:** If facet queries exceed 500ms, return cached facets or skip facet calculation with warning

### Company Name Revelation

**Reveal Company Name:**
```typescript
async function addToCart(req: Request, res: Response) {
  const { workerId } = req.body;
  const borrowerCompanyId = req.user.companyId;

  // Get worker with company name (revealed when added to cart)
  const worker = await db('users as u')
    .innerJoin('worker_profiles as wp', 'u.id', 'wp.user_id')
    .innerJoin('company_members as cm', 'u.id', 'cm.user_id')
    .innerJoin('companies as c', 'cm.company_id', 'c.id')
    .where('u.id', workerId)
    .where('u.user_state', 'Listed')
    .select(
      'u.id',
      'wp.*',
      'c.id as company_id',
      'c.name as company_name', // Revealed when added to cart
      'wr.lending_rate'
    )
    .first();

  // Add to cart (no locking - worker remains visible in search)
  await db('cart_items').insert({
    borrower_company_id: borrowerCompanyId,
    worker_id: workerId,
    start_date: req.body.startDate,
    end_date: req.body.endDate
  });

  res.json({
    success: true,
    worker: {
      ...worker,
      companyName: worker.company_name // Revealed
    }
  });
}
```

### Badge Calculation

**Badge Logic:**
```typescript
function calculateBadges(worker: any) {
  const badges = [];

  // Rating-based badges
  if (worker.avg_rating >= 4.5 && worker.rating_count >= 10) {
    badges.push({ type: 'gold_tier', label: 'Gold Tier Lender' });
  } else if (worker.avg_rating >= 4.0 && worker.rating_count >= 5) {
    badges.push({ type: 'silver_tier', label: 'Silver Tier Lender' });
  }

  // Verified badge (if lender has verified worker)
  if (worker.verified_by_lender) {
    badges.push({ type: 'verified', label: 'Verified' });
  }

  // Insurance badge
  if (worker.has_valid_insurance) {
    badges.push({ type: 'insured', label: 'Insured' });
  }

  return badges;
}
```

### Overtime Configuration Check

**OT Badge:**
```typescript
async function checkOvertimeConfiguration(workerId: string): Promise<boolean> {
  const otConfig = await db('worker_overtime_config')
    .where({ worker_id: workerId, is_active: true })
    .first();

  return !!otConfig;
}
```

### Caching Strategy

**Redis Caching:**
- Redis may be used for caching frequently accessed search results
- Cache key format: `search:{filters_hash}:page:{page}`
- Cache TTL: 5 minutes (configurable)
- Cache invalidation: Invalidate on worker profile updates, booking status changes, or rating updates
- Session management continues to use Redis

**Critical Clarification - Cache is Performance-Only:**
- **Cache Purpose:** Redis caching is a **performance optimization only** - it does NOT affect data consistency or availability accuracy
- **Real-Time Availability:** Availability is **always checked in real-time** directly from the PostgreSQL database, regardless of cache state
- **No Data Consistency Dependency:** Cache staleness does NOT affect availability accuracy - the final availability check at checkout always queries the database directly using database-level locking
- **Cache Invalidation:** While cache invalidation improves user experience by showing fresher results, it is not required for correctness - the database is always the source of truth

**Frontend Caching Guidance:**

**Recommended Approach:** No frontend caching - always fetch fresh results from API

**Rationale:**
- Ensures real-time availability accuracy
- Simpler state management
- Slight performance trade-off (acceptable for search)

**Alternative Approach (Optional):** Short-lived frontend cache (30 seconds) with manual invalidation

**If Frontend Caching Implemented:**
- **Cache Key Format:** `search:{filters_hash}:page:{page}`
- **TTL:** 30 seconds
- **Invalidation Triggers:**
  - Cart addition
  - Booking creation
  - Manual refresh button
  - Cache age > 30 seconds
- **Stale Indicator:** Show subtle indicator if cache age > 30 seconds: "Results from [X] seconds ago"

**Frontend Cache Interaction with Real-Time Availability:**
- Availability is always checked server-side (real-time)
- Frontend cache is for UX only, not availability guarantees
- Final availability check at checkout always uses fresh data
- If cached result shows worker available but server check fails, show: "Worker no longer available"

**Database Query Caching:**
- PostgreSQL query plan caching improves performance for repeated queries
- Proper indexing is critical for query performance
- Consider read replicas for high query volume scenarios
- **Read Replica Extension Requirements:** If using read replicas for search queries, the same PostgreSQL extensions (`pg_trgm`, `cube`, `earthdistance` or `postgis`) must be installed on all read replicas. Extension installation on replicas must be included in deployment procedures. See [Database Migrations](../../database-migrations.md) for extension installation details.

## Security Considerations

### SQL Injection Prevention

**Critical Requirement:** All search parameters must use parameterized queries - never string concatenation.

**Implementation Requirements:**

1. **Parameterized Queries:**
   - All search parameters must be passed as query parameters (`$1`, `$2`, etc.) or named parameters (`:param`)
   - Never use string concatenation or template literals to build SQL queries
   - Use query builder libraries (e.g., Knex.js) that automatically parameterize queries

2. **Input Validation:**
   - Validate and sanitize all search parameters before query construction
   - Type validation: Ensure numeric parameters are cast to appropriate types (integer, decimal)
   - Length limits: Enforce maximum length for text search parameters (e.g., 200 characters for `query` parameter)
   - Enum validation: Validate enum parameters (e.g., `trade` must be from allowed trades list)

3. **Special Character Handling:**
   - Text search queries may contain special characters (quotes, semicolons, etc.)
   - Parameterized queries automatically escape special characters
   - Document that special characters in search queries are handled safely via parameterization
   - No manual escaping required when using parameterized queries

4. **Query Builder Usage:**
   ```typescript
   // ✅ CORRECT: Parameterized query
   const query = db('users as u')
     .innerJoin('worker_profiles as wp', 'u.id', 'wp.user_id')
     .where('wp.trade', trade) // Parameterized automatically
     .where('u.user_state', 'Listed');
   
   // ❌ INCORRECT: String concatenation (SQL injection risk)
   const query = `SELECT * FROM users WHERE trade = '${trade}'`; // NEVER DO THIS
   ```

5. **Type Safety:**
   - Cast numeric parameters to appropriate types before query construction
   - Validate date parameters are valid dates before query construction
   - Validate array parameters (skills, certifications) are valid JSON arrays

**Security Testing:**
- All search query endpoints must be tested for SQL injection vulnerabilities
- Test with malicious input: SQL injection payloads, special characters, extremely long strings
- Verify parameterized queries prevent SQL injection attacks
- See [Test Strategy](../../test-strategy.md) for SQL injection test specifications

## Edge Cases & Failure Handling

### PostgreSQL Extension Requirements

**Scenario:** Required PostgreSQL extensions (`pg_trgm`, `earthdistance`/`postgis`) are not installed
- **Prevention:** Validate extensions are installed during application startup
- **Error Handling:** If extensions are missing, return user-friendly error message
- **Installation:** Extensions must be installed via database migration or manual SQL:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS cube;
  CREATE EXTENSION IF NOT EXISTS earthdistance;
  -- OR use postgis instead:
  -- CREATE EXTENSION IF NOT EXISTS postgis;
  ```
- **Validation:** Check extension availability before executing search queries
- **User Message:** "Search service is temporarily unavailable. Please try again in a few moments." (See [Error Message Catalog](../../error-message-catalog.md))

**Extension Validation Implementation:**
```typescript
// Extension validation cache (30-second TTL to balance safety and performance)
let extensionValidationCache: {
  timestamp: number;
  result: { geoExtension: string; extensions: string[] };
} | null = null;

const EXTENSION_VALIDATION_CACHE_TTL = 30000; // 30 seconds

async function validatePostgresExtensions(): Promise<{ geoExtension: string; extensions: string[] }> {
  // Check cache first (if within TTL)
  const now = Date.now();
  if (extensionValidationCache && (now - extensionValidationCache.timestamp) < EXTENSION_VALIDATION_CACHE_TTL) {
    return extensionValidationCache.result;
  }
  
  // Validate extensions (query pg_extension catalog)
  const extensions = await db.raw(`
    SELECT extname FROM pg_extension 
    WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis')
  `);
  
  const installed = extensions.rows.map(r => r.extname);
  
  // Required extensions
  const required = ['pg_trgm', 'cube'];
  
  // Geo extension: either earthdistance OR postgis (not both)
  const hasEarthdistance = installed.includes('earthdistance');
  const hasPostgis = installed.includes('postgis');
  
  if (!hasEarthdistance && !hasPostgis) {
    throw new Error('Missing required geo extension: either earthdistance or postgis must be installed');
  }
  
  if (hasEarthdistance && hasPostgis) {
    // Both installed - prefer postgis for more advanced features
    console.warn('Both earthdistance and postgis installed. Using postgis for geo queries.');
  }
  
  // Check required extensions
  const missing = required.filter(ext => !installed.includes(ext));
  if (missing.length > 0) {
    throw new Error(`Missing required PostgreSQL extensions: ${missing.join(', ')}`);
  }
  
  // Store which geo extension to use for queries
  const geoExtension = hasPostgis ? 'postgis' : 'earthdistance';
  const result = { geoExtension, extensions: installed };
  
  // Update cache
  extensionValidationCache = {
    timestamp: now,
    result
  };
  
  return result;
}
```

**Extension Validation Timing:**
- **Pre-Query Validation:** Extension availability can be checked before each search query, but this is optional if periodic health checks (every 5 minutes) are working correctly. Pre-query validation adds latency, so it should be cached.
- **Validation Caching:** Extension validation results should be cached with a 30-second TTL to balance safety and performance. This ensures:
  - Extension unavailability is detected within 30 seconds (not just at 5-minute health check intervals)
  - Validation overhead is minimized (cached results avoid database queries on every search request)
  - Cache invalidation on extension unavailability events ensures fresh validation results
- **Performance Impact:** Pre-query validation with caching adds minimal overhead (< 1ms per query when cached). Monitor extension validation latency and alert if validation exceeds 1 second (may indicate database performance issues).
- **Performance During Extension Health Checks:** Periodic health checks (every 5 minutes) are independent of query volume and have minimal overhead. Pre-query validation with caching adds < 1ms per query when cached, and validation queries are lightweight catalog queries (`SELECT extname FROM pg_extension WHERE extname IN (...)`). Health check overhead does not increase with query volume - health checks run on a fixed schedule regardless of search query frequency.
- **Periodic Health Checks:** Periodic extension health checks (every 5 minutes) remain the primary mechanism for detecting extension unavailability. Pre-query validation with caching provides additional safety but is not required if periodic checks are reliable.

**Geo Extension Detection and Query Syntax:**
- **Extension Detection:** Application must detect which geo extension is available (`earthdistance` or `postgis`) and use the appropriate SQL syntax
- **Earthdistance Syntax:** Uses `<@>` operator for distance calculations: `(point(lon1, lat1) <@> point(lon2, lat2))`
- **PostGIS Syntax:** Uses `ST_Distance` function: `ST_Distance(ST_MakePoint(lon1, lat1), ST_MakePoint(lon2, lat2))`
- **Query Builder:** The search query builder should use the detected geo extension to construct appropriate SQL queries
- **Fallback:** If neither extension is available, geo search functionality should be disabled with appropriate error handling

**Decision Criteria: Choosing earthdistance vs postgis:**
- **Use `earthdistance` when:**
  - Simple radius-based distance calculations are sufficient
  - Minimal geospatial features needed (distance only)
  - Smaller extension footprint preferred
  - Standard PostgreSQL installation without additional GIS dependencies
- **Use `postgis` when:**
  - Advanced geospatial features are needed (polygons, complex geometries, spatial joins)
  - Future requirements may include complex geographic queries
  - Integration with other PostGIS-based tools or data sources
  - More comprehensive geospatial functionality is required
- **Migration Path:** If switching between extensions, update query builder to use appropriate syntax. Both extensions can coexist, but application should prefer `postgis` if both are installed (see extension validation logic above)
- **Production Recommendation:** For new installations, default to `postgis` for better long-term support and more comprehensive geospatial features. `earthdistance` is acceptable for MVP if already installed, but consider migrating to `postgis` for production scale.

### Large Result Sets

**Scenario:** Search returns thousands of results
- **Solution:** Implement pagination with reasonable page size (default 20)
- **Performance:** Use database indexes on frequently filtered columns
- **Caching:** Cache first page results for common searches

### Filter Conflicts

**Scenario:** User applies conflicting filters (e.g., rate range with no matches)
- **Solution:** Return empty results with message: "No workers match your criteria"
- **UX:** Suggest removing or adjusting filters
- **Validation:** Client-side validation to prevent impossible filter combinations

### Runtime Extension Availability

**Scenario:** PostgreSQL extensions become unavailable during runtime (not just at startup)
- **Detection:** Implement periodic extension health checks (e.g., every 5 minutes) in addition to startup validation. Health checks query `pg_extension` system catalog to verify extensions remain available.
- **Automatic Fallback Behavior:**
  - **Text Search Extension (`pg_trgm`) Unavailable:** Disable fuzzy text search, fall back to exact `ILIKE` matching only. Return error code `SEARCH_EXTENSION_PARTIAL` with user message: "Search service is temporarily unavailable. Please try again in a few moments."
  - **Geo Extension (`earthdistance`/`postgis`) Unavailable:** Disable geo search functionality (distance filtering and distance calculations). Text search continues to work. Return error code `SEARCH_GEO_UNAVAILABLE` with user message: "Location-based search is temporarily unavailable. Please try again in a few moments."
  - **Both Extensions Unavailable:** Disable search functionality entirely. Return error code `SEARCH_EXTENSION_RUNTIME_UNAVAILABLE` with user message: "Search service temporarily unavailable. Please try again in a few moments."
- **Alerting:** When runtime extension unavailability is detected, trigger critical alert to operations team. Alert should include: extension name, detection timestamp, current fallback behavior, and recommended recovery actions.
- **Recovery Procedure:**
  1. Investigate root cause (database configuration change, extension removal, database maintenance)
  2. Verify extension availability: `SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');`
  3. If extensions are missing, reinstall via migration: `CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS earthdistance;`
  4. Verify extension functionality with test search query
  5. Monitor health checks to confirm extensions remain available
  6. Restore full search functionality once extensions are confirmed available

### Partial Extension Failure on Replicas

**Scenario:** One or more extensions are available on primary database but unavailable on a read replica (e.g., `pg_trgm` works on primary but fails on replica).

**Detection:**
- **Per-Replica Extension Health Checks:** Monitor extension availability separately for each replica instance. Periodic health checks (every 5 minutes) should verify all required extensions on each replica, not just the presence of any extension.
- **Extension Availability Per Replica:** Track extension availability metrics per replica instance:
  - `replica_{id}_pg_trgm_available` (boolean)
  - `replica_{id}_earthdistance_available` (boolean) or `replica_{id}_postgis_available` (boolean)
  - Alert when any required extension is unavailable on any replica

**Handling:**
- **Immediate Fallback:** When partial extension failure is detected on a replica, immediately route search queries to primary database or other available replicas. Do not wait for periodic health checks - failover should occur as soon as extension unavailability is detected.
- **Query Routing:** If a replica has partial extension failure (e.g., `pg_trgm` available but `earthdistance` unavailable), route all search queries away from that replica until all extensions are restored. Partial extension availability on replicas is not sufficient - all required extensions must be available for a replica to be used for search queries.
- **Monitoring:** Track partial extension failures per replica instance:
  - Extension unavailability events per replica (count and duration)
  - Query routing changes due to replica extension failures
  - Replica extension recovery time (time from failure detection to all extensions restored)

**Recovery:**
- **Extension Restoration:** When extension becomes available again on replica, verify all required extensions are installed before resuming query routing to that replica
- **Verification:** Execute test search query against replica to verify all extensions work correctly before routing queries back to replica
- **Monitoring:** Continue monitoring extension availability on recovered replica for 24 hours after recovery to ensure stability

**Extension Version Mismatches:**
- **Scenario:** Extension versions differ between primary and replicas (e.g., primary has `postgis` 3.0, replica has `postgis` 2.5)
- **Handling:** Treat extension version mismatches as partial extension failures. Route queries to database instances with matching extension versions. Version mismatches may cause query syntax differences or feature availability differences.
- **Monitoring:** Monitor extension versions across all database instances and alert on version mismatches. Track extension version metrics per database instance:
  - `primary_pg_trgm_version` (string)
  - `primary_earthdistance_version` (string) or `primary_postgis_version` (string)
  - `replica_{id}_pg_trgm_version` (string)
  - `replica_{id}_earthdistance_version` (string) or `replica_{id}_postgis_version` (string)
- **Alerting:** Alert when extension versions differ between primary and any replica, or between replicas. Version mismatches may indicate incomplete deployment or configuration drift.
- **Resolution:** Align extension versions across all database instances. Update replicas to match primary extension versions, or update primary to match replica versions (depending on which version is correct).

### Mid-Query Extension Failures

**Scenario:** PostgreSQL extension becomes unavailable during active query execution (not just at startup or between queries)
- **Detection:** Query execution errors may indicate extension unavailability. Common error patterns:
  - `function similarity(unknown, unknown) does not exist` - `pg_trgm` extension unavailable
  - `operator <@> does not exist` - `earthdistance` extension unavailable
  - `function st_distance(unknown, unknown) does not exist` - `postgis` extension unavailable
- **Error Handling:**
  - **Catch Extension Errors:** Wrap query execution in try-catch blocks that specifically detect extension-related errors (function/operator not found errors)
  - **Transaction Rollback Behavior:** When extension fails mid-query, PostgreSQL automatically rolls back the entire transaction. The query transaction is aborted, and no partial results are returned. The application must handle the rollback gracefully:
    - **No Partial Results:** Do not attempt to return partial query results - the transaction is fully rolled back
    - **Clean Error Handling:** Catch the extension error, log the failure, and return appropriate error code to user
    - **No Data Corruption:** Transaction rollback ensures database consistency - no data is left in an inconsistent state
  - **Immediate Fallback:** When extension error is detected during query execution:
    - **Text Search Extension Failure:** Retry query with exact `ILIKE` matching only (no `similarity()` function calls). Return error code `SEARCH_EXTENSION_PARTIAL` if fallback also fails.
    - **Geo Extension Failure:** Retry query without geo filtering (remove distance calculations and radius filters). Return error code `SEARCH_GEO_UNAVAILABLE` if fallback also fails.
    - **Both Extensions Fail:** Return error code `SEARCH_EXTENSION_RUNTIME_UNAVAILABLE` - query cannot complete without extensions.
  - **Query Retry Logic:** Do not automatically retry failed queries - extension failures are not transient. Instead, activate fallback behavior immediately and alert operations team.
  - **User Experience:** Return appropriate error code with user-friendly message. Do not expose technical extension error details to users. Error message should indicate: "Search service is temporarily unavailable. Please try again in a few moments."
- **Partial Extension Failures:**
  - **Scenario:** One extension fails while another remains available (e.g., `pg_trgm` fails but `earthdistance` works)
  - **Handling:** Activate partial fallback for the failed extension only. Continue using the working extension normally.
  - **Example:** If `pg_trgm` fails mid-query, disable fuzzy text search but continue with geo search if `earthdistance` is available.
- **Recovery Procedures:**
  1. **Immediate:** Log extension failure with full query context (filters, error message, timestamp)
  2. **Alert:** Trigger critical alert to operations team with extension name and failure context
  3. **Investigation:** Check database logs and extension availability: `SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');`
  4. **Restoration:** Reinstall missing extensions if needed: `CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS earthdistance;`
  5. **Verification:** Execute test search query to verify extension functionality restored
  6. **Monitoring:** Monitor extension health checks to confirm extensions remain available
- **Prevention:**
  - **Pre-Query Validation:** Before executing search queries, verify required extensions are available (quick check against `pg_extension` catalog)
  - **Periodic Health Checks:** Implement periodic extension availability checks (every 5 minutes) to detect issues before queries fail
  - **Database Monitoring:** Monitor database configuration changes that might affect extension availability

### Connection Pool Exhaustion

**Scenario:** Database connection pool is exhausted when search query attempts to execute
- **Detection:** Monitor connection pool usage continuously. Track metrics: available connections, in-use connections, waiting requests, connection wait time.
- **Thresholds:**
  - **Warning:** Connection pool usage > 80% for > 30 seconds - Alert operations team
  - **Critical:** Connection pool usage = 100% (all connections in use) - Immediate alert and failover behavior
- **Error Handling:** When connection pool is exhausted:
  - **Fail Fast Strategy:** Return error immediately rather than queuing requests. Queuing requests during pool exhaustion can lead to cascading timeouts and degraded user experience.
  - **Error Code:** Return `SEARCH_CONNECTION_POOL_EXHAUSTED` with user message: "Search service is temporarily busy. Please try again in a few moments."
  - **Retry Guidance:** Do not automatically retry - user should retry manually after a short delay (5-10 seconds).
  - **Circuit Breaker:** If connection pool exhaustion occurs repeatedly (e.g., 3 times in 1 minute), activate circuit breaker to prevent further connection attempts for 30 seconds.
- **Monitoring:** Track connection pool metrics:
  - Connection pool utilization percentage (in-use / total)
  - Connection wait time (time requests wait for available connection)
  - Connection pool exhaustion events (count and duration)
  - Failed search queries due to pool exhaustion
- **Alerting:** 
  - **Critical Alert:** Connection pool exhaustion (100% utilization) for > 10 seconds - Immediate notification to operations team
  - **Warning Alert:** Connection pool usage > 80% for > 1 minute - Alert operations team for capacity planning
- **Recovery Procedures:**
  1. **Immediate:** Investigate root cause (slow queries, connection leaks, insufficient pool size)
  2. **Short-term:** Increase connection pool size if queries are performing normally but pool is too small
  3. **Long-term:** Optimize slow queries, fix connection leaks, scale database resources if needed
  4. **Prevention:** Monitor connection pool metrics proactively and scale pool size before exhaustion occurs

### Search Query Timeout Handling

**Scenario:** Search query takes too long to execute
- **Timeout Threshold:** Search queries should timeout after 5 seconds. This prevents long-running queries from blocking database connections and degrading user experience.
- **Timeout Value Consistency:** The 5-second timeout applies to all search query modes (full search with all extensions, degraded text-only search, degraded geo-only search). Timeout is not adjusted based on extension availability - queries should complete within 5 seconds regardless of search mode.
- **Automatic Retry Logic:** For transient failures (network errors, temporary database connection issues), implement automatic retry with exponential backoff:
  - First retry: Immediate (0ms delay)
  - Second retry: 500ms delay
  - Third retry: 2000ms delay
  - Maximum 3 retries before returning error
- **Circuit Breaker Pattern:** If search queries repeatedly timeout (e.g., 5 timeouts in 1 minute), activate circuit breaker:
  - Open circuit: Stop executing search queries, return error immediately
  - Half-open state: After 30 seconds, attempt single test query
  - Closed circuit: If test query succeeds, resume normal operation
  - Monitor circuit breaker state and alert when circuit opens
- **Error Handling:** When timeout occurs, return error code `SEARCH_TIMEOUT` with user message: "Search is taking longer than expected. Please try again with more specific filters." Suggest narrowing search criteria (smaller date range, specific trade, smaller radius).
- **Performance Investigation:** When timeouts occur, log query details (filters, execution time, slow query plan) for performance analysis. Use `EXPLAIN ANALYZE` to identify slow query patterns and optimize indexes or query structure.

### Performance Optimization

**Performance Requirements:**
- **Target Response Time (P95):** < 200ms for 95th percentile search queries (including filters and pagination)
- **Target Response Time (P99):** < 500ms for complex queries with multiple filters and geo search
- **Real-Time Data:** Worker profile updates, booking changes, and rating updates are immediately reflected in search results (no sync delay)
- **Cache Hit Rate Target:** > 80% for common search patterns (via Redis caching)

**Caching Strategy:**
- **Redis Caching:** Search results cached with 5-minute TTL for frequently accessed queries (performance optimization only)
- **Cache Key Format:** `search:{filters_hash}:page:{page}`
- **Cache Invalidation:** Invalidate cache on worker profile updates, booking status changes, or rating updates (improves UX but not required for correctness)
- **Database Query Plan Caching:** PostgreSQL caches query plans for repeated queries
- **Important:** Cache is for performance only - availability is always checked in real-time from the database, ensuring data consistency regardless of cache state

**Pagination Consistency:**

**Behavior:** Each page request queries database in real-time. Workers may appear/disappear between pages if availability changes.

**Expected Behavior:**
- **Real-Time Consistency:** Each page request queries database in real-time
- **Acceptable Inconsistency:** Workers may appear/disappear between pages if availability changes
- **User Experience:** This is expected behavior - workers shown on page 1 may not be available when user views page 2
- **Error Handling:** If worker becomes unavailable between pages, show "Worker no longer available" message when user tries to add to cart

**Implementation:**
- No special handling required - this is expected PostgreSQL behavior
- Each pagination request executes a fresh query with current availability state
- Final availability check at checkout uses `SELECT FOR UPDATE` to ensure consistency

**Profile Completeness Assumption:**

**State Machine Guarantee:** Search queries can safely assume profile completeness for workers with `user_state = 'Listed'`.

**Validation:**
- Workers can only reach `Listed` state when profile is complete (enforced by state machine)
- State machine prevents `Listed` state until all required fields are complete
- If worker reaches `Listed` state, profile is guaranteed to be complete
- Search queries filter by `user_state = 'Listed'`, ensuring only complete profiles appear in results

**Edge Case Prevention:**
- State machine validation prevents partial profile data from appearing in search
- No explicit handling needed in search queries - state machine guarantees data consistency

**Worker Unlisting During Active Search:**

**Behavior:** When a worker is unlisted (state changes from `Listed` to `Profile_Complete`), search behavior adapts accordingly.

**Real-Time Updates:**
- Search queries are real-time - unlisted workers disappear from new search results immediately
- Existing results: Workers already in search results remain visible until user refreshes or performs new search
- Cart handling: If unlisted worker is in cart, show warning at checkout: "Worker is no longer available. Please remove from cart."

**User Experience:**
- This is expected behavior - workers can be unlisted at any time
- No special error handling required - checkout validation will detect unlisted workers

**Checkout Validation:**
- Final availability check at checkout validates worker is still `Listed`
- If worker is unlisted, checkout fails with appropriate error message
- See [Optimistic Concurrency](./optimistic-concurrency.md) for checkout validation details

**Company Metrics Consistency:**

**Update Frequency:** Company metrics (Fulfillment Score, On-Time Reliability) are calculated in background jobs and updated daily.

**Search Consistency:**
- **Single Query Consistency:** All workers in a single search result set use same metrics snapshot (calculated at query time)
- **Cross-Query Consistency:** Metrics may differ between search queries if updated between requests (acceptable)
- **User Experience:** Metrics are "as of" the search query time - slight variations between queries are expected

**Eventual Consistency:**
- Metrics are eventually consistent, not real-time
- Daily background job updates metrics for all companies
- Search queries use metrics snapshot from time of query execution
- No special handling required - this is expected behavior for background-calculated metrics

**Performance Optimization Techniques:**
- **Database Indexing:** Critical indexes on frequently filtered columns:
  - `users(user_state)` - Filter listed workers
  - `worker_profiles(trade, skills)` - Trade and skills filtering
  - `worker_profiles(home_zip_code)` - Geo search
  - **`bookings(worker_id, status, start_date, end_date)` - Availability checks (REQUIRED)**
    ```sql
    CREATE INDEX idx_bookings_availability_check ON bookings(worker_id, status, start_date, end_date)
    WHERE status IN ('Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance');
    ```
    This composite partial index is critical for optimizing the `NOT EXISTS` subquery used for real-time availability checking. The partial index (WHERE clause) only indexes bookings in blocking statuses, reducing index size and improving query performance. The column order is optimized for the availability check query pattern.
  - `ratings(rated_user_id)` - Rating aggregations
  - GIN indexes on JSONB columns (skills, certifications)
  - GiST indexes for geo search (if using postgis)
- **Query Optimization:** Use `EXPLAIN ANALYZE` to optimize slow queries
- **Pagination:** Default page size of 20 results to limit response payload
- **Read Replicas:** Consider read replicas for high query volume scenarios
- **Connection Pooling:** Ensure adequate database connection pool size

**Performance Monitoring:**
- Monitor PostgreSQL query latency via database metrics
- Track query execution times and slow query logs
- Alert on P95 response times exceeding 200ms
- Monitor database connection pool usage
- Track cache hit rates for Redis caching

### Cache Staleness

**Scenario:** Cached results show workers that are no longer available
- **Solution:** 
  - Short cache TTL (5 minutes) - limits maximum staleness window
  - Invalidate cache on state changes (listing, booking status transitions, rating updates)
  - **Critical:** Always check availability at checkout time (final validation) using database-level locking - cache is for performance only, not for availability guarantees
  - **Pattern-Based Invalidation:** When booking status changes affect availability, invalidate all search result caches using pattern `search:*` to ensure consistency
  - **Real-Time Availability:** Even with caching, the final availability check at checkout queries the database directly, ensuring real-time accuracy regardless of cache state

**Explicit Cache Invalidation Triggers:**
The following events should trigger pattern-based cache invalidation (`search:*`) to ensure search results remain consistent:
- **Worker Profile Updates:**
  - Trade changes
  - Skills updates (additions, removals, modifications)
  - Languages updates (affects search filtering if language filters are implemented)
  - Rate changes (lending_rate updates)
  - Availability settings changes (availability mode, date ranges, blocked dates)
  - Experience years updates
  - Certification changes
  - Home zip code changes (affects geo search and distance calculations)
  - Maximum travel distance changes
- **Worker Rate Updates:**
  - `worker_rates.lending_rate` changes (affects rate filtering and all-inclusive price calculations)
  - `worker_rates.is_active` changes (affects rate availability in search)
- **Booking Status Transitions:**
  - Any booking status change that affects availability (transitions to/from blocking statuses: `Confirmed`, `Active`, `Pending_Payment`, `Payment_Paused_Dispute`, `Suspended_Insurance`)
  - Booking cancellations (worker becomes available)
  - Booking completions (worker becomes available)
  - Booking creation (worker becomes unavailable)
  - Booking date changes (start_date or end_date modifications affect availability windows)
- **Rating Updates:**
  - New ratings added (affects search result ordering by average rating and rating filters)
  - Rating modifications (if supported)
  - Rating deletions (if supported, affects average rating calculations)
- **Worker State Changes:**
  - Worker listed (`user_state` changes to `Listed`)
  - Worker unlisted (`user_state` changes from `Listed`)
- **Company Membership Changes:**
  - `company_members.status` changes (Active/Inactive status affects worker visibility in search)
  - `company_members.roles` changes (role changes affect worker visibility if role filtering is implemented)
- **Company Changes:**
  - Company name changes (affects company name revelation at cart addition)
- **Time Log Updates (On-Time Reliability):**
  - New time log entries added (affects on-time reliability percentage calculations)
  - Time log status changes (affects on-time reliability if status affects reliability calculations)
  - **Note:** On-time reliability is calculated from `time_log` table. While individual time log updates may not significantly impact search results, bulk updates or status changes that affect reliability calculations should trigger cache invalidation.
- **Zip Code Reference Data Updates:**
  - Zip code coordinate changes (longitude/latitude updates in `zip_codes` table affect geo search distance calculations)
  - **Note:** Zip code reference data rarely changes, but coordinate updates require cache invalidation to ensure accurate distance calculations
- **PostgreSQL Extension State Changes:**
  - **Extension Unavailability:** When extension becomes unavailable (detected via health checks or query failures), invalidate all search result caches using pattern `search:*`. Cached results may have been generated using extensions that are now unavailable, and should not be served to users.
  - **Extension Restoration:** When extension is restored after being unavailable, invalidate all search result caches using pattern `search:*`. This ensures that new queries use the restored extension functionality rather than serving stale cached results that may have been generated during degraded search mode.
  - **Extension Updates/Upgrades:** When extensions are updated or upgraded, invalidate all search result caches to ensure queries use the updated extension functionality. This prevents serving cached results generated with older extension versions.
  - **Rationale:** Extension state changes affect search query behavior (fuzzy matching, geo search, etc.). Cache invalidation ensures users receive consistent search results that match current extension availability and functionality.

**High-Concurrency Cache Invalidation Strategy:**
- **Rate Limiting:** During high-frequency booking status changes (e.g., bulk cancellations, mass booking updates), implement rate limiting for cache invalidation to prevent Redis performance degradation. Batch invalidation requests and process them at controlled intervals (e.g., maximum 10 invalidations per second per cache key pattern).
- **Batch Invalidation:** When multiple simultaneous status changes occur (e.g., multiple bookings cancelled in quick succession), batch the cache invalidation operations. Instead of invalidating `search:*` multiple times, queue invalidation requests and execute a single pattern-based invalidation after a short debounce period (e.g., 100ms).
- **Cache Invalidation Race Conditions:** Cache invalidation operations are idempotent and safe to execute even during active cache population. The Redis `DEL` operation for pattern `search:*` is atomic and will remove keys regardless of when they were created. If cache invalidation occurs simultaneously with cache population (e.g., booking status changes while search query is populating cache), the invalidation will remove the newly created cache keys, ensuring consistency. No special handling is required for race conditions - the atomic nature of Redis `DEL` operations ensures correct behavior.
- **Performance Monitoring:** Monitor cache invalidation performance metrics:
  - Cache invalidation latency (time to complete pattern-based invalidation)
  - Cache invalidation queue depth (number of pending invalidations)
  - Redis performance impact during high-frequency invalidations
  - Alert on cache invalidation latency exceeding 500ms or queue depth exceeding 100 items
- **Queue Overflow Handling:** If cache invalidation queue exceeds 100 items:
  - **Immediate Action:** Trigger alert to operations team and temporarily disable caching for search queries
  - **Queue Processing:** Process invalidation queue in priority order (recent changes first) to clear backlog
  - **Recovery:** Once queue depth returns to < 50 items, re-enable caching for search queries
  - **Monitoring:** Track queue overflow events (count and duration) for capacity planning
- **Fallback Strategy:** If cache invalidation performance degrades significantly during high concurrency, temporarily disable caching for search queries until invalidation queue clears. This ensures search functionality remains available even if cache performance is impacted.

**Cache Invalidation During Database Failover:**

**Scenario:** Primary database fails and read replica is promoted to primary, or read replica is promoted for planned maintenance.

**Cache Invalidation Strategy:**
- **Immediate Invalidation:** When database failover is detected or replica promotion is initiated, immediately invalidate all search result caches using pattern `search:*` to ensure consistency with the new primary database state.
- **Reasoning:** During failover, there may be a brief period where data state differs between old primary and new primary (replication lag, uncommitted transactions, etc.). Invalidating cache ensures search results reflect the new primary database state.
- **Implementation:**
  ```typescript
  async function handleDatabaseFailover() {
    // Invalidate all search result caches
    await redis.del('search:*');
    
    // Invalidate all facet caches
    await redis.del('facets:*');
    
    // Log cache invalidation event
    logger.info('Cache invalidated due to database failover', {
      timestamp: new Date(),
      reason: 'database_failover'
    });
  }
  ```

**Cache Invalidation During Read Replica Promotion:**

**Scenario:** Read replica is promoted to primary (planned maintenance or failover).

**Pre-Promotion Cache Invalidation:**
- **Before Promotion:** If promotion is planned (not emergency failover), invalidate all search caches 5 minutes before promotion to reduce cache staleness window.
- **During Promotion:** Invalidate all search caches immediately when promotion is detected (application detects new primary database connection).
- **After Promotion:** Verify cache invalidation completed successfully, then allow normal cache population to resume.

**Post-Promotion Cache Behavior:**
- **Cache Population:** After promotion, allow normal cache population to resume. New search queries will populate cache with results from the new primary database.
- **Monitoring:** Monitor cache hit rates after promotion to ensure normal cache behavior resumes.
- **Verification:** Execute test search queries to verify cache population and search functionality.

### Query Handling During Replica Promotion

**Scenario:** Read replica is promoted to primary while search queries are in-flight.

**Behavior:**
- **In-Flight Queries:** Queries that have already started executing will complete successfully using the promoted replica (now primary). PostgreSQL connection pooling handles the transition transparently.
- **Queued Queries:** Queries that are queued but not yet executing may fail with connection errors. Application should implement automatic retry logic for connection errors during promotion windows.
- **Connection Pool Recovery:** Connection pools automatically reconnect to the new primary database after promotion. Queries retry automatically on connection errors.

**Implementation:**
- Use connection pool retry logic for transient connection errors
- Monitor query failure rates during promotion windows
- Alert on elevated failure rates during promotion (may indicate connection pool configuration issues)

**Cache Invalidation During Planned Maintenance:**

**Scenario:** Database maintenance window (upgrades, schema changes, etc.).

**Pre-Maintenance Cache Invalidation:**
- **Before Maintenance:** Invalidate all search caches 10 minutes before maintenance window begins to ensure users see fresh data before maintenance.
- **During Maintenance:** Search functionality may be unavailable. Cache invalidation is not required during maintenance (no search queries executing).
- **After Maintenance:** Invalidate all search caches immediately when maintenance completes and database is available again. This ensures search results reflect any data changes that occurred during maintenance.

**Implementation:**
```typescript
async function handlePlannedMaintenance(maintenanceStartTime: Date) {
  const now = new Date();
  const timeUntilMaintenance = maintenanceStartTime.getTime() - now.getTime();
  
  // Invalidate cache 10 minutes before maintenance
  if (timeUntilMaintenance > 0 && timeUntilMaintenance <= 10 * 60 * 1000) {
    await redis.del('search:*');
    await redis.del('facets:*');
    logger.info('Cache invalidated before planned maintenance', {
      maintenanceStartTime,
      invalidatedAt: now
    });
  }
}

async function handleMaintenanceComplete() {
  // Invalidate all caches when maintenance completes
  await redis.del('search:*');
  await redis.del('facets:*');
  
  logger.info('Cache invalidated after maintenance completion', {
    timestamp: new Date()
  });
}
```

**Cache Invalidation During Redis Failover:**

**Scenario:** Redis cluster failover or Redis service unavailable.

**Behavior:**
- **During Redis Unavailability:** Search queries continue to work (cache is performance-only). Queries execute directly against database, bypassing cache.
- **During Active Cache Invalidation:** If Redis fails during an active cache invalidation operation:
  - **Immediate Action:** Log invalidation failure and continue with search queries (cache is performance-only, not required for correctness)
  - **Retry After Recovery:** When Redis becomes available again, immediately invalidate all search caches using pattern `search:*` to prevent stale cache after failover
  - **Idempotent Operations:** Cache invalidation operations should be idempotent (safe to retry) - retrying invalidation after Redis recovery does not cause issues
- **After Redis Recovery:** Invalidate all search caches when Redis becomes available again to ensure consistency. Cache population resumes normally.
- **Monitoring:** Track Redis failover events and cache invalidation recovery:
  - Redis failover detection events (count and duration)
  - Cache invalidation retry attempts after Redis recovery
  - Cache invalidation recovery time (time from Redis recovery to cache invalidation completion)
- **No Data Loss:** Since cache is performance-only and availability is always checked in real-time from database, Redis failover does not affect data consistency.

**Monitoring and Alerting:**
- **Cache Invalidation Events:** Log all cache invalidation events (failover, promotion, maintenance) with timestamps and reasons.
- **Cache Invalidation Metrics:** Track cache invalidation frequency and latency during failover scenarios.
- **Alerting:** Alert operations team when cache invalidation occurs during failover (for monitoring and verification purposes).

## Data Model Impact

### Tables Queried

**Schema Reference:** See [schema-identity.md](../../schema-identity.md) for `users` table and [schema-marketplace.md](../../schema-marketplace.md) for marketplace-related tables. For complete table definitions, indexes, constraints, and foreign keys:
- `users` - Core user data
- `worker_profiles` - Worker profile information
- `company_members` - User-company relationships
- `companies` - Company information (name hidden until cart addition)
- `worker_rates` - Lending rates
- `ratings` - Worker ratings
- `bookings` - Availability checking
- `worker_overtime_config` - OT configuration

### Redis Cache Keys

```
search:{filters_hash}:page:{page} - Cached search results (TTL: 5 minutes)
```

### Performance Considerations

1. **Query Optimization:** Use `EXPLAIN ANALYZE` to optimize slow search queries
2. **Connection Pooling:** Ensure adequate database connection pool size for search queries
3. **Read Replicas:** Consider read replicas for search queries if load is high
4. **CDN:** Cache static worker photos via CDN
5. **Pagination:** Default page size of 20 results. Consider cursor-based pagination for large datasets (future enhancement)
6. **Database Scaling:** Monitor PostgreSQL performance and scale vertically or horizontally if needed for high query volume
7. **Index Maintenance:** Regularly analyze and maintain database indexes for optimal query performance
