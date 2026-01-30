# G. Error Handling & Resilience

**Context:** Financial operations, external service integrations, and critical business workflows require robust error handling, retry logic, and failure recovery patterns to ensure system reliability and data integrity.

**Decision:** Implement comprehensive error handling strategy with retry policies, circuit breakers, idempotency patterns, and dead letter queues for critical operations.

**Implementation Details:** See [Error Handling Blueprint](./blueprints/system/error-handling.md) for complete error handling patterns, retry policies, circuit breakers, idempotency keys, dead letter queue strategy, transaction rollback patterns, logging standards, and user-facing error messages.

**PostgreSQL Extension Failure Recovery:**
- **Extension Runtime Failures:** PostgreSQL extensions may become unavailable during runtime (not just at startup). See [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for complete extension failure handling patterns, including:
  - Mid-query extension failure detection and fallback behavior
  - Partial extension failure handling (one extension fails while others work)
  - Recovery procedures for extension restoration
  - Pre-query validation and periodic health checks

**Search Query Timeout Handling:**
- **Timeout Value:** Search queries timeout after 5 seconds to prevent long-running queries from blocking database connections and degrading user experience.
- **Timeout Consistency:** The 5-second timeout applies to all search query modes (full search with all extensions, degraded text-only search, degraded geo-only search). Timeout is not adjusted based on extension availability.
- **User-Facing Error Messages:** When timeout occurs, return error code `SEARCH_TIMEOUT` with user message: "Search is taking longer than expected. Please try again with more specific filters." Suggest narrowing search criteria (smaller date range, specific trade, smaller radius).
- **Retry Behavior:** Do not automatically retry timed-out queries. Users should retry manually with more specific filters. Automatic retries can exacerbate performance issues.
- **Performance Investigation:** When timeouts occur, log query details (filters, execution time, slow query plan) for performance analysis. Use `EXPLAIN ANALYZE` to identify slow query patterns and optimize indexes or query structure.
- **Circuit Breaker Pattern:** If search queries repeatedly timeout (e.g., 5 timeouts in 1 minute), activate circuit breaker to prevent further queries for 30 seconds. This prevents cascading failures during database performance degradation.
- **See Also:** [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for complete search query timeout handling details.
