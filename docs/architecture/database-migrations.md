# J. Database Migrations

**Context:** Schema evolution, zero-downtime deployments, and data integrity require a robust migration strategy with versioning, rollback procedures, and backward compatibility.

**Decision:** Use database migration tooling with versioned migrations, zero-downtime deployment strategy, and comprehensive rollback procedures.

## 1. Migration Tooling

**Decision:** Use database migration tool (Flyway, Alembic, or custom migration system) for versioned schema changes.

**Migration Tool Requirements:**
- **Version Control:** All migrations stored in version control with sequential versioning
- **Idempotency:** Migrations can be run multiple times safely (check if change already applied)
- **Rollback Support:** Down migrations for reversing schema changes
- **Transaction Support:** Each migration runs in a transaction (rollback on failure)
- **Environment Management:** Separate migration configurations for dev, staging, production

**Migration File Naming:**
- **Format:** `V{version}__{description}.sql` (e.g., `V001__add_booking_status_index.sql`)
- **Sequential Versioning:** Incremental version numbers, no gaps
- **Descriptive Names:** Migration names clearly describe the change

## 2. Zero-Downtime Deployment Strategy

**Decision:** All schema changes must support zero-downtime deployments to avoid service interruption.

**Zero-Downtime Migration Patterns:**

**1. Additive Changes (Safest):**
- Adding new tables, columns, indexes (non-breaking)
- **Process:** Deploy migration, deploy application code, verify
- **Rollback:** Remove new columns/tables if needed (if no data dependencies)

**2. Backward-Compatible Column Changes:**
- Adding nullable columns, adding indexes
- **Process:** Add column as nullable, deploy application code using new column, make column required in separate migration
- **Rollback:** Remove column if needed (if no data)

**3. Data Migrations:**
- Transforming existing data, backfilling new columns
- **Process:** Deploy migration with data transformation, deploy application code, verify data integrity
- **Rollback:** Revert data transformation if needed

**4. Breaking Changes (Requires Coordination):**
- Removing columns, changing column types, adding required constraints
- **Process:** 
  - Step 1: Deploy application code that works with both old and new schema
  - Step 2: Deploy migration with breaking change
  - Step 3: Deploy application code that requires new schema only
- **Rollback:** Requires application code rollback + migration rollback

**Migration Deployment Process:**
1. **Review:** Migration reviewed by senior engineer for zero-downtime compatibility
2. **Test:** Migration tested in staging environment with production-like data
3. **Backup:** Database backup created before production migration
4. **Deploy:** Migration deployed during low-traffic window with monitoring
5. **Verify:** Verify migration success, check application health, monitor for errors
6. **Rollback Plan:** Rollback procedure documented and ready if issues occur

## 3. Schema Versioning

**Decision:** Track schema version in database and application for compatibility checking.

**Schema Version Tracking:**
- **Version Table:** `schema_migrations` table tracks applied migrations and version
- **Application Check:** Application verifies schema version matches expected version on startup
- **Version Mismatch:** Application fails to start if schema version mismatch (prevents running against wrong schema)

**Schema Version Format:**
- **Format:** Semantic versioning (e.g., `1.2.3`) or sequential numbering (e.g., `V001`, `V002`)
- **Version Increment:** Version incremented for each migration
- **Version History:** Migration history stored in `schema_migrations` table

## 4. Migration Review Process

**Migration Review Checklist:**
- [ ] Migration is backward-compatible or has coordinated deployment plan
- [ ] Migration includes rollback (down migration)
- [ ] Migration tested in staging environment
- [ ] Migration performance impact assessed (index creation, table alterations)
- [ ] Data migration logic verified (if applicable)
- [ ] Foreign key constraints reviewed for ON DELETE behavior
- [ ] Index creation reviewed for performance impact
- [ ] Migration timing considered (low-traffic window if needed)

**Review Approval:**
- **Standard Migrations:** Senior engineer approval required
- **Breaking Changes:** Architecture review and CTO approval required
- **Data Migrations:** Data engineer review and approval required

## 5. Rollback Procedures

**Rollback Decision Criteria:**
- **Data Corruption:** Immediate rollback if migration causes data loss or corruption
- **Performance Degradation:** Rollback if migration causes significant performance issues
- **Application Errors:** Rollback if application errors occur after migration
- **Failed Migration:** Automatic rollback if migration fails mid-execution

**Rollback Process:**
1. **Assess Impact:** Determine scope of rollback (migration only vs. migration + application code)
2. **Stop Deployment:** Halt any ongoing deployments
3. **Execute Rollback:** Run down migration or restore from backup
4. **Verify Rollback:** Verify schema restored, application functioning
5. **Post-Mortem:** Document rollback reason and lessons learned

**Rollback Limitations:**
- **Data Loss:** Cannot rollback migrations that delete data (requires backup restore)
- **Breaking Changes:** May require application code rollback in addition to migration rollback
- **Dependent Migrations:** Cannot rollback if subsequent migrations depend on rolled-back migration

## 6. Data Backfill Procedures

**Decision:** Data backfill operations run as separate migrations or scripts with monitoring and validation.

**Data Backfill Requirements:**
- **Idempotency:** Backfill scripts can be run multiple times safely
- **Batch Processing:** Large backfills processed in batches to avoid locking
- **Progress Tracking:** Track backfill progress for resumability
- **Validation:** Validate backfilled data for correctness
- **Rollback Plan:** Plan for reverting backfilled data if issues occur

**Data Backfill Process:**
1. **Backfill Script:** Create migration or script for data transformation
2. **Test Backfill:** Test backfill on staging data subset
3. **Production Backfill:** Run backfill in production with monitoring
4. **Verify Results:** Validate backfilled data meets requirements
5. **Cleanup:** Remove backfill script or mark as completed

## 7. Required PostgreSQL Extensions

**Decision:** PostgreSQL extensions required for search functionality must be installed via migrations.

**Required Extensions:**
- `pg_trgm` - Fuzzy text search for trade and skills matching
- `cube` - Required dependency for `earthdistance` extension
- `earthdistance` - Geo-location/radius search calculations
- **Alternative:** `postgis` can be used instead of `earthdistance` for more advanced geospatial features

**Extension Installation:**
Extensions must be installed via database migration before search functionality can be used. The installation should be idempotent (use `CREATE EXTENSION IF NOT EXISTS`).

**Critical Migration Order:**
Extensions must be installed **before** application code that uses search functionality. The correct migration order is:
1. **Extensions** - Install PostgreSQL extensions in explicit dependency order:
   - `pg_trgm` must be installed first (no dependencies)
   - `cube` must be installed before `earthdistance` (earthdistance depends on cube)
   - `postgis` can be installed independently (alternative to earthdistance)
   - **Installation Order:** `pg_trgm` → `cube` → `earthdistance` (or `postgis`)
2. **Indexes** - Create database indexes that depend on extensions (e.g., GIN indexes for `pg_trgm`, GiST indexes for geo search)
3. **Application Code** - Deploy application code that uses search functionality

**Extension Installation Order Validation:**
- **Migration Validation:** Migration should verify installation order is correct. If dependency installation fails (e.g., `cube` installation fails), `earthdistance` installation should not proceed.
- **Dependency Verification:** Before installing `earthdistance`, verify `cube` is installed. Migration should fail if dependency is missing.
- **Rollback on Dependency Failure:** If dependency installation fails, rollback the migration. Extensions can be removed if needed: `DROP EXTENSION IF EXISTS earthdistance; DROP EXTENSION IF EXISTS cube; DROP EXTENSION IF EXISTS pg_trgm;` (Note: This will break search functionality until extensions are reinstalled)

**Rollback Considerations:**
- If extension installation fails, the migration should rollback cleanly
- Application code should gracefully handle missing extensions (see [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for extension validation)
- If rollback is needed, extensions can be removed, but this will break search functionality until extensions are reinstalled

**Extension Installation Failure Rollback Procedures:**

**Scenario:** Extension installation fails during migration execution (e.g., `cube` installation fails, preventing `earthdistance` installation)

**Step-by-Step Rollback Procedure:**
1. **Detect Failure:** Migration tool detects extension installation failure (e.g., `cube` installation fails)
2. **Automatic Rollback:** Migration tool automatically rolls back the transaction:
   - Any partially installed extensions are rolled back (if transaction-based)
   - Database state returns to pre-migration state
   - Migration is marked as failed in `schema_migrations` table
3. **Verify Rollback:** Verify database state:
   ```sql
   -- Check which extensions are installed (should match pre-migration state)
   SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');
   
   -- Verify no partial extension installations remain
   SELECT * FROM pg_available_extensions WHERE name IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');
   ```
4. **Investigate Root Cause:**
   - Check database logs for installation failure reason (permissions, extension availability, dependency issues)
   - Verify database user has superuser privileges or extension installation permissions
   - Check if required extension packages are available in PostgreSQL installation
   - Verify database configuration allows extension installation
5. **Recovery Procedure:**
   - **If Permissions Issue:** Grant required permissions to database user or coordinate with database administrator
   - **If Extension Package Missing:** Install required PostgreSQL extension packages on database server
   - **If Dependency Issue:** Verify dependency order (e.g., `cube` must be installed before `earthdistance`)
   - **Retry Installation:** After resolving root cause, retry migration with corrected configuration
6. **Data Integrity:** Extension installation failures do not affect existing data - rollback ensures database consistency. No data migration or cleanup is required.

**Partial Extension Installation Failures:**

**Scenario:** Some extensions install successfully but others fail (e.g., `pg_trgm` and `cube` install, but `earthdistance` fails)

**Handling:**
- **Transaction-Based Installations:** If extensions are installed in a single transaction, partial failures cause full rollback (all extensions rolled back)
- **Separate Transactions:** If extensions are installed in separate transactions, successfully installed extensions remain, failed extensions are not installed
- **Recovery:** 
  - If partial installation occurs, verify which extensions are installed: `SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');`
  - Install missing extensions: `CREATE EXTENSION IF NOT EXISTS earthdistance;` (assuming `cube` is already installed)
  - Verify all extensions are installed before proceeding with application deployment
- **Application Impact:** Application should handle partial extension availability gracefully (see [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for degraded search modes)

**Recovery After Rollback:**
1. **Resolve Root Cause:** Fix the issue that caused extension installation failure (permissions, packages, configuration)
2. **Retry Migration:** Re-run the migration after resolving root cause
3. **Verify Installation:** Confirm all extensions are installed and functional
4. **Test Search Functionality:** Execute test search queries to verify extensions work correctly
5. **Monitor:** Monitor application logs and health checks to ensure extensions remain available

**Example Migration:**
```sql
-- V001__install_postgresql_extensions.sql
-- Install extensions in correct dependency order: pg_trgm → cube → earthdistance
-- IMPORTANT: cube must be installed before earthdistance

-- Step 1: Install pg_trgm (no dependencies)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Install cube (required dependency for earthdistance)
CREATE EXTENSION IF NOT EXISTS cube;

-- Step 3: Install earthdistance (depends on cube)
CREATE EXTENSION IF NOT EXISTS earthdistance;
-- OR use postgis instead (independent of cube):
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation order is correct
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'cube') THEN
    RAISE EXCEPTION 'cube extension must be installed before earthdistance';
  END IF;
END $$;
```

**Zero-Downtime Extension Installation:**
- **Extension Installation is Zero-Downtime:** PostgreSQL extensions can typically be installed while the database is running without requiring downtime. Extensions are installed at the database level and do not require application restart.
- **Active Query Handling:** Active search queries may fail if an extension is temporarily unavailable during installation. To minimize impact:
  1. **Verify No Active Queries:** Before installing extensions, check for active search queries and wait for them to complete (or route queries to other database instances if using read replicas)
  2. **Install Extension:** Execute `CREATE EXTENSION IF NOT EXISTS` command
  3. **Verify Installation:** Immediately verify extension is available: `SELECT extname FROM pg_extension WHERE extname = 'extension_name';`
  4. **Test Functionality:** Execute test query using the extension to verify it works correctly
- **Graceful Installation Procedure:**
  - Monitor active connections and queries before installation
  - Install extension during low-traffic window if possible
  - Verify extension availability immediately after installation
  - Monitor application logs for extension-related errors after installation
  - If extension installation fails, investigate root cause (permissions, extension availability, database configuration) before retrying

**Validation:**
- Application should validate extensions are installed during startup
- Health checks should verify extension availability
- See [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for extension validation implementation

**Rollback:**
Extensions can be removed if needed, but this is not recommended as it will break search functionality:
```sql
DROP EXTENSION IF EXISTS earthdistance;
DROP EXTENSION IF EXISTS cube;
DROP EXTENSION IF EXISTS pg_trgm;
```

**Note:** Extension installation requires superuser privileges. Ensure database user has appropriate permissions or coordinate with database administrator.

**Read Replica Extension Requirements:**
- If using read replicas for search queries, the same PostgreSQL extensions must be installed on all read replica databases
- Extensions are required for worker search functionality (fuzzy text search with `pg_trgm` and geo-location queries with `earthdistance` or `postgis`)
- Extension installation on read replicas must be included in deployment procedures
- **MANDATORY Verification:** Before routing search queries to any replica, complete the Pre-Routing Verification Checklist in [Deployment Runbook](./deployment-runbook.md#read-replica-extension-installation-procedures). Do NOT route search queries to replicas until all checklist items are verified.
- See [Deployment Runbook](./deployment-runbook.md) for complete extension installation procedures and verification checklist
- See [Performance Optimization](./performance-optimization.md) for read replica configuration details

**Migration Cleanup Procedures:**
- After migrating from Meilisearch to PostgreSQL native search, verify that:
  - PostgreSQL extensions are installed and available on all database instances (primary and replicas)
  - Search queries execute successfully using PostgreSQL native queries
  - Saved search alerts work correctly with PostgreSQL native queries
  - No orphaned Meilisearch infrastructure or configuration remains
  - Application code no longer references Meilisearch or search index sync workflows
- See [Deployment Runbook](./deployment-runbook.md) for complete migration cleanup checklist and verification procedures

**Implementation Details:** *(Note: Database Migrations Blueprint not yet created - planned for future implementation. Will include detailed migration patterns, rollback procedures, and best practices.)*
