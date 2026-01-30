# Performance Optimization Strategy

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Technical documentation for database performance optimization, composite indexes, query optimization, and performance monitoring strategies.

This document provides implementation guidance for database performance optimization to ensure fast response times as the SmartBench platform scales.

**Related Documentation:**
- [PRD: Goals and Background Context](../prd/goals-and-background-context.md) - Business context for performance requirements
- [Schema Documentation](./schema.md) - Complete database schema definitions
- [Observability & Monitoring](./observability-monitoring.md) - Performance monitoring and metrics
- [Background Jobs Blueprint](./blueprints/system/background-jobs.md) - Background job performance considerations

---

## Overview

The SmartBench platform implements comprehensive performance optimization strategies including composite indexes, query optimization, and performance monitoring to ensure fast response times as the platform scales. This document provides technical implementation details for database performance optimization.

---

## Composite Index Strategy

Composite indexes are critical for optimizing multi-column queries that are common in the SmartBench platform. The following composite indexes are defined to support high-performance query patterns.

### Critical Composite Indexes

#### Booking Domain

**Weekly Payment Processing:**
```sql
CREATE INDEX idx_bookings_weekly_payment ON bookings(payment_type, status, funded_period_end) 
WHERE payment_type = 'Weekly_Progress' AND status = 'Active';
```
**Purpose:** Optimizes Wednesday 10 AM weekly payment queries that filter by payment type, status, and funded period end date.

**Cancelled Bookings Lookup:**
```sql
CREATE INDEX idx_bookings_cancelled ON bookings(status, cancelled_at, cancelled_by) 
WHERE status = 'Cancelled';
```
**Purpose:** Optimizes queries for cancelled booking analysis and reporting.

**Audit Log for Booking History:**
```sql
CREATE INDEX idx_audit_log_target_entity ON audit_log(target_entity, target_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
```
**Purpose:** Optimizes queries for booking status change history and timeline reconstruction via audit_log table.

#### Fulfillment Domain

**Time Log Verification Metrics:**
```sql
CREATE INDEX idx_time_log_verified_metrics ON time_log(worker_id, status, clock_in_time, clock_out_time, verified_at) 
WHERE status IN ('Verified', 'Disputed');
```
**Purpose:** Optimizes queries for worker performance metrics, verification timing analysis, and auto-approval processing.

**Time Log Status Queries:**
```sql
CREATE INDEX idx_time_log_booking_status ON time_log(booking_id, status, clock_out_time);
```
**Purpose:** Optimizes auto-approval queries that filter by booking, status, and clock-out time for 4-hour auto-approval timer.

#### Financial Domain

**Pending Payments Processing:**
```sql
CREATE INDEX idx_pending_payments_status ON pending_payments(status, created_at) 
WHERE status = 'Pending';
```
**Purpose:** Optimizes webhook reconciliation job queries for pending payment processing.


#### Identity Domain

**Insurance Policy Validation:**
```sql
CREATE INDEX idx_insurance_policies_validation ON insurance_policies(company_id, is_active, expiration_date) 
WHERE is_active = true;
```
**Purpose:** Optimizes insurance gate validation queries during booking creation. **Note:** Insurance validation does NOT occur during weekly payment processing. Insurance failures are handled via independent compliance events (nightly monitoring jobs or manual updates) that immediately suspend bookings.

**Active Insurance Lookup:**
```sql
CREATE INDEX idx_insurance_policies_active ON insurance_policies(company_id, insurance_type, expiration_date) 
WHERE is_active = true AND expiration_date > NOW();
```
**Purpose:** Optimizes queries for active insurance policy validation and expiration monitoring.

#### Marketplace Domain

**Worker Search Availability Checks:**
```sql
CREATE INDEX idx_bookings_availability_check ON bookings(worker_id, status, start_date, end_date)
WHERE status IN ('Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance');
```
**Purpose:** Optimizes the `NOT EXISTS` subquery in worker search queries that checks for conflicting bookings. The partial index (WHERE clause) only indexes bookings in blocking statuses, reducing index size and improving query performance. This index is critical for real-time availability checking in PostgreSQL-native search.

**Saved Search Alerts:**
```sql
CREATE INDEX idx_saved_searches_active ON saved_searches(borrower_company_id, is_active, alert_preference) 
WHERE is_active = true;
```
**Purpose:** Optimizes saved search alert processing queries.

**Note:** Cart expiration cleanup is not needed with optimistic concurrency approach. The `cart_items` table does not include a `locked_at` field, as there is no cart locking mechanism.

#### Audit Domain

**Dispute Timeout Queries:**
```sql
CREATE INDEX idx_disputes_timeout ON disputes(booking_id, status, dispute_filed_at) 
WHERE status = 'Disputed';
```
**Purpose:** Optimizes dispute resolution timer queries for 3-hour timeout processing (dispute resolution timer remains 3 hours, separate from auto-approval timer).

---

## Query Optimization Requirements

### General Query Optimization Principles

1. **Use EXPLAIN ANALYZE:** Always use `EXPLAIN ANALYZE` to verify query execution plans and identify slow queries
2. **Index Coverage:** Ensure all WHERE clause columns and JOIN conditions are covered by indexes
3. **Avoid Full Table Scans:** Monitor for sequential scans on large tables and add indexes as needed
4. **Limit Result Sets:** Always use LIMIT clauses for pagination and result set size control
5. **Connection Pooling:** Ensure adequate database connection pool size for concurrent operations

### Specific Query Patterns

#### Weekly Payment Processing

**Query Pattern:**
```sql
SELECT b.*, p.timezone, p.jurisdiction_id
FROM bookings b
JOIN projects p ON b.project_id = p.id
WHERE b.payment_type = 'Weekly_Progress'
  AND b.status = 'Active'
  AND b.funded_period_end < (CURRENT_TIMESTAMP + INTERVAL '7 days');
```

**Optimization Requirements:**
- Use composite index `idx_bookings_weekly_payment` for efficient filtering
- Ensure `projects.id` has primary key index for JOIN optimization
- Consider read replicas for payment processing queries if load is high

#### Auto-Approval Timer Queries

**Query Pattern:**
```sql
SELECT * FROM time_log
WHERE booking_id = :booking_id
  AND status = 'Pending_Verification'
  AND clock_out_time < (NOW() - INTERVAL '4 hours');
```

**Optimization Requirements:**
- Use composite index `idx_time_log_booking_status` for efficient filtering
- Batch process multiple bookings to reduce query overhead
- Consider timezone-aware timestamp comparisons for project timezone accuracy

#### Insurance Gate Validation

**Query Pattern:**
```sql
SELECT * FROM insurance_policies
WHERE company_id = :company_id
  AND is_active = true
  AND expiration_date >= (:funded_period_end + INTERVAL '3 days');
```

**Optimization Requirements:**
- Use composite index `idx_insurance_policies_validation` for efficient filtering
- Cache insurance validation results for short periods (5 minutes) to reduce database load
- Batch validate multiple companies during weekly payment processing

#### Worker Search Query Performance

**Query Pattern:**
```sql
SELECT
  u.id,
  u.user_state,
  wp.trade,
  wp.skills,
  -- Calculate Distance
  (point(zip.longitude, zip.latitude) <@> point($search_long, $search_lat)) as distance_miles
FROM users u
JOIN worker_profiles wp ON u.id = wp.user_id
JOIN worker_rates wr ON u.id = wr.worker_id
JOIN zip_codes zip ON wp.home_zip_code = zip.zip_code
WHERE
  u.user_state = 'Listed'
  -- Text Search (using pg_trgm)
  AND (wp.trade ILIKE $query OR wp.skills::text ILIKE $query)
  -- Availability Check (real-time)
  -- Exclude workers with bookings in blocking statuses: Confirmed, Active, Pending_Payment,
  -- Payment_Paused_Dispute, Suspended_Insurance
  -- These statuses represent active bookings that should block availability
  AND NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.worker_id = u.id
    AND b.status IN ('Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance')
    AND b.end_date >= $req_start AND b.start_date <= $req_end
  )
ORDER BY distance_miles ASC
LIMIT 20 OFFSET $page_offset;
```

**Optimization Requirements:**
- Use composite indexes on frequently filtered columns (user_state, trade, home_zip_code)
- Use GIN indexes for text search columns (trade, skills) with pg_trgm extension
- Use GiST indexes for geospatial queries with earthdistance or postgis extension
- **Critical Index for Availability Checks:** Composite index on `bookings(worker_id, status, start_date, end_date)` to optimize the NOT EXISTS subquery used for real-time availability checking
- Consider read replicas for search queries if load is high
- Cache frequently accessed search results in Redis with appropriate TTL (5 minutes)

**Required Composite Index for Availability Checks:**
```sql
CREATE INDEX idx_bookings_availability_check ON bookings(worker_id, status, start_date, end_date)
WHERE status IN ('Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance');
```
**Purpose:** Optimizes the `NOT EXISTS` subquery in worker search queries that checks for conflicting bookings. The partial index (WHERE clause) only indexes bookings in blocking statuses, reducing index size and improving query performance. The column order (worker_id, status, start_date, end_date) is optimized for the availability check query pattern.

### Query Performance Targets

**Target Latencies:**
- **Booking Queries:** < 100ms p95 latency
- **Time Log Queries:** < 50ms p95 latency
- **Financial Transaction Queries:** < 100ms p95 latency
- **Insurance Validation Queries:** < 50ms p95 latency
- **Worker Search Query:** < 200ms p95 latency (PostgreSQL query)
- **Search Query with Availability Check:** < 300ms p95 latency (includes NOT EXISTS subquery)

**Monitoring:**
- Track query latency via database query logs and APM tools
- Alert on queries exceeding target latencies
- Regular query performance reviews (monthly)

---

## Performance Monitoring

### Database Performance Metrics

**Key Metrics to Monitor:**
- **Query Latency:** p50, p95, p99 latency by query type
- **Index Usage:** Track index hit rates and unused indexes
- **Connection Pool:** Monitor connection pool usage and wait times
- **Deadlocks:** Track deadlock frequency and affected queries
- **Slow Queries:** Identify queries exceeding 1 second execution time

**Monitoring Tools:**
- Database query logs with slow query logging enabled
- APM tools for application-level query tracking
- Database performance dashboards (CloudWatch RDS, Datadog, etc.)

### Index Maintenance

**Regular Index Maintenance:**
- **Index Bloat:** Monitor and rebuild indexes with high bloat (> 30%)
- **Unused Indexes:** Identify and remove unused indexes to reduce write overhead
- **Index Statistics:** Ensure index statistics are up-to-date for query planner accuracy

**Index Maintenance Schedule:**
- **Weekly:** Review slow query logs and identify missing indexes
- **Monthly:** Analyze index usage and remove unused indexes
- **Quarterly:** Review and optimize composite index definitions

### Performance Testing

**Load Testing Requirements:**
- **Booking Creation:** Test concurrent booking creation (100+ concurrent requests)
- **Weekly Payment Processing:** Test Wednesday 10 AM payment processing load
- **Worker Search:** Test PostgreSQL native search query performance under high load (1000+ queries/minute) - Direct database queries with no sync delay or index sync overhead
- **Time Log Processing:** Test auto-approval timer processing under load
- **Note:** Performance tests explicitly test PostgreSQL native search patterns - no search index sync jobs, sync workflows, or sync delay assumptions in performance baselines

**Performance Test Schedule:**
- **Pre-Release:** Performance testing before major releases
- **Quarterly:** Comprehensive performance testing and optimization review
- **Ad-Hoc:** Performance testing when adding new features or scaling infrastructure

---

## Scaling Considerations

### Read Replicas

**When to Use Read Replicas:**
- High read-to-write ratio queries (worker search, reporting, analytics)
- Background job queries that can tolerate slight replication lag
- Read-heavy workloads where query performance can benefit from distributing load across multiple database instances

**Read Replica Configuration:**
- **Replication Lag Monitoring:** Alert if replication lag exceeds 5 seconds
- **Query Routing:** Route read-only queries to replicas, write queries to primary
- **Failover:** Automatic failover to primary if replica becomes unavailable
- **Extension Requirements:** Read replicas must have the same PostgreSQL extensions installed as the primary database (`pg_trgm`, `cube`, `earthdistance` or `postgis`). Extensions are required for worker search functionality (fuzzy text search and geo-location queries). Extension installation on replicas must be included in deployment procedures. See [Database Migrations](./database-migrations.md) for extension installation details.

**Search Query Replica Lag Thresholds:**
- **Acceptable Lag:** < 100ms - Normal operation, queries routed to replicas
- **Warning Threshold:** 100ms - 500ms - Monitoring alert triggered, queries continue to use replicas
- **Fallback Threshold:** > 500ms - Automatic fallback to primary database for search queries
- **Lag Detection:** Replica lag is monitored continuously via PostgreSQL `pg_stat_replication` view. Check lag before routing each search query batch.
- **Fallback Behavior:** When lag exceeds 500ms, search queries automatically route to primary database. This is transparent to users - no errors are returned.
- **Recovery:** Once lag returns to < 100ms for 5 consecutive checks (1 minute at 12-second intervals), queries resume routing to replicas.
- **Monitoring:** Track replica lag metrics separately for each replica instance. Alert when any replica exceeds 500ms lag for > 1 minute.

### Connection Pooling

**Connection Pool Configuration:**
- **Pool Size:** Configure based on concurrent request patterns (default: 20 connections)
- **Max Connections:** Monitor database max_connections setting to prevent exhaustion
- **Connection Timeout:** Set appropriate timeout values (default: 30 seconds)

**Search Query Connection Pool Sizing:**
- **Read-Only Operations:** Search queries are read-only and can use read replicas, allowing for separate connection pools
- **Concurrent Search Patterns:** Worker search endpoints typically experience bursty traffic patterns (multiple users searching simultaneously)
- **Recommended Pool Size for Search:** 30-50 connections per read replica for search queries (adjust based on expected concurrent search volume)
- **Separate Pools:** Consider separate connection pools for search queries (read replicas) vs transactional operations (primary database)
- **Connection Pool Monitoring:** Monitor pool usage and adjust size based on connection wait times and query latency

**Connection Pool Exhaustion Handling for Search Queries:**

**Scenario:** Search query connection pool is exhausted (all connections in use)

**Behavior:**
- **Fail Fast Strategy:** Return error immediately rather than queuing requests. Queuing requests during pool exhaustion can lead to cascading timeouts and degraded user experience.
- **Error Code:** Return `SEARCH_CONNECTION_POOL_EXHAUSTED` with user message: "Search service is temporarily busy. Please try again in a few moments."
- **Retry Guidance:** Do not automatically retry - user should retry manually after a short delay (5-10 seconds).
- **Circuit Breaker:** If connection pool exhaustion occurs repeatedly (e.g., 3 times in 1 minute), activate circuit breaker to prevent further connection attempts for 30 seconds.

**Monitoring and Alerting:**
- **Connection Pool Utilization:** Track connection pool usage percentage (in-use / total connections)
- **Connection Wait Time:** Monitor time requests wait for available connection
- **Exhaustion Events:** Track connection pool exhaustion events (count and duration)
- **Alert Thresholds:**
  - **Warning:** Connection pool usage > 80% for > 1 minute - Alert operations team for capacity planning
  - **Critical:** Connection pool exhaustion (100% utilization) for > 10 seconds - Immediate notification to operations team

**Recovery Procedures:**
1. **Immediate:** Investigate root cause (slow queries, connection leaks, insufficient pool size)
2. **Short-term:** Increase connection pool size if queries are performing normally but pool is too small
3. **Long-term:** Optimize slow queries, fix connection leaks, scale database resources if needed
4. **Prevention:** Monitor connection pool metrics proactively and scale pool size before exhaustion occurs

**See Also:** [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for complete connection pool exhaustion handling details.

**Connection Pool Scaling Procedures:**

**Scaling Triggers:**
- Connection pool usage consistently > 80% for > 1 minute
- Connection wait times > 100ms
- Failed requests due to pool exhaustion
- Peak load patterns indicate need for larger pools

**Scaling Process:**
1. **Monitor Pool Metrics:** Track connection pool utilization, wait times, and failed requests
2. **Identify Peak Load Patterns:** Analyze connection pool usage during peak search times (e.g., Monday morning worker searches)
3. **Calculate Required Pool Size:** Based on peak concurrent requests and average query duration
4. **Scale Pool Size:** Increase connection pool size incrementally (e.g., +10 connections at a time)
5. **Monitor Impact:** Track pool usage and query latency after scaling
6. **Adjust as Needed:** Continue scaling until pool usage < 80% during peak load

**Scaling Formula:**
```
Required Pool Size = (Peak Concurrent Requests × Average Query Duration) / Target Query Throughput
```

**Example:** If peak concurrent search requests = 100, average query duration = 200ms, target throughput = 500 queries/second:
- Required Pool Size = (100 × 0.2s) / 500 = 0.04 seconds = ~40 connections minimum
- Recommended Pool Size = 40 × 1.25 (25% buffer) = 50 connections

**Concurrent Load Scenarios:**

**Weekly Payment Processing + Search Load:**

**Scenario:** Weekly payment processing runs every Wednesday at 10 AM (50 jobs/second) while search queries are executing simultaneously.

**Performance Strategy:**
- **Read Replica Usage:** Search queries should use read replicas to isolate from payment processing load
- **Connection Pool Separation:** Separate connection pools for search (read replicas) vs payment processing (primary)
- **Performance Monitoring:** Monitor search query latency during weekly payment windows
- **Alert Thresholds:** Alert if search p95 latency exceeds 500ms during payment processing
- **Graceful Degradation:** If search performance degrades, consider temporarily reducing cache TTL or disabling non-essential features

**Monitoring During High-Load Periods:**
- Track search query latency separately during weekly payment windows
- Monitor read replica load during concurrent payment processing
- Alert on search performance degradation during payment processing
- Track connection pool usage for both search and payment processing pools

**Load Balancing:**
- Distribute search queries across multiple read replicas during high-load periods
- Route payment processing queries to primary database only
- Consider read replica scaling during peak load periods

### Caching Strategy

**Query Result Caching:**
- **Insurance Validation:** Cache insurance validation results for 5 minutes
- **Worker Search Results:** Cache search query results in Redis with 5-minute TTL (key: `search:{filters_hash}:page:{page}`)
- **Worker Profile Data:** Cache worker profile data for search queries (5 minutes)

**Cache Invalidation:**
- Invalidate cache on data updates (insurance expiration)
- Use cache TTL for time-based invalidation
- Monitor cache hit rates and adjust TTL as needed

---

## Related Documentation

- [Database Schema](./schema.md) - Complete table definitions and indexes
- [Observability & Monitoring](./observability-monitoring.md) - Performance monitoring and alerting
- [Background Jobs Blueprint](./blueprints/system/background-jobs.md) - Background job performance optimization
- [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) - Search performance optimization

---

**[↑ Back to Architecture Index](./index.md)**
