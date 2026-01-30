# Deployment Runbook

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Comprehensive deployment procedures and operational runbook for the SmartBench platform.

---

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Environments](#deployment-environments)
- [Deployment Procedures](#deployment-procedures)
- [Database Migrations](#database-migrations)
- [Rollback Procedures](#rollback-procedures)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Troubleshooting](#troubleshooting)
- [Emergency Procedures](#emergency-procedures)

---

## Deployment Overview

### Deployment Strategy

SmartBench uses a **zero-downtime deployment strategy** with the following principles:

1. **Blue-Green Deployment:** Maintain two identical production environments, switch traffic between them
2. **Database Migrations:** All schema changes must support zero-downtime (additive changes, backward compatibility)
3. **Feature Flags:** Use feature flags to control feature rollout
4. **Gradual Rollout:** Deploy to staging first, then production with gradual traffic increase
5. **Automated Rollback:** Automatic rollback on health check failures

### Deployment Pipeline

```
Development → Staging → Production (Canary) → Production (Full)
```

---

## Pre-Deployment Checklist

### Code Quality Checks

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage meets requirements (80% unit, 60% integration)
- [ ] Linter passes with no errors
- [ ] Type checker passes with no errors
- [ ] Security scan passes (no high/critical vulnerabilities)
- [ ] Performance tests pass (response times within SLA)

### Documentation Checks

- [ ] API contracts updated (if API changes)
- [ ] Database migrations documented
- [ ] Breaking changes documented
- [ ] Release notes prepared
- [ ] Deployment plan reviewed

### Database Migration Checks

- [ ] Migrations tested in staging
- [ ] Migrations are backward compatible
- [ ] Rollback migrations tested
- [ ] Migration execution time estimated
- [ ] Data migration scripts tested (if applicable)
- [ ] PostgreSQL extensions installed (`pg_trgm`, `cube`, `earthdistance` or `postgis`) - Required for search functionality
- [ ] Migration cleanup procedures completed (if applicable - see Migration Cleanup section below)

### Configuration Checks

- [ ] Environment variables updated
- [ ] Feature flags configured
- [ ] Third-party service keys rotated (if needed)
- [ ] Secrets updated in secret management system

### Communication

- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Rollback plan communicated

---

## Deployment Environments

### Development

**Purpose:** Local development and testing

**Characteristics:**
- Developers deploy directly
- No formal approval process
- Can be reset at any time
- Uses test data

**Deployment:** Continuous (on commit)

### Staging

**Purpose:** Pre-production testing and validation

**Characteristics:**
- Mirrors production environment
- Uses production-like data (anonymized)
- Requires pull request approval
- Full test suite runs before deployment

**Deployment:** On merge to `main` branch

### Production

**Purpose:** Live production environment

**Characteristics:**
- Requires deployment approval
- Zero-downtime deployment
- Gradual traffic rollout
- Automatic rollback on failures

**Deployment:** Manual trigger after staging validation

---

## Deployment Procedures

### Staging Deployment

**Step 1: Create Release Branch**
```bash
git checkout main
git pull origin main
git checkout -b release/v1.x.x
```

**Step 2: Run Pre-Deployment Checks**
```bash
npm run test
npm run lint
npm run type-check
npm run security-scan
```

**Step 3: Build Application**
```bash
npm run build
```

**Step 4: Run Database Migrations (if needed)**
```bash
npm run migrate:staging
```

**Step 5: Verify PostgreSQL Extensions**
```bash
# Verify required extensions are installed on primary database
psql -d smartbench_staging -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');"
# If extensions are missing, install them:
psql -d smartbench_staging -c "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS earthdistance;"

# If using read replicas, verify extensions on replicas as well
# Read replicas require the same extensions for search functionality
psql -h replica-host -d smartbench_staging -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');"
```

**Note:** Extension validation should be performed during every deployment to ensure search functionality is available. The application's extension validation (see [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md)) will also check extensions on startup, but manual verification during deployment provides early detection of issues.

**Step 5: Deploy to Staging**
```bash
npm run deploy:staging
```

**Step 6: Verify Deployment**
- Check health endpoint: `GET /health`
- Verify application logs
- Run smoke tests
- Check monitoring dashboards

### Production Deployment

**Step 1: Verify Staging Deployment**
- Confirm all tests pass in staging
- Verify no critical issues
- Get stakeholder approval

**Step 2: Create Production Release**
```bash
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

**Step 3: Run Pre-Deployment Checks**
```bash
npm run test
npm run lint
npm run type-check
npm run security-scan
npm run performance-test
```

**Step 4: Backup Production Database**
```bash
npm run db:backup:production
```

**Step 5: Run Database Migrations (if needed)**
```bash
npm run migrate:production -- --dry-run  # Verify migrations
npm run migrate:production
```

**Extension Installation Order Validation:**
- **Migration Validation:** Before executing migrations that install extensions, verify the installation order is correct:
  - `pg_trgm` must be installed first (no dependencies)
  - `cube` must be installed before `earthdistance` (earthdistance depends on cube)
  - `postgis` can be installed independently (alternative to earthdistance)
- **Dependency Verification:** If migration includes extension installation, verify dependency order in migration file. Migration should fail if dependency installation fails (e.g., if `cube` installation fails, `earthdistance` installation should not proceed).
- **Rollback Procedure:** If extension installation fails during migration, rollback the migration. Extensions can be removed if needed: `DROP EXTENSION IF EXISTS earthdistance; DROP EXTENSION IF EXISTS cube; DROP EXTENSION IF EXISTS pg_trgm;` (Note: This will break search functionality until extensions are reinstalled)

**Step 5a: Verify PostgreSQL Extensions (if new environment)**
```bash
# Verify required extensions are installed
psql -d smartbench_production -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');"
# If extensions are missing, install them in correct dependency order (requires superuser privileges):
# IMPORTANT: Install in order: pg_trgm → cube → earthdistance (cube must be installed before earthdistance)
psql -d smartbench_production -c "
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
"
# Verify installation order is correct
psql -d smartbench_production -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis') ORDER BY extname;"
```

**Zero-Downtime Extension Installation:**
- **Extension Installation is Zero-Downtime:** PostgreSQL extensions can typically be installed while the database is running without requiring downtime. Extensions are installed at the database level and do not require application restart.
- **Active Query Handling:** Active search queries may fail if an extension is temporarily unavailable during installation. To minimize impact:
  1. **Verify No Active Queries:** Before installing extensions, check for active search queries and wait for them to complete (or route queries to other database instances if using read replicas)
  2. **Install Extension:** Execute `CREATE EXTENSION IF NOT EXISTS` command
  3. **Verify Installation:** Immediately verify extension is available: `SELECT extname FROM pg_extension WHERE extname = 'extension_name';`
  4. **Test Functionality:** Execute test query using the extension to verify it works correctly
- **Edge Case: Queries Executing During Extension Installation:**
  - **Scenario:** Search query starts executing while extension installation is in progress (race condition)
  - **Behavior:** Queries that attempt to use an extension during its installation will fail with extension-related errors (e.g., `function similarity(unknown, unknown) does not exist` for `pg_trgm`, `operator <@> does not exist` for `earthdistance`)
  - **Error Handling:** Application error handling should catch these errors and:
    1. **Retry with Fallback:** If partial extension failure is detected, retry query with degraded search mode (text-only if geo extension unavailable, exact matching if text extension unavailable)
    2. **Return Appropriate Error:** If all extensions unavailable, return `SEARCH_EXTENSION_RUNTIME_UNAVAILABLE` error code with user-friendly message
    3. **No Partial Results:** Do not attempt to return partial query results - PostgreSQL transaction rollback ensures no partial data is returned
  - **Mitigation Strategies:**
    - **Pre-Installation Check:** Before installing extensions, check for active search queries and wait for completion (or route to other database instances)
    - **Low-Traffic Windows:** Install extensions during low-traffic periods to minimize concurrent query impact
    - **Read Replica Routing:** If using read replicas, route search queries to other database instances during extension installation on a specific replica
    - **Health Check Validation:** Application health checks should verify extension availability before routing queries to a database instance
  - **Recovery:** After extension installation completes, queries automatically resume using the newly installed extension. No manual intervention required.
- **Graceful Installation Procedure:**
  - Monitor active connections and queries before installation
  - Install extension during low-traffic window if possible
  - Verify extension availability immediately after installation
  - Monitor application logs for extension-related errors after installation
  - If extension installation fails, investigate root cause (permissions, extension availability, database configuration) before retrying

**Performance Impact During Extension Installation/Updates:**

**Expected Performance Impact:**
- **Extension Installation:** Extension installation typically takes 1-5 seconds and has minimal performance impact on active queries. However, queries that use the extension being installed may fail during the brief installation window.
- **Extension Updates:** Extension updates (e.g., upgrading `pg_trgm` from version 1.5 to 1.6) may have slightly higher performance impact (5-10 seconds) but are still zero-downtime operations.
- **Query Routing During Installation:** If using read replicas, route search queries to other database instances during extension installation to avoid query failures. After installation completes, resume normal query routing.

**Monitoring During Extension Updates:**
- **Search Query Latency:** Monitor search query latency (p50, p95, p99) during extension installation/updates. Expected: minimal impact (< 50ms increase), but monitor for any degradation.
- **Query Failure Rate:** Monitor search query failure rate during extension installation. Expected: brief spike in failures during installation window, then return to normal.
- **Extension Availability:** Monitor extension availability health checks during installation. Expected: brief unavailability during installation, then restored.
- **Alert Thresholds:** 
  - **Warning:** Search query latency increases > 100ms during extension installation
  - **Critical:** Search query failure rate > 5% during extension installation
  - **Info:** Extension installation completes successfully (log for audit trail)

**Search Functionality During Extension Updates:**
- **Should Search Be Disabled?** No - search functionality should remain available during extension updates. The system should gracefully handle extension unavailability with fallback behavior (see [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md) for degraded search modes).
- **Fallback Behavior:** If extension becomes temporarily unavailable during update, search queries automatically fall back to degraded modes (text-only or geo-only search) until extension is restored.
- **Cache Invalidation:** After extension installation/update completes, invalidate all search result caches using pattern `search:*` to ensure queries use updated extension functionality.

**Step 7: Deploy to Production (Canary)**
```bash
npm run deploy:production:canary
```

**Step 8: Monitor Canary Deployment**
- Monitor error rates
- Monitor response times
- Monitor database performance
- Check application logs
- Wait 15 minutes

**Step 8: Deploy to Production (Full)**
```bash
npm run deploy:production:full
```

**Step 9: Verify Production Deployment**
- Check health endpoint: `GET /health`
- Verify application logs
- Run smoke tests
- Check monitoring dashboards
- Verify critical user journeys

---

## Database Migrations

### Migration Strategy

**Zero-Downtime Migration Patterns:**

1. **Additive Changes (Safest):**
   - Adding new tables
   - Adding nullable columns
   - Adding indexes
   - **Process:** Deploy migration → Deploy application code → Verify

2. **Backward-Compatible Column Changes:**
   - Adding nullable columns
   - **Process:** Add column as nullable → Deploy application code → Make column required in separate migration

3. **Data Migrations:**
   - Transforming existing data
   - Backfilling new columns
   - **Process:** Deploy migration with data transformation → Deploy application code → Verify data integrity

4. **Breaking Changes (Requires Coordination):**
   - Removing columns
   - Changing column types
   - **Process:** Requires application code deployment in two phases (support both old and new) → Remove old code in second deployment

### Migration Execution

**Pre-Migration:**
```bash
# Review migration files
npm run migrate:review

# Test migrations in staging
npm run migrate:staging

# Estimate execution time
npm run migrate:estimate:production
```

**Migration Execution:**
```bash
# Dry run (verify without executing)
npm run migrate:production -- --dry-run

# Execute migrations
npm run migrate:production

# Verify migration status
npm run migrate:status:production
```

**Post-Migration:**
- Verify data integrity
- Check application logs for errors
- Monitor database performance
- Verify application functionality

### Migration Rollback

**If migration fails or causes issues:

```bash
# Rollback last migration
npm run migrate:rollback:production

# Rollback to specific version
npm run migrate:rollback:production -- --target V001
```

**Note:** Rollback migrations must be tested in staging before production use.

---

## Rollback Procedures

### Automatic Rollback

**Triggers:**
- Health check failures (> 5% error rate)
- Response time degradation (> 2x baseline)
- Database connection failures
- Critical application errors

**Process:**
1. Deployment system detects failure
2. Automatic rollback to previous version
3. Traffic routed back to previous environment
4. Alert sent to on-call engineer

### Manual Rollback

**Step 1: Identify Issue**
- Check monitoring dashboards
- Review application logs
- Verify error rates

**Step 2: Decide on Rollback**
- Assess severity of issue
- Determine if rollback is necessary
- Get approval if needed

**Step 3: Execute Rollback**
```bash
# Rollback application
npm run rollback:production

# Rollback database migrations (if needed)
npm run migrate:rollback:production
```

**Step 4: Verify Rollback**
- Check health endpoint
- Verify application functionality
- Monitor error rates
- Check application logs

**Step 5: Communicate**
- Notify stakeholders
- Document issue and resolution
- Schedule post-mortem

### Read Replica Extension Installation Procedures

**Scenario:** Setting up a new read replica or ensuring existing replicas have required extensions for search functionality.

**Critical Requirement:** PostgreSQL extensions (`pg_trgm`, `cube`, `earthdistance` or `postgis`) must be installed on all read replicas before they can be used for search queries. Extensions are NOT automatically replicated from primary to replicas - they must be installed separately on each replica.

**Extension Installation During Replica Setup:**

**Step 1: Create Replica**
- Set up read replica using standard PostgreSQL replication procedures
- Wait for initial replication to complete (replica is in sync with primary)

**Step 2: Install Extensions on Replica**
```bash
# Connect to replica database (requires superuser privileges)
psql -h replica-host -d smartbench_production -U postgres

# Install required extensions in correct dependency order
# IMPORTANT: Install in order: pg_trgm → cube → earthdistance
# (cube must be installed before earthdistance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
-- OR use postgis instead of earthdistance:
-- CREATE EXTENSION IF NOT EXISTS postgis;

# Verify extensions are installed
SELECT extname, extversion FROM pg_extension 
WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');
```

**Extension Installation Timing Considerations:**
- **Low-Traffic Windows:** Extension installation on replicas should occur during low-traffic windows to minimize impact on search query performance
- **Temporary Query Routing:** During extension installation on a replica, temporarily route search queries to primary database or other available replicas to avoid query failures
- **Rollback Procedure:** If extension installation fails on replica, document the failure and retry during next maintenance window. Extension installation failures do not affect primary database or other replicas.

**Step 3: Verify Extension Functionality**
```bash
# Test text search extension (pg_trgm)
psql -h replica-host -d smartbench_production -c "SELECT similarity('electrician', 'electric');"
# Expected: Returns similarity score (0.0 to 1.0)

# Test geo extension (earthdistance)
psql -h replica-host -d smartbench_production -c "SELECT point(0,0) <@> point(1,1);"
# Expected: Returns distance in miles

# OR test postgis (if using postgis)
psql -h replica-host -d smartbench_production -c "SELECT ST_Distance(ST_MakePoint(0,0), ST_MakePoint(1,1));"
# Expected: Returns distance
```

**Step 4: Pre-Routing Verification Checklist (MANDATORY)**

**CRITICAL:** Before routing search queries to a new replica, complete this verification checklist. Do NOT route search queries to replicas until all items are verified.

- [ ] **Extension Installation Verified:** All required extensions (`pg_trgm`, `cube`, `earthdistance` or `postgis`) are installed and functional
- [ ] **Extension Functionality Tested:** Test queries using `similarity()` and geo distance functions execute successfully
- [ ] **Health Check Updated:** Health check endpoints verify extensions on new replica (returns `"installed"` status for all extensions)
- [ ] **Replica Lag Monitoring Configured:** Replica lag monitoring is active and alerting thresholds are set (warning: 100ms, fallback: 500ms)
- [ ] **Connection Pool Configuration Updated:** Read replica pool includes new replica in routing configuration
- [ ] **Cache Invalidation Executed:** All search result caches invalidated using pattern `search:*` to ensure queries use new replica
- [ ] **Test Search Query Executed:** Test search query (`GET /api/marketplace/workers/search?zipCode=60601&radius=50`) executes successfully against new replica
- [ ] **Monitoring Alerts Configured:** Extension availability alerts configured for new replica (separate from primary alerts)
- [ ] **Documentation Updated:** Deployment log includes replica setup with extension verification timestamps

**Step 5: Update Application Configuration**
- Update connection pool configuration to include replica in read replica pool
- Configure replica lag monitoring for the new replica
- Update health check endpoints to verify extensions on new replica
- **Cache Invalidation:** After extension installation on replica, invalidate all search result caches using pattern `search:*` to ensure search queries use the new replica with extensions available

**Extension Verification Before Replica Promotion:**

**Scenario:** Verifying extensions are installed before promoting a replica to primary (planned maintenance or failover preparation).

**Pre-Promotion Checklist:**
```bash
# 1. Verify all required extensions are installed (MANDATORY STEP)
# Extension verification is required before replica promotion - do not skip this step
psql -h replica-host -d smartbench_production -c "
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis')
ORDER BY extname;
"

# Expected output:
# extname      | extversion
# -------------+-----------
# cube         | 1.5
# earthdistance| 1.1
# pg_trgm      | 1.6

# 2. Test extension functionality
psql -h replica-host -d smartbench_production -c "
SELECT 
  similarity('test', 'testing') as text_search_test,
  (point(0,0) <@> point(1,1)) as geo_search_test;
"

# 3. Verify extension permissions
psql -h replica-host -d smartbench_production -c "
SELECT 
  n.nspname as schema,
  p.proname as function,
  pg_get_userbyid(p.proowner) as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('similarity', 'cube_distance', 'earth_distance')
  AND n.nspname IN ('public', 'extensions');
"
```

**If Extensions Are Missing Before Promotion:**
1. **Install Extensions Immediately (MANDATORY):**
   ```bash
   # Install extensions in correct dependency order
   psql -h replica-host -d smartbench_production -c "
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS cube;
   CREATE EXTENSION IF NOT EXISTS earthdistance;
   "
   ```
   **Critical:** Do NOT proceed with replica promotion until all extensions are installed and verified. Extension installation is a mandatory step - promotion should be aborted if extensions cannot be installed.
2. **Verify Installation:** Re-run verification queries above - all extensions must be present
3. **Test Search Functionality:** Execute test search query against replica to verify extensions work correctly
4. **Document:** Log extension installation in deployment log with timestamps and verification results

**Recovery Procedures: Missing Extensions on Promoted Replica**

**Scenario:** A replica was promoted to primary but extensions are missing (emergency failover, configuration error, etc.).

**Immediate Actions:**
1. **Install Extensions on Promoted Primary:**
   ```bash
   # Connect to promoted primary database
   psql -d smartbench_production -U postgres
   
   # Install required extensions
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS cube;
   CREATE EXTENSION IF NOT EXISTS earthdistance;
   
   # Verify installation
   SELECT extname FROM pg_extension 
   WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');
   ```

2. **Verify Application Health:**
   ```bash
   # Check health endpoint
   curl https://api.smartbench.com/health/detailed
   
   # Verify postgresExtensions section shows all extensions as "installed"
   ```

3. **Test Search Functionality:**
   - Execute test search query: `GET /api/marketplace/workers/search?zipCode=60601&radius=50`
   - Verify search returns results without errors
   - Monitor application logs for extension-related errors

4. **Update All Read Replicas:**
   - Install extensions on all remaining read replicas
   - Verify extensions on each replica
   - Update connection pool configuration if needed

**If Extensions Cannot Be Installed:**
- **Root Cause Investigation:** Check database logs, permissions, extension availability
- **Fallback:** Route all search queries to primary database (if available) until extensions can be installed
- **Alert:** Send critical alert to operations team with details and impact assessment
- **Documentation:** Document issue, root cause, and resolution in incident log

**Prevention:**
- **Automated Verification:** Include extension verification in replica health checks
- **Deployment Automation:** Automatically install extensions during replica setup
- **Monitoring:** Alert if any replica is missing required extensions
- **Documentation:** Ensure extension installation is part of standard replica setup procedures

### Read Replica Failover Procedures

**Scenario:** Primary database fails and read replica is promoted to primary, or read replica is promoted for maintenance.

**Critical Requirement:** PostgreSQL extensions must be available on promoted replicas for search functionality to work.

**Pre-Failover Extension Verification Checklist:**
Before initiating failover, verify extensions are installed on target replica:
```bash
# Verify extensions on replica before promotion
psql -h replica-host -d smartbench_production -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');"

# Expected output should show:
# pg_trgm
# cube
# earthdistance (or postgis)
```

If extensions are missing, install them before failover:
```bash
# Install extensions on replica (requires superuser privileges)
psql -h replica-host -d smartbench_production -c "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS earthdistance;"
```

**Failover Steps:**

**Step 1: Verify Extension Availability on Promoted Replica**
```bash
# After replica promotion, verify required extensions are installed
psql -d smartbench_production -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');"

# Expected output should show:
# pg_trgm
# cube
# earthdistance (or postgis)
```

**Step 2: Install Missing Extensions (if needed)**
```bash
# If extensions are missing, install them (requires superuser privileges)
# Note: Extension installation during failover may take 30-60 seconds
psql -d smartbench_production -c "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS earthdistance;"

# Verify installation completed successfully
psql -d smartbench_production -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');"
```

**Step 3: Verify Application Health**
```bash
# Check health endpoint to verify extension availability
curl https://api.smartbench.com/health/detailed

# Verify postgresExtensions section shows all required extensions as "installed"
# Expected response:
# {
#   "postgresExtensions": {
#     "pg_trgm": "installed",
#     "cube": "installed",
#     "earthdistance": "installed"
#   }
# }
```

**Step 4: Test Search Functionality**
- Execute test search query: `GET /api/marketplace/workers/search?zipCode=60601&radius=50`
- Verify search returns results without errors
- Monitor application logs for extension-related errors
- Check search query performance (should be < 200ms p95)

**Fallback Procedure:**
- **If Extensions Cannot Be Installed During Failover:**
  1. **Immediate Action:** Route all search queries to primary database (if available) by updating connection pool configuration
  2. **Update Connection Pool:** Configure application to route search queries to primary database instead of promoted replica
  3. **Alert Operations Team:** Send critical alert with details: extension installation failure, current fallback behavior, estimated impact
  4. **Investigation:** Investigate why extensions cannot be installed (permissions, database configuration, extension availability)
  5. **Recovery:** Once extensions are installed, verify functionality and restore normal query routing to promoted replica
- **If Primary Database Also Unavailable:**
  - Search functionality will be degraded (geo search disabled, text search may be limited)
  - Return appropriate error codes: `SEARCH_EXTENSION_MISSING` or `SEARCH_GEO_UNAVAILABLE`
  - Alert operations team for immediate resolution

**Post-Failover Monitoring:**
- Monitor extension availability on promoted replica for 24 hours after failover
- Set up alerts for extension unavailability on all database instances
- Verify search query performance meets targets (< 200ms p95)
- Review application logs for extension-related errors

**Prevention:**
- **Replica Setup Procedures:** Include extension installation in all replica setup and provisioning scripts
- **Regular Health Checks:** Verify extensions on all replicas during regular health checks (daily)
- **Infrastructure Documentation:** Document extension requirements in infrastructure provisioning scripts and infrastructure-as-code templates
- **Automated Extension Installation:** Consider automated extension installation during replica provisioning to prevent manual errors
- **Monitoring Alerts:** Set up monitoring alerts for extension availability on all database instances (primary and replicas)

### Adding New Read Replicas Post-Migration

**Scenario:** Adding a new read replica to an existing infrastructure after the migration from Meilisearch to PostgreSQL native search is complete.

**Procedure:**

**Step 1: Create Replica from Primary Database**
- Set up read replica using standard PostgreSQL replication procedures
- Wait for initial replication to complete (replica is in sync with primary)
- Verify replica connectivity and replication lag is within acceptable thresholds (< 100ms)

**Step 2: Install Required Extensions on Replica**
```bash
# Connect to replica database (requires superuser privileges)
psql -h replica-host -d smartbench_production -U postgres

# Install required extensions in correct dependency order
# IMPORTANT: Install in order: pg_trgm → cube → earthdistance
# (cube must be installed before earthdistance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
-- OR use postgis instead of earthdistance:
-- CREATE EXTENSION IF NOT EXISTS postgis;

# Verify extensions are installed
SELECT extname, extversion FROM pg_extension 
WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');
```

**Step 3: Verify Extension Availability**
- Execute test queries to verify extension functionality:
  - Text search: `SELECT similarity('test', 'testing');`
  - Geo search: `SELECT point(0,0) <@> point(1,1);` (earthdistance) or `SELECT ST_Distance(ST_MakePoint(0,0), ST_MakePoint(1,1));` (postgis)
- Verify extension versions match primary database versions (if version matching is required)

**Step 4: Add Replica to Connection Pool Routing**
- Update connection pool configuration to include new replica in read replica pool
- Configure replica lag monitoring for the new replica (warning: 100ms, fallback: 500ms)
- Update health check endpoints to verify extensions on new replica

**Step 5: Monitor Replica Lag and Extension Availability**
- Monitor replica lag metrics for the new replica (target: < 100ms)
- Monitor extension availability health checks (all extensions should show as "installed")
- Alert on elevated replica lag (> 500ms) or extension unavailability
- Continue monitoring for 24 hours after replica addition to ensure stability

**Verification Checklist:**
- [ ] Replica created and replication lag < 100ms
- [ ] All required extensions installed and verified
- [ ] Extension functionality tested (text search and geo search queries)
- [ ] Replica added to connection pool routing
- [ ] Replica lag monitoring configured
- [ ] Extension availability health checks configured
- [ ] Test search query executed successfully against new replica
- [ ] Monitoring alerts configured for new replica

**Note:** This procedure applies to adding new replicas after the initial migration. For initial replica setup during migration, follow the standard "Read Replica Extension Installation Procedures" section above.

---

## Migration Cleanup Procedures

### PostgreSQL Native Search Migration Cleanup

**Context:** After migrating from Meilisearch to PostgreSQL native search, verify that all infrastructure and configuration cleanup has been completed.

**Cleanup Checklist:**
- [ ] **Meilisearch Infrastructure Removed:**
  - Meilisearch service/container removed from infrastructure
  - Meilisearch configuration files removed from codebase
  - Meilisearch environment variables removed from deployment configuration
  - Meilisearch API keys removed from secret management system
- [ ] **Inngest Workflows Removed:**
  - `SyncWorkerToSearch` workflow removed from Inngest configuration
  - Any other search index sync workflows removed
  - Inngest event triggers for search sync removed
- [ ] **Application Code Cleanup:**
  - Meilisearch client libraries removed from dependencies
  - Search index sync code removed from application
  - All references to Meilisearch removed from codebase
- [ ] **PostgreSQL Extensions Verified:**
  - Extensions installed on primary database: `pg_trgm`, `cube`, `earthdistance` (or `postgis`)
  - Extensions installed on all read replicas (if using replicas)
  - Extension availability verified via health checks
- [ ] **Data Validation:**
  - Search queries return expected results (compare with pre-migration baseline if available)
  - Saved search alerts execute successfully using PostgreSQL native queries
  - Search performance meets targets (p95 < 200ms)
  - No errors in application logs related to missing search index or sync failures
- [ ] **Monitoring Cleanup:**
  - Meilisearch monitoring/alerting removed
  - Search index sync metrics removed from dashboards
  - PostgreSQL search performance metrics configured and working
- [ ] **Documentation Updated:**
  - Architecture documentation updated to reflect PostgreSQL native search
  - API documentation updated (no references to search index)
  - Deployment procedures updated (no Meilisearch setup steps)

**Verification Steps:**
1. **Search Functionality Test:**
   - Execute test search queries with various filters
   - Verify results match expected behavior
   - Check search query performance (should be < 200ms p95)
2. **Extension Availability Test:**
   - Verify extensions are installed: `SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'cube', 'earthdistance', 'postgis');`
   - Test search queries with text search (fuzzy matching)
   - Test search queries with geo search (distance filtering)
3. **Saved Search Alerts Test:**
   - Trigger test saved search alert (instant or daily digest)
   - Verify alert query executes successfully
   - Verify alert contains expected workers
4. **Error Log Review:**
   - Review application logs for any search-related errors
   - Verify no errors related to missing Meilisearch or search index sync
   - Check for any extension-related errors

**Rollback Considerations:**
- **DISASTER RECOVERY ONLY:** The following rollback procedure is documented for disaster recovery scenarios only. Reverting to Meilisearch is **NOT recommended** for normal operations and should only be considered if PostgreSQL native search experiences critical failures that cannot be resolved through standard troubleshooting procedures. This rollback procedure requires significant effort and should be coordinated with the development team.

- If PostgreSQL native search needs to be reverted (unlikely but should be documented for disaster recovery):
  - **Step 1: Prepare Meilisearch Infrastructure**
    - Reinstall Meilisearch service/container in infrastructure
    - Configure Meilisearch with appropriate settings (index configuration, API keys)
    - Verify Meilisearch health and connectivity
  - **Step 2: Restore Application Code**
    - Restore application code that uses Meilisearch client (from version control history)
    - Restore Meilisearch client libraries in dependencies (`package.json`, etc.)
    - Restore Meilisearch configuration files and environment variables
    - Update application configuration to use Meilisearch instead of PostgreSQL native search
  - **Step 3: Restore Inngest Workflows**
    - Restore `SyncWorkerToSearch` workflow in Inngest configuration
    - Restore event triggers for search sync (worker profile updates, booking status changes, etc.)
    - Verify Inngest workflows are active and processing events
  - **Step 4: Re-sync Search Index**
    - Execute initial search index sync from database to Meilisearch
    - Sync all active worker profiles (`user_state = 'Listed'`) to Meilisearch index
    - Verify search index contains expected number of workers
    - Monitor sync progress and verify completion
  - **Step 5: Data Migration (if needed)**
    - **No Data Migration Required:** The database schema remains unchanged - no data migration is needed for rollback
    - **Saved Searches:** Saved searches continue to work without modification (they will use Meilisearch queries instead of PostgreSQL queries)
  - **Step 6: Testing and Verification**
    - Execute test search queries to verify Meilisearch functionality
    - Verify search results match expected behavior
    - Test saved search alerts with Meilisearch queries
    - Monitor application logs for Meilisearch-related errors
    - Verify search performance meets targets
  - **Step 7: Cleanup PostgreSQL Extensions (Optional)**
    - **Note:** Extensions can remain installed - they do not interfere with Meilisearch functionality
    - If desired, extensions can be removed: `DROP EXTENSION IF EXISTS earthdistance; DROP EXTENSION IF EXISTS cube; DROP EXTENSION IF EXISTS pg_trgm;`
    - **Recommendation:** Keep extensions installed in case PostgreSQL native search is re-enabled in the future
  - **Timeline and Coordination:**
    - **Estimated Time:** 2-4 hours for complete rollback (including testing and verification)
    - **Coordination Required:** 
      - Database administrator for Meilisearch infrastructure setup
      - Development team for application code restoration
      - DevOps team for Inngest workflow restoration
      - QA team for testing and verification
    - **Low-Traffic Window:** Execute rollback during low-traffic window to minimize user impact
  - **Testing Procedure:**
    - Test search queries with various filters (trade, location, availability, etc.)
    - Verify search results match expected behavior
    - Test saved search alerts (instant and daily digest)
    - Monitor search performance metrics
    - Verify no errors in application logs
  - **Note:** This rollback scenario is highly unlikely given the benefits of PostgreSQL native search (real-time consistency, reduced complexity, eliminated race conditions). Only consider rollback if critical issues cannot be resolved. Before executing rollback, exhaust all options to resolve issues with PostgreSQL native search.

---

## Post-Deployment Verification

### Health Checks

**Application Health:**
```bash
curl https://api.smartbench.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.x.x",
  "database": "connected",
  "cache": "connected",
  "postgresExtensions": {
    "pg_trgm": "installed",
    "cube": "installed",
    "earthdistance": "installed"
  },
  "externalServices": {
    "stripe": "connected",
    "twilio": "connected"
  }
}
```

**Extension Validation:**
- Verify all required PostgreSQL extensions are reported as "installed" in health check response
- If any extension is missing, search functionality will be unavailable
- Extension validation is performed automatically by the application on startup (see [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md))
- If using read replicas, verify extensions are also installed on replica databases

### Smoke Tests

**Critical Endpoints:**
- `GET /api/auth/login` - Authentication
- `GET /api/marketplace/workers/search` - Search
- `GET /api/bookings` - Bookings
- `GET /api/stripe/balance` - Stripe Connected Account balance

**User Journeys:**
- User login
- Worker search
- Booking creation (test mode)
- Time clock (test mode)

### Monitoring Checks

**Metrics to Monitor:**
- Error rate (should be < 1%)
- Response time (p95 < 200ms)
- Database query time (p95 < 100ms)
- Payment processing success rate (> 99%)
- Active user count

**Dashboards:**
- Application performance dashboard
- Database performance dashboard
- **PostgreSQL Search Performance Dashboard (Separate):** Dedicated dashboard for search query performance metrics including search query latency (p50, p95, p99), search query error rates, extension availability status, and search-specific database indexes performance. This separate dashboard enables focused monitoring and troubleshooting of search functionality independent of general database operations.
- Payment processing dashboard
- Error tracking dashboard

**Search-Specific Monitoring Verification:**
- **Search Query Metrics:** Verify search query latency metrics are being collected (p50, p95, p99)
- **Extension Availability:** Verify extension availability status is being tracked for all required extensions (`pg_trgm`, `cube`, `earthdistance`/`postgis`)
- **Connection Pool Metrics:** Verify search connection pool utilization and wait time metrics are being collected
- **Replica Lag Metrics:** If using read replicas, verify replica lag metrics are being tracked per replica instance
- **Search Error Rates:** Verify search query error rate and timeout rate metrics are being collected
- **Cache Performance:** Verify search cache hit rate metrics are being collected
- **Alert Configuration:** Verify search-specific alerts are configured:
  - Search query timeout rate > 5%
  - Search connection pool exhaustion (100% utilization)
  - Search query p95 latency > 500ms
  - Read replica lag > 500ms
  - Extension unavailability
- **Dashboard Verification:** Verify PostgreSQL Search Performance Dashboard is accessible and displaying current metrics

---

## Monitoring and Alerts

### Monitoring Tools

- **Application Monitoring:** Application Insights, New Relic
- **Database Monitoring:** Database performance insights
- **Error Tracking:** Sentry, Rollbar
- **Log Aggregation:** CloudWatch Logs, ELK Stack
- **Uptime Monitoring:** Pingdom, UptimeRobot

### Critical Alerts

**P0 Alerts (Immediate Response):**
- Application down
- Database connection failures
- Payment processing failures
- Authentication service failures
- > 10% error rate

**P1 Alerts (Response within 1 hour):**
- > 5% error rate
- Response time > 2x baseline
- Database query time > 500ms
- Payment processing < 95% success rate

**P2 Alerts (Response within 4 hours):**
- > 1% error rate
- Response time > 1.5x baseline
- Warning-level application errors

### Alert Channels

- **P0 Alerts:** Phone call + SMS + Slack
- **P1 Alerts:** SMS + Slack
- **P2 Alerts:** Slack only

---

## Troubleshooting

### Common Issues

**Issue: Deployment Fails**

**Symptoms:**
- Deployment script exits with error
- Application fails to start
- Health checks fail

**Resolution:**
1. Check deployment logs
2. Verify environment variables
3. Check database connectivity
4. Verify application dependencies
5. Rollback if necessary

**Issue: Database Migration Fails**

**Symptoms:**
- Migration script exits with error
- Database schema inconsistent
- Application errors related to schema

**Resolution:**
1. Check migration logs
2. Verify database permissions
3. Check for conflicting migrations
4. Rollback migration if necessary
5. Fix migration script and retry

**Issue: High Error Rate After Deployment**

**Symptoms:**
- Error rate > 5%
- Application logs show errors
- User reports issues

**Resolution:**
1. Check application logs
2. Verify database connectivity
3. Check external service status
4. Review recent code changes
5. Rollback if necessary

**Issue: Performance Degradation**

**Symptoms:**
- Response time > 2x baseline
- Database query time increased
- High CPU/memory usage

**Resolution:**
1. Check application performance metrics
2. Review database query performance
3. Check for N+1 queries
4. Verify cache hit rates
5. Scale resources if needed

---

## Emergency Procedures

### Production Incident Response

**Step 1: Assess Severity**
- P0: System down, data loss, security breach
- P1: Major functionality broken, significant user impact
- P2: Minor functionality broken, limited user impact

**Step 2: Notify Team**
- Page on-call engineer
- Create incident channel
- Notify stakeholders

**Step 3: Mitigate Impact**
- Rollback if recent deployment
- Enable feature flags to disable problematic features
- Scale resources if needed
- Isolate affected components

**Step 4: Investigate Root Cause**
- Review application logs
- Check monitoring dashboards
- Review recent changes
- Check external service status

**Step 5: Resolve Issue**
- Apply fix
- Deploy fix (if needed)
- Verify resolution
- Monitor for recurrence

**Step 6: Post-Mortem**
- Document incident
- Identify root cause
- Create action items
- Update runbook

### Data Recovery

**If Data Loss Occurs:**

1. **Stop All Writes:**
   - Disable write operations
   - Prevent further data loss

2. **Assess Damage:**
   - Identify affected data
   - Determine data loss scope
   - Check backup availability

3. **Restore from Backup:**
   ```bash
   npm run db:restore:production -- --backup-id <backup-id>
   ```

4. **Verify Data Integrity:**
   - Check restored data
   - Verify application functionality
   - Test critical user journeys

5. **Resume Operations:**
   - Re-enable write operations
   - Monitor for issues
   - Document recovery process

---

## Related Documentation

- [Database Migrations](./database-migrations.md) - Zero-downtime migration strategy
- [Error Handling & Resilience](./error-handling-resilience.md) - Error handling patterns
- [Observability & Monitoring](./observability-monitoring.md) - Monitoring strategy
- [Security Architecture](./security-architecture.md) - Security considerations for deployment

---

**Note:** This runbook should be reviewed and updated after each deployment to reflect lessons learned and process improvements.
