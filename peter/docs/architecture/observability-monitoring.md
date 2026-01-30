# I. Observability & Monitoring

**Context:** Financial operations, booking workflows, and external service integrations require comprehensive monitoring to ensure system reliability and rapid incident response.

**Decision:** Implement comprehensive observability strategy with metrics, logging, tracing, and alerting for all critical system operations.

## 1. Service Level Objectives (SLOs) & Service Level Agreements (SLAs)

**Critical Operation SLOs:**
- **Payment Processing:** 99.9% success rate, <2s p95 latency
- **Booking Creation:** 99.5% success rate, <1s p95 latency
- **Time Clock Operations:** 99.9% success rate, <500ms p95 latency
- **Worker Search:** 99% success rate, <500ms p95 latency (includes extension availability checks)
- **API Availability:** 99.9% uptime (excluding planned maintenance)
- **PostgreSQL Extensions:** 100% availability (extensions must be installed for search functionality)

**SLA Commitments:**
- **Payment Processing:** 99.9% uptime, <4 hour resolution for critical payment issues
- **Time Clock:** 99.9% uptime, <2 hour resolution for time tracking issues
- **API Availability:** 99.5% uptime, <8 hour resolution for non-critical issues

**SLO Monitoring:**
- **Error Budget Tracking:** Track error budget consumption, alert when budget depleted
- **SLO Dashboards:** Real-time SLO compliance dashboards for operations team
- **SLO Reviews:** Monthly SLO review meetings to adjust targets based on business needs

## 2. Metrics & Monitoring

**Application Metrics:**
- **API Performance:** Request rate, latency (p50, p95, p99), error rate per endpoint
- **Financial Metrics:** Payment success rate, refund processing time, Stripe API response time
- **Booking Metrics:** Booking creation rate, cancellation rate, completion rate
- **Time Tracking Metrics:** Clock-in/out success rate, verification processing time, dispute rate
- **External Service Metrics:** Stripe API latency, SMS delivery rate, email delivery rate

**Infrastructure Metrics:**
- **Database Performance:** Query latency, connection pool usage, deadlock rate
  - **PostgreSQL Search Query Performance (Separate Tracking):** Search query latency (p50, p95, p99), search query error rate, search query throughput (queries/minute), extension availability status (`pg_trgm`, `earthdistance`/`postgis`). These metrics should be tracked separately from general database metrics to enable targeted performance monitoring and optimization of search functionality.
  - **Degraded Search Performance Metrics:** Track search query performance separately for degraded search modes:
    - **Text-Only Search Performance:** When geo extension (`earthdistance`/`postgis`) is unavailable, track performance metrics for text-only searches separately from full search (with geo)
    - **Full Search Performance:** Track performance metrics for searches with all extensions available
    - **Performance Impact Tracking:** Compare performance between full search and degraded search modes to assess impact of extension failures
    - **Alert Thresholds:** Alert on performance degradation during extension failures (e.g., degraded search p95 latency > 500ms)
- **Cache Performance:** Redis hit rate, cache eviction rate, memory usage
  - **Cache Invalidation Performance (Search-Specific):** Cache invalidation latency (time to complete pattern-based invalidation for `search:*`), cache invalidation queue depth (number of pending invalidations), cache invalidation throughput (invalidations per second), Redis performance impact during high-frequency invalidations. These metrics help monitor cache invalidation performance during high-concurrency scenarios (e.g., bulk booking status changes). Alert on cache invalidation latency exceeding 500ms or queue depth exceeding 100 items.
- **Server Resources:** CPU usage, memory usage, disk I/O, network throughput

**Business Metrics:**
- **User Engagement:** Daily active users, booking completion rate, worker utilization
- **Financial Health:** Total transaction volume, average booking value, platform revenue
- **Marketplace Health:** Active workers, search success rate, booking conversion rate

**Metrics Collection:**
- **Application Performance Monitoring (APM):** Real-time application metrics and error tracking
- **Custom Metrics:** Business-specific metrics logged to metrics service
- **Metrics Retention:** 90 days for detailed metrics, 1 year for aggregated metrics

## 3. Logging Strategy

**Log Levels:**
- **ERROR:** System errors, failed operations, security incidents (immediate alert)
- **WARN:** Degraded performance, retry attempts, non-critical failures (alert if pattern detected)
- **INFO:** Business events, successful operations, state transitions (standard logging)
- **DEBUG:** Detailed execution flow, variable values (development/debugging only)

**Structured Logging:**
- **JSON Format:** All logs in structured JSON format for easy parsing and aggregation
- **Consistent Fields:** Timestamp, level, service, operation, user_id, company_id, request_id, error details
- **Context Preservation:** Request ID propagated across all log entries for request tracing

**Log Aggregation:**
- **Centralized Logging:** All logs aggregated in centralized service (CloudWatch, Datadog, ELK stack)
- **Log Retention:** 
  - Financial/security logs: 7 years (compliance)
  - Application logs: 90 days
  - Debug logs: 7 days
- **Log Search:** Full-text search and filtering capabilities for incident investigation

**Search Query Logging:**

**Policy:** Log search queries with PII redaction for security monitoring, performance analysis, and abuse detection.

**Logged Data:**
- Search filters (trade, skills, location zip code, availability date ranges, rating filters, rate ranges)
- Result count (number of workers returned)
- Execution time (query execution time in milliseconds)
- Timestamp (query execution timestamp)
- IP address (redacted - not logged)
- User ID (redacted - not logged)

**Log Format:**
```json
{
  "event_type": "search_query",
  "timestamp": "2026-01-27T10:30:00Z",
  "filters": {
    "trade": "Electrician",
    "zip_code": "90210",
    "availability_start": "2026-02-01",
    "availability_end": "2026-02-07",
    "min_rating": 4.0
  },
  "result_count": 24,
  "execution_time_ms": 145
}
```

**Retention:** 90 days (standard application logs)

**Purpose:**
- Security monitoring: Detect unusual search patterns, potential abuse
- Performance analysis: Identify slow queries, optimize search performance
- Abuse detection: Identify scraping attempts, automated search abuse

**High-Load Period Monitoring:**

**Weekly Payment Processing Monitoring:**

**Monitoring During High-Load Periods:**
- **Search Query Latency:** Track search query latency separately during weekly payment windows (Wednesday 10 AM)
- **Read Replica Load:** Monitor read replica load during concurrent payment processing
- **Connection Pool Usage:** Track connection pool usage for both search and payment processing pools
- **Performance Degradation:** Alert if search p95 latency exceeds 500ms during payment processing

**Metrics to Track:**
- Search query latency (p50, p95, p99) during payment processing windows
- Read replica CPU/memory usage during concurrent load
- Connection pool utilization for search vs payment processing
- Search query throughput during high-load periods

**Alert Thresholds:**
- Alert if search p95 latency exceeds 500ms during payment processing
- Alert if read replica load exceeds 80% during payment processing
- Alert if search connection pool usage exceeds 90% during payment processing

**Replica Lag Monitoring During High Volume:**

**Continuous Monitoring:**
- Monitor replica lag continuously during high search volume
- Track replica lag metrics separately for each replica instance
- Alert when replica lag exceeds thresholds

**Monitoring Metrics:**
- Replica lag per instance (milliseconds)
- Fallback events (count of queries routed to primary due to high lag)
- Primary database load when fallback is active
- Recovery time (time from lag detection to recovery)

**Alert Thresholds:**
- **Warning:** Replica lag between 100ms-500ms for > 1 minute
- **Critical:** Replica lag > 500ms for > 1 minute (fallback active)
- **Recovery:** Alert when replica lag returns to < 100ms after being elevated

**Fallback Monitoring:**
- Track queries routed to primary database due to replica lag
- Monitor primary database load when fallback is active
- Alert if primary database load exceeds 80% during fallback
- Track fallback duration and frequency for capacity planning

## 4. Distributed Tracing

**Decision:** Implement distributed tracing for request flow across services and external APIs.

**Tracing Implementation:**
- **Trace ID:** Unique trace ID generated at request entry point, propagated through all service calls
- **Span Tracking:** Track spans for database queries, external API calls, internal service calls
- **Trace Context:** Propagate trace context in HTTP headers, message queues, and database queries
- **Trace Sampling:** 100% sampling for financial operations, 10% sampling for standard API requests

**Trace Visualization:**
- **Service Map:** Visual representation of service dependencies and call flows
- **Latency Breakdown:** Identify slow operations within request flow
- **Error Tracking:** Correlate errors across services in distributed trace

## 5. Alerting & Escalation

**Alert Thresholds:**
- **Critical Alerts (PagerDuty/On-Call):**
  - Payment processing failures >1% for 5 minutes
  - API error rate >5% for 5 minutes
  - Database connection pool exhaustion (100% utilization for > 10 seconds)
  - Search connection pool exhaustion (search-specific pool at 100% for > 10 seconds)
  - Security incidents (failed login attempts >10 in 1 minute)
  - PostgreSQL extension unavailability (search functionality degraded)
  - **Note:** No search index sync metrics or alerts - search uses PostgreSQL native queries directly
- **Warning Alerts (Slack/Email):**
  - Database connection pool usage > 80% for > 1 minute
  - Search connection pool usage > 80% for > 1 minute
  - Connection wait time > 1 second (requests waiting for available connections)
- **High Priority Alerts (Slack/Email):**
  - SLO error budget depletion >50%
  - External service degradation (Stripe, SMS, Email)
  - High error rate on specific endpoints
  - Search query timeout rate > 5% (queries exceeding 5-second timeout)
  - Search connection pool exhaustion events (track frequency and duration)
  - Search query performance degradation (p95 latency > 500ms for > 5 minutes)
  - Read replica lag > 500ms for > 1 minute (search queries falling back to primary)
  - Extension availability check latency > 1 second (may indicate database performance issues)
- **Medium Priority Alerts (Slack):**
  - Performance degradation (latency >2x baseline)
  - Cache hit rate <80%
  - Unusual business metrics (booking cancellation spike)
  - Search query p95 latency > 300ms (approaching target threshold of 200ms)
  - Search cache hit rate < 70% (below target of 80%)
  - Read replica lag between 100ms-500ms (warning threshold)
  - Search queries with zero results > 50% (may indicate filter issues)

**Escalation Procedures:**
- **Level 1 (On-Call Engineer):** Immediate response to critical alerts, initial investigation
- **Level 2 (Senior Engineer):** Escalation if issue not resolved in 30 minutes
- **Level 3 (Engineering Lead):** Escalation if issue not resolved in 2 hours
- **Level 4 (CTO/VP Engineering):** Escalation for critical financial or security incidents

**Alert Fatigue Prevention:**
- **Alert Deduplication:** Group similar alerts to prevent spam
- **Alert Suppression:** Suppress alerts during planned maintenance
- **Alert Tuning:** Regular review and tuning of alert thresholds based on false positive rate

## 6. Health Check Endpoints

**Health Check Implementation:**
- **Basic Health:** `GET /health` - Returns 200 if service is running
- **Readiness Check:** `GET /health/ready` - Returns 200 if service can accept requests (database connected, external services reachable)
- **Liveness Check:** `GET /health/live` - Returns 200 if service process is alive
- **Detailed Health:** `GET /health/detailed` - Returns health status of all dependencies (database, Redis, external APIs)

**Health Check Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "stripe": "healthy",
    "sms": "degraded"
  },
  "postgresExtensions": {
    "pg_trgm": "installed",
    "cube": "installed",
    "earthdistance": "installed"
  }
}
```

**Health Check Behavior for Partial Extension Failures:**
- **Partial Extension Failure:** If one or more extensions are unavailable but not all (e.g., `pg_trgm` available but `earthdistance` unavailable), health check should return `200 OK` with `status: "degraded"` in the response body. This indicates the service is operational but with reduced functionality (text search works, geo search disabled).
- **Complete Extension Failure:** If all required extensions are unavailable, health check should return `503 Service Unavailable` with `status: "unhealthy"`. This indicates search functionality is completely unavailable.
- **Health Check Response Format for Degraded State:**
  ```json
  {
    "status": "degraded",
    "timestamp": "2026-01-15T10:30:00Z",
    "services": {
      "database": "healthy",
      "search": "degraded"
    },
    "postgresExtensions": {
      "pg_trgm": "installed",
      "cube": "installed",
      "earthdistance": "unavailable"
    },
    "degradation": {
      "reason": "Partial extension failure",
      "unavailableExtensions": ["earthdistance"],
      "affectedFeatures": ["geo_search"],
      "fallbackActive": true
    }
  }
  ```

**PostgreSQL Extension Health Checks:**
- **Extension Availability:** Health check endpoints must verify that required PostgreSQL extensions (`pg_trgm`, `cube`, `earthdistance` or `postgis`) are installed and available
- **Search Endpoint Health:** The worker search endpoint (`GET /api/marketplace/workers/search`) health check should explicitly verify extension availability before reporting as healthy
- **Extension Validation:** Application performs extension validation on startup (see [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for implementation details)
- **Periodic Extension Health Checks:** Implement periodic extension availability checks (every 5 minutes) in addition to startup validation. While PostgreSQL extensions typically remain available once installed, periodic checks detect rare scenarios where extensions become unavailable during runtime (e.g., database configuration changes, extension removal, or database maintenance). If periodic checks detect extension unavailability, trigger alerts and degrade search functionality gracefully (see [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for fallback behavior).
- **Runtime Extension Monitoring:** Monitor extension availability metrics:
  - **Granular Extension Metrics:** Track extension availability separately for each extension type:
    - `pg_trgm_available` (boolean) - Text search extension availability
    - `cube_available` (boolean) - Cube extension availability (required dependency)
    - `earthdistance_available` (boolean) - Geo search extension availability (if using earthdistance)
    - `postgis_available` (boolean) - Geo search extension availability (if using postgis)
    - Extension availability per database instance (primary and each replica)
  - Extension health check latency (time to verify extension availability)
  - Extension unavailability events (count and duration) per extension type
  - Fallback behavior activation (when extensions unavailable, track which fallback is active)
  - **Partial Extension Failure Metrics:** Track partial failures separately from complete failures:
    - `extension_partial_failure` (count) - One or more extensions unavailable but not all
    - `extension_complete_failure` (count) - All required extensions unavailable
    - Alert thresholds: Warning for partial failures, Critical for complete failures
- **Extension Availability Alerts:** Set up alerts for extension unavailability:
  - **Critical Alert:** Any required extension becomes unavailable (triggers immediate notification)
  - **Warning Alert:** Extension health check latency exceeds 1 second (may indicate database performance issues)
  - **Info Alert:** Extension fallback behavior activated (track when search functionality is degraded)
- **Health Check Failure:** If required extensions are missing, health check should return status "degraded" or "unhealthy" with appropriate error message
- **Read Replica Extensions:** If using read replicas for search queries, health checks should verify extensions are available on replica databases as well. Monitor extension availability separately for each replica instance.
- **Periodic Extension Health Checks on Replicas:** All read replicas must have the same 5-minute periodic extension health checks as the primary database. This ensures that extension unavailability on replicas is detected promptly, not just during deployment or failover. Extension health checks on replicas should verify all required extensions (`pg_trgm`, `cube`, `earthdistance` or `postgis`) are available, not just the presence of any extension. If any required extension is unavailable on a replica, trigger monitoring alerts and route search queries to primary database or other available replicas.
- **Extension Availability During Replica Promotion:** Extension verification is a mandatory step in replica promotion procedures. Before promoting a replica to primary, verify all required extensions are installed and functional. If extensions are missing during replica promotion, install them immediately or abort the promotion until extensions are available. See [Deployment Runbook](./deployment-runbook.md) for detailed replica promotion procedures with extension verification.

**Health Check Usage:**
- **Load Balancer:** Use readiness check for traffic routing
- **Kubernetes:** Use liveness/readiness probes for container orchestration
- **Monitoring:** Monitor health check endpoints for service availability

**Implementation Details:** *(Note: Observability Blueprint not yet created - planned for future implementation. Will include detailed metrics, logging, and tracing implementation.)*
