# Feature Blueprint: Saved Searches & Alerts
**Domain:** Marketplace
**Related Epics:** [Epic 3: Marketplace & Search](../../../prd/epic-3.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 3.7: Saved Searches & Alerts](../../../prd/epic-3.md#story-37-saved-searches--alerts)

## Technical Strategy (The "How")

**PostgreSQL Native Search:** Saved search alerts use the same PostgreSQL query builder as the main worker search engine. This ensures that saved search alerts match the exact same workers that appear in search results, maintaining consistency across the platform. All queries hit the database directly - there is no separate search index to sync.

**Migration Compatibility:** Existing saved searches created before the migration from Meilisearch to PostgreSQL native search continue to work without any data migration required. The saved search data model (`saved_searches` table) remains unchanged - only the query execution method changed from Meilisearch index queries to PostgreSQL native queries. All saved searches automatically use PostgreSQL native search when alerts are triggered, ensuring consistent behavior across all saved searches regardless of when they were created.

### Saved Search Data Model

**Schema Reference:** See [schema-marketplace.md](../../schema-marketplace.md) for complete table definition, indexes, constraints, and foreign keys:
- `saved_searches` - Saved search criteria with alert preferences

### Save Search Endpoint

**Implementation:**
```typescript
interface SearchCriteria {
  trade?: string;
  zipCode?: string;
  minRating?: number;
  minExperienceYears?: number;
  certifications?: string[];
  rateMin?: number;
  rateMax?: number;
  distanceRadius?: number;
  searchZipCode?: string;
  skills?: string[];
  availabilityDateRange?: {
    start: Date;
    end: Date;
  };
}

async function saveSearch(req: Request, res: Response) {
  const { searchCriteria, alertPreference, timezone } = req.body;
  const borrowerCompanyId = req.user.companyId;

  // Validate alert preference
  if (!['Daily_Digest', 'Instant'].includes(alertPreference)) {
    return res.status(400).json({ 
      error: 'Invalid alert preference',
      userHint: 'Alert preference must be Daily_Digest or Instant'
    });
  }

  // Save search
  const [savedSearch] = await db('saved_searches').insert({
    borrower_company_id: borrowerCompanyId,
    search_criteria: JSON.stringify(searchCriteria),
    alert_preference: alertPreference,
    timezone: timezone || 'America/Chicago',
    is_active: true,
    last_checked_at: new Date()
  }).returning('*');

  res.json({
    success: true,
    savedSearch: {
      id: savedSearch.id,
      searchCriteria: JSON.parse(savedSearch.search_criteria),
      alertPreference: savedSearch.alert_preference,
      timezone: savedSearch.timezone
    }
  });
}
```

### Instant Alert Trigger

**Worker Listing Event:**
```typescript
// Called when worker state changes to 'Listed'
// Uses the same PostgreSQL query builder as the main search engine for consistency
async function triggerInstantAlerts(workerId: string) {
  // Get all active instant alert saved searches
  const savedSearches = await db('saved_searches')
    .where({ alert_preference: 'Instant', is_active: true })
    .select('*');

  for (const savedSearch of savedSearches) {
    const criteria = JSON.parse(savedSearch.search_criteria);
    
    // Use the same PostgreSQL query builder as the main search engine
    // This ensures saved search alerts match the same workers that appear in search results
    // NOTE: buildPostgresSearchQuery is the EXACT same function used by the main worker search engine
    // (see Worker Search Engine Blueprint). This guarantees identical query logic, availability checks,
    // and filtering behavior between search results and saved search alerts.
    const query = buildPostgresSearchQuery(criteria, 1, 1);
    
    // Add filter to check if this specific worker matches
    query.where('u.id', workerId);
    
    const matchingWorkers = await query;
    
    if (matchingWorkers.length > 0) {
      // Worker matches criteria, send instant alert
      await sendSearchAlert(savedSearch, matchingWorkers[0], 'instant');
    }
  }
}
```

**Note:** The `buildPostgresSearchQuery` function is the same function used by the main worker search engine (see [Worker Search Engine Blueprint](./worker-search-engine.md)). This ensures that saved search alerts use the exact same query logic, including:
- PostgreSQL native text search with `pg_trgm`
- Real-time availability checks using `NOT EXISTS` clause against `bookings` table
- **Identical Blocking Statuses:** Saved search queries use the exact same blocking statuses as the main search engine: `'Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance'`. This ensures consistency - workers excluded from main search results are also excluded from saved search alerts.
- Geo search using `earthdistance` or `postgis`
- All filter criteria (trade, skills, ratings, experience, certifications, rates, distance, availability)

### Daily Digest Job

**Timezone-Aware Scheduling:**
```typescript
import { DateTime } from 'luxon';

// Run hourly, check if it's 5 AM in any user's timezone
async function processDailyDigests() {
  const now = DateTime.now().setZone('UTC');
  
  // Get all active daily digest saved searches
  const savedSearches = await db('saved_searches')
    .where({ alert_preference: 'Daily_Digest', is_active: true })
    .select('*');

  for (const savedSearch of savedSearches) {
    const userTime = now.setZone(savedSearch.timezone);
    const hour = userTime.hour;
    const minute = userTime.minute;

    // Check if it's 5 AM (within 1 hour window)
    if (hour === 5 && minute < 60) {
      // Check if we've already sent today
      const lastChecked = savedSearch.last_checked_at 
        ? DateTime.fromJSDate(savedSearch.last_checked_at).setZone(savedSearch.timezone)
        : null;

      const today = userTime.startOf('day');
      if (lastChecked && lastChecked >= today) {
        continue; // Already sent today
      }

      // Find new workers matching criteria
      const newWorkers = await findNewWorkersForSearch(savedSearch);

      if (newWorkers.length > 0) {
        // Send daily digest
        await sendSearchAlert(savedSearch, newWorkers, 'daily_digest');
      }

      // Update last checked timestamp
      await db('saved_searches')
        .where({ id: savedSearch.id })
        .update({ last_checked_at: new Date() });
    }
  }
}

async function findNewWorkersForSearch(savedSearch: any): Promise<any[]> {
  const criteria = JSON.parse(savedSearch.search_criteria);
  
  // Get workers listed since last check
  const lastChecked = savedSearch.last_checked_at || new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Build search query (similar to worker search engine)
  const query = buildSearchQuery(criteria);
  
  // Filter for workers listed after last check
  query.where('u.updated_at', '>', lastChecked)
    .where('u.user_state', 'Listed');

  const workers = await query;
  
  // Filter to only workers that match criteria
  const matchingWorkers = [];
  for (const worker of workers) {
    const matches = await checkWorkerMatchesCriteria(worker, criteria);
    if (matches) {
      matchingWorkers.push(worker);
    }
  }

  return matchingWorkers;
}
```

### Send Alert Function

**Alert Delivery:**
```typescript
async function sendSearchAlert(
  savedSearch: any, 
  workers: any | any[], 
  alertType: 'instant' | 'daily_digest'
) {
  const borrowerCompany = await db('companies')
    .where({ id: savedSearch.borrower_company_id })
    .first();

  // Get all active company members with Borrower context (Admin, Manager, Supervisor roles)
  // Workers do not receive saved search alerts (they cannot book workers)
  const borrowerMembers = await db('users as u')
    .innerJoin('company_members as cm', 'u.id', 'cm.user_id')
    .where('cm.company_id', savedSearch.borrower_company_id)
    .where('cm.status', 'Active')
    .whereRaw("cm.roles && ARRAY['Admin', 'Manager', 'Supervisor']::text[]")
    .select('u.*');

  if (borrowerMembers.length === 0) {
    return; // No authorized members to notify
  }

  const workersArray = Array.isArray(workers) ? workers : [workers];
  const baseUrl = process.env.FRONTEND_URL;

  // Send alerts to all authorized members (Admin, Manager, Supervisor roles)
  for (const member of borrowerMembers) {
    if (alertType === 'instant') {
      const worker = workersArray[0];
      const message = `New worker available: ${worker.trade} - ${worker.years_of_experience} Yrs Exp. View: ${baseUrl}/workers/${worker.id}`;
      
      // Send SMS
      if (member.mobile_number) {
        await sendSMS(member.mobile_number, message);
      }
      
      // Send Email
      if (member.email) {
        await sendEmail(member.email, 'New Worker Available - SmartBench', {
          workerName: `${worker.trade} - ${worker.years_of_experience} Yrs Exp`,
          workerLink: `${baseUrl}/workers/${worker.id}`,
          searchCriteria: JSON.parse(savedSearch.search_criteria)
        });
      }
    } else {
      // Daily digest
      const message = `Daily digest: ${workersArray.length} new workers match your saved search. View: ${baseUrl}/saved-searches/${savedSearch.id}`;
      
      // Send SMS
      if (member.mobile_number) {
        await sendSMS(member.mobile_number, message);
      }
      
      // Send Email
      if (member.email) {
        await sendEmail(member.email, 'Daily Worker Digest - SmartBench', {
          workerCount: workersArray.length,
          workers: workersArray.map(w => ({
            trade: w.trade,
            experience: w.years_of_experience,
            link: `${baseUrl}/workers/${w.id}`
          })),
          searchLink: `${baseUrl}/saved-searches/${savedSearch.id}`
        });
      }
    }
  }
}
```

### Manage Saved Searches

**Update/Delete:**
```typescript
async function updateSavedSearch(req: Request, res: Response) {
  const { searchId } = req.params;
  const { searchCriteria, alertPreference, isActive } = req.body;
  const borrowerCompanyId = req.user.companyId;

  const savedSearch = await db('saved_searches')
    .where({ id: searchId, borrower_company_id: borrowerCompanyId })
    .first();

  if (!savedSearch) {
    return res.status(404).json({ 
      error: 'Saved search not found',
      userHint: 'This saved search does not exist'
    });
  }

  const updates: any = { updated_at: new Date() };
  
  if (searchCriteria) {
    updates.search_criteria = JSON.stringify(searchCriteria);
  }
  if (alertPreference) {
    updates.alert_preference = alertPreference;
  }
  if (isActive !== undefined) {
    updates.is_active = isActive;
  }

  await db('saved_searches')
    .where({ id: searchId })
    .update(updates);

  res.json({ success: true });
}

async function deleteSavedSearch(req: Request, res: Response) {
  const { searchId } = req.params;
  const borrowerCompanyId = req.user.companyId;

  const deleted = await db('saved_searches')
    .where({ id: searchId, borrower_company_id: borrowerCompanyId })
    .delete();

  if (deleted === 0) {
    return res.status(404).json({ 
      error: 'Saved search not found',
      userHint: 'This saved search does not exist'
    });
  }

  res.json({ success: true });
}
```

## Edge Cases & Failure Handling

### Read Replica Lag Handling

**Scenario:** Saved search alerts execute while read replica lag is high
- **Strategy:** Saved search alerts should query the primary database (not replicas) to ensure accuracy. Since alerts are background jobs that run infrequently (instant alerts on worker listing events, daily digests once per day), the additional load on the primary database is minimal and ensures alerts reflect the most current worker availability.
- **Implementation:** The `buildPostgresSearchQuery` function used by saved search alerts should be configured to always query the primary database, bypassing replica routing logic. This ensures that:
  - Instant alerts triggered by worker listing events show workers that are actually available (not affected by replica lag)
  - Daily digest alerts reflect current worker availability and booking status
  - Alert accuracy is not compromised by replica lag scenarios
- **Cache Bypass:** Saved search alerts bypass the search result cache (`search:*`) and always query fresh data from the primary database. This ensures alerts reflect the most current worker availability without cache staleness. The cache is performance-only for main search queries - alerts prioritize accuracy over performance.
- **Performance Impact:** Minimal - saved search alerts are low-frequency operations (instant alerts only trigger on worker state changes, daily digests run once per day per saved search). The primary database can easily handle this additional query load.
- **Monitoring:** Track saved search alert query performance separately from main search queries. Alert if saved search alert queries exceed 1 second execution time.

### Timezone Conversions

**Scenario:** User in different timezone than server
- **Solution:** Use Luxon/DayJS for timezone-aware scheduling
- **Storage:** Store user's timezone in saved search
- **Calculation:** Convert server time to user's timezone for 5 AM check

### Notification Delivery Failures

**Scenario:** SMS/Email delivery fails
- **Solution:** Log failures, retry with exponential backoff
- **Fallback:** If SMS fails, send email (and vice versa)
- **Monitoring:** Track delivery success rates

### Duplicate Alerts

**Scenario:** Same worker triggers multiple alerts
- **Solution:** Track last notified worker IDs per saved search
- **Deduplication:** Only send alert for workers not previously notified
- **Reset:** Clear notification history when search criteria changes

### Large Daily Digests

**Scenario:** Many workers match criteria (100+)
- **Solution:** Limit daily digest to top 20 workers (by rating/relevance)
- **UX:** Include "View all results" link in email
- **Performance:** Paginate worker matching to avoid timeouts

### Saved Search Criteria Match But Availability Check Fails

**Scenario:** Saved search criteria match a worker, but the worker is not available for the requested date range
- **Behavior:** Saved search alerts use the same PostgreSQL query builder as the main search engine, which includes real-time availability checks via `NOT EXISTS` clause against the `bookings` table. If a worker matches all search criteria (trade, skills, ratings, etc.) but is not available for the requested date range (has conflicting bookings), the worker will NOT appear in the alert results.
- **Implementation:** The `buildPostgresSearchQuery` function used by saved search alerts includes the same availability check as the main search engine. Workers with bookings in blocking statuses (`Confirmed`, `Active`, `Pending_Payment`, `Payment_Paused_Dispute`, `Suspended_Insurance`) during the requested date range are automatically excluded from alert results.
- **User Experience:** Users only receive alerts for workers that are both matching their criteria AND available for the requested dates. This ensures alerts are actionable - users can immediately book workers from alerts without discovering they are unavailable.
- **Edge Case:** If a worker becomes unavailable between when the alert query executes and when the user views the alert, the worker may still appear in the alert email but will be unavailable when the user attempts to book. This is acceptable because: (1) The final availability check at checkout will prevent double-booking, (2) The time window between alert generation and user action is typically short (minutes to hours), (3) The alternative (excluding workers that might become unavailable) would result in many false negatives (workers excluded from alerts even though they remain available).

### Saved Searches with Invalid Criteria

**Scenario:** Saved search contains invalid criteria (e.g., deleted zip code, invalid trade name)
- **Handling:** When saved search alert executes with invalid criteria:
  - **Invalid Zip Code:** If the zip code in search criteria no longer exists in the `zip_codes` table, geo search will return no results. The alert query will execute successfully but return zero workers. No error is returned - the alert simply contains no workers.
  - **Invalid Trade Name:** If the trade name in search criteria doesn't match any workers, the alert query will return zero workers. No error is returned.
  - **Invalid Date Range:** If the availability date range is in the past or invalid, the query will execute but return zero workers (no workers available for past dates).
- **User Experience:** Users receive alerts with zero workers when criteria don't match any available workers. The alert email should indicate "No new workers match your saved search criteria" rather than showing an empty list.
- **Cleanup:** Consider implementing a cleanup job that deactivates saved searches that consistently return zero results over a period of time (e.g., 30 days), or prompts users to update their search criteria.
- **Validation:** When users create or update saved searches, validate criteria on the server side:
  - Verify zip code exists in `zip_codes` table
  - Verify trade name is valid (if trade filter is specified)
  - Verify date ranges are in the future (if availability date range is specified)
  - Return validation errors to users before saving invalid criteria

### Saved Search Alert Query Failures

**Scenario:** Saved search alert query fails due to database errors, extension unavailability, or other system issues
- **Error Handling:** 
  - **Database Errors:** Log error with saved search ID, criteria, and error details. Do not send alert to user. Retry alert execution after a delay (exponential backoff, max 3 retries).
  - **Extension Unavailability:** If PostgreSQL extensions are unavailable when alert executes, log error and skip alert. Do not send partial/incomplete alerts to users. Alert operations team about extension unavailability.
  - **Partial Extension Failure:** If geo extension (`earthdistance`/`postgis`) is unavailable but text extension (`pg_trgm`) is available, saved search alerts should use degraded text-only search mode. Alerts can still match workers based on text criteria (trade, skills), but distance filtering is disabled. If text extension is unavailable, skip alert (text search is required for most searches).
  - **Query Timeout:** If alert query exceeds timeout (5 seconds), log timeout error and skip alert. Do not send incomplete alerts to users.
- **Retry Logic:** 
  - **Instant Alerts:** If instant alert query fails, retry once after 30 seconds. If retry fails, log error and skip alert (do not send to user).
  - **Daily Digests:** If daily digest query fails, retry once after 5 minutes. If retry fails, log error and skip digest for that day. User will receive next day's digest if query succeeds.
- **Monitoring:** Track saved search alert failure rates:
  - Alert query failure rate (target: < 1%)
  - Alert query timeout rate (target: < 0.5%)
  - Alert delivery failure rate (SMS/email delivery failures)
- **User Notification:** Users are NOT notified when alert queries fail - failed alerts are silently skipped. Users will receive alerts on subsequent successful executions (next instant alert trigger or next day's digest).

## 4. Alert Status Visibility

**Purpose:** Allow users to view and manage saved search alert status, including alert history and failure visibility.

**Alert Status Indicators:**

**Status Calculation:**
- **Active:** Alert sent successfully within last 7 days
- **Warning:** No successful alert in 7+ days (may indicate failure)
- **Failed:** Last alert attempt resulted in error

**Status Display:**
- **Active Status:**
  - Badge: Green "Active" badge
  - Display: "Last sent: [date] [time]"
  - Visual: Green checkmark icon (✓)
- **Warning Status (No alerts in 7+ days):**
  - Badge: Yellow "Warning" badge
  - Message: "Warning: No alerts sent in 7+ days. Alert may have failed."
  - Visual: Yellow warning icon (⚠️)
  - Action: "Test Alert" button highlighted
- **Failed Status:**
  - Badge: Red "Failed" badge
  - Display: "Failed: [date] [time]"
  - Visual: Red error icon (✗)
  - Action: "View History" button to see failure details

**Alert History:**

**History Entry Display:**
- **Success Entry:**
  - Green checkmark (✓)
  - "Success - [X] workers found"
  - Date and time
- **Failed Entry:**
  - Red X (✗)
  - "Failed - Error: [error message]"
  - Date and time
- **Chronological Order:** Most recent first
- **Retention:** Show last 30 days of history

**Test Alert Functionality:**

**Manual Test Alert:**
- **Trigger:** Manual "Test Alert" button on saved search card
- **Action:** Immediately sends test alert email/notification
- **Loading State:** Button shows spinner during test
- **Success:** Toast notification: "Test alert sent successfully. Check your email."
- **Failure:** Toast notification: "Test alert failed. [Error message]"
- **Purpose:** Verify alert functionality without waiting for scheduled run

**User Preferences (Optional):**
- **Alert Failure Notifications:** User preference to receive notifications when alerts fail
- **Notification Frequency:** Daily digest vs. immediate notification
- **Settings Location:** User settings → Notifications → Alert Failure Notifications

**Implementation Notes:**
- Alert status calculated from `saved_searches.last_checked_at` and alert history
- Alert history stored in separate table or log aggregation service
- Status visibility UI implemented in frontend (see [Front-End Specification](../../../ux/front-end-specification.md#22-saved-search-alert-status-ui))

## 5. Data Model Impact

### Tables Modified/Created

**Schema Reference:** See [schema-marketplace.md](../../schema-marketplace.md) for complete table definitions, indexes, constraints, and foreign keys:
- `saved_searches` - Saved search criteria with alert preferences

### Scheduled Jobs

**Inngest Schedule:**
- **Instant Alerts:** Triggered on worker state change events (asynchronous)
- **Daily Digest:** Inngest Cron Trigger runs hourly, checks if 5:00 AM in user's timezone (timezone-aware scheduling)

**Related Documentation:** For complete background job specifications including schedules, failure handling, retry logic, and monitoring, see [Background Jobs Blueprint](../system/background-jobs.md#3-saved-search-alerts).

### Performance Considerations

1. **Worker Matching:** Cache worker profiles for faster matching
2. **Batch Processing:** Process saved searches in batches to avoid timeouts
   - **Batch Size Limits:** Process saved searches in batches of 50 to reduce impact of batch failures
   - **Batch Processing Failure Handling:** If batch processing fails partway through (some alerts sent, others failed):
     - **Idempotency:** Use saved search ID + timestamp as idempotency key to prevent duplicate alerts if batch is retried
     - **Partial Batch Retry:** Retry only failed alerts individually (not entire batch) to avoid duplicate alerts for successfully sent alerts
     - **Tracking:** Track which alerts in the batch were successfully sent and which failed for monitoring and recovery
   - **Monitoring:** Track batch processing failure rates (target: < 1% failure rate)
3. **Notification Queue:** Use message queue (e.g., Bull, RabbitMQ) for reliable delivery
4. **Rate Limiting:** Limit notification frequency to prevent spam
