# Timezone Handling

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Comprehensive guide to timezone handling across the SmartBench platform. This document specifies implementation details, libraries, conversion patterns, and best practices for all timezone-related operations.

**Related Documentation:**
- [Schema - Booking Domain](./schema-booking.md) - Project timezone field definition
- [Data Dictionary - Booking Domain](./data-dictionary-booking.md) - Business rules for timezone authority
- [Epic 4: Booking Creation](../prd/epic-4.md) - Timezone handling in booking workflow
- [Availability Management Blueprint](./blueprints/marketplace/availability-management.md) - Timezone handling for availability matching
- [Weekly Payments Blueprint](./blueprints/booking/weekly-payments.md) - Timezone handling for payment timing

---

## Core Principles

### 1. Project Timezone is Authoritative

**Rule:** The project's timezone is the authoritative source for all booking-related times and calculations.

- All shift start/end times are stored and calculated in the project's timezone
- All time-based business logic (payment timing, verification windows, etc.) uses the project's timezone
- Worker availability patterns may be set in any timezone, but when matched to a booking, times are converted to project timezone

**Rationale:** Bookings are tied to physical project locations. The project's local timezone is the most relevant reference point for scheduling, work hours, and business day calculations.

### 2. UTC Storage, Timezone-Aware Calculations

**Rule:** All timestamps are stored in UTC in the database, but all business logic calculations use timezone-aware operations.

- Database storage: All `TIMESTAMP` fields store UTC values
- Business logic: All calculations use timezone-aware libraries with explicit timezone context
- Display: Times are converted to user's preferred timezone for display only

### 3. Display Conversion with Context

**Rule:** Times are displayed in the user's preferred timezone, but always show project timezone for context.

- Primary display: User's preferred timezone (from `user_preferences.timezone` or company default)
- Context display: Project timezone shown alongside (e.g., "7:00 AM (Your Time) / 6:00 AM (Project Time - CST)")
- Fallback: If user preference not set, use company default; if company default not set, use project timezone

---

## Implementation Details

### Library Selection

**Primary Library: Luxon**

**Primary Library:** [Luxon (JavaScript/TypeScript)

**Rationale:**
- Built on native `Intl` API - better performance and smaller bundle size than Moment.js
- Immutable API - prevents accidental mutation bugs
- Excellent timezone support with IANA timezone database
- TypeScript-first design with excellent type definitions
- Active maintenance and modern JavaScript patterns

**Installation:**
```bash
npm install luxon
npm install --save-dev @types/luxon  # If using TypeScript
```

**Alternative (if needed):** Day.js with timezone plugin
- Use only if bundle size is critical concern
- Day.js is smaller but has less comprehensive timezone features
- If using Day.js, install: `npm install dayjs` and `npm install dayjs/plugin/timezone`

**Recommendation:** Use Luxon for all new code. Only consider Day.js if bundle size analysis shows significant impact.

### Timezone Database

**Source:** IANA Timezone Database (via Luxon/Intl)

- Automatically includes all IANA timezone identifiers (e.g., `America/Chicago`, `America/New_York`)
- Handles DST transitions automatically
- Updated with system/browser timezone database updates

**Common Timezones:**
- `America/Chicago` - Central Time (CST/CDT)
- `America/New_York` - Eastern Time (EST/EDT)
- `America/Denver` - Mountain Time (MST/MDT)
- `America/Los_Angeles` - Pacific Time (PST/PDT)
- `America/Phoenix` - Mountain Standard Time (no DST)
- `UTC` - Coordinated Universal Time

---

## Conversion Patterns

### Pattern 1: Storing UTC Timestamps

**When:** Saving times to database

```typescript
import { DateTime } from 'luxon';

// User input: "2026-01-15 08:00" in project timezone (America/Chicago)
const projectTimezone = 'America/Chicago';
const localTime = '2026-01-15T08:00:00';

// Convert to UTC for storage
const utcDateTime = DateTime.fromISO(localTime, { zone: projectTimezone })
  .toUTC();

// Store in database
await db('bookings').insert({
  start_date: utcDateTime.toJSDate(),  // PostgreSQL TIMESTAMP
  // ... other fields
});
```

### Pattern 2: Retrieving and Converting for Display

**When:** Displaying times to users

```typescript
import { DateTime } from 'luxon';

// Retrieve UTC timestamp from database
const booking = await db('bookings').where('id', bookingId).first();
const project = await db('projects').where('id', booking.project_id).first();

// Get user's preferred timezone (from user_preferences or company default)
const userTimezone = getUserPreferredTimezone(userId);

// Convert UTC to project timezone for business logic
const projectTime = DateTime.fromJSDate(booking.start_date, { zone: 'UTC' })
  .setZone(project.timezone);

// Convert to user's timezone for display
const userTime = DateTime.fromJSDate(booking.start_date, { zone: 'UTC' })
  .setZone(userTimezone);

// Display format
const displayText = `${userTime.toFormat('h:mm a')} (Your Time) / ${projectTime.toFormat('h:mm a')} (Project Time - ${getTimezoneAbbreviation(project.timezone)})`;
```

### Pattern 3: Business Logic Calculations

**When:** Performing time-based calculations (payment timing, verification windows, etc.)

```typescript
import { DateTime } from 'luxon';

// Always use project timezone for calculations
const project = await db('projects').where('id', projectId).first();
const now = DateTime.now().setZone(project.timezone);

// Example: Check if it's 10 AM Wednesday in project timezone
const isWednesday10AM = now.weekday === 3 && now.hour === 10 && now.minute === 0;

// Example: Calculate business days (excluding weekends and holidays)
function addBusinessDays(date: DateTime, days: number, projectTimezone: string): DateTime {
  let current = date.setZone(projectTimezone);
  let added = 0;
  
  while (added < days) {
    current = current.plus({ days: 1 });
    
    // Skip weekends
    if (current.weekday <= 5) {  // Monday = 1, Friday = 5
      // Check if holiday (query holiday_calendar table)
      const isHoliday = await isHoliday(current.toISODate(), project.jurisdiction_id);
      if (!isHoliday) {
        added++;
      }
    }
  }
  
  return current;
}
```

### Pattern 4: Availability Matching

**When:** Matching worker availability to booking requests

```typescript
import { DateTime } from 'luxon';

// Worker availability set in worker's timezone
const availabilityTimezone = 'America/New_York';  // Worker's timezone
const availabilityStart = DateTime.fromISO('2026-01-15T07:00:00', { 
  zone: availabilityTimezone 
});

// Booking request in project timezone
const projectTimezone = 'America/Chicago';  // Project timezone
const bookingStart = DateTime.fromISO('2026-01-15T06:00:00', { 
  zone: projectTimezone 
});

// Convert availability to project timezone for comparison
const availabilityInProjectTz = availabilityStart.setZone(projectTimezone);

// Now compare (both in project timezone)
const matches = availabilityInProjectTz.hour === bookingStart.hour &&
                availabilityInProjectTz.minute === bookingStart.minute;
```

---

## DST (Daylight Saving Time) Handling

### Automatic DST Handling

**Luxon handles DST automatically** - no manual intervention needed.

**Key Behaviors:**
- Spring forward (2 AM → 3 AM): One hour is "lost" - handled automatically
- Fall back (2 AM → 1 AM): One hour is "repeated" - handled automatically
- Shift durations remain consistent - a 8-hour shift is always 8 hours regardless of DST transitions

**Example:**
```typescript
import { DateTime } from 'luxon';

// DST transition: March 10, 2026 (spring forward)
const beforeDST = DateTime.fromISO('2026-03-10T01:30:00', { zone: 'America/Chicago' });
const afterDST = DateTime.fromISO('2026-03-10T03:30:00', { zone: 'America/Chicago' });

// Duration calculation handles DST automatically
const duration = afterDST.diff(beforeDST, 'hours').hours;  // Returns 1 (not 2)
// The "lost" hour during DST transition is handled correctly
```

### DST Transition Edge Cases

While Luxon handles DST automatically, it's important to understand how shifts and business logic behave during DST transitions. The following examples demonstrate real-world scenarios.

#### Shift Spanning Spring Forward (2 AM → 3 AM)

**Scenario:** A shift starts before DST transition and ends after the "lost" hour.

**Example:**
- **Project Timezone:** `America/Chicago` (CST/CDT)
- **DST Transition:** Sunday, March 10, 2026 at 2:00 AM (spring forward to 3:00 AM)
- **Shift Start:** Sunday, March 10, 2026, 1:00 AM CST
- **Shift End:** Sunday, March 10, 2026, 7:00 AM CDT

**Calculation:**
```typescript
import { DateTime } from 'luxon';

const projectTimezone = 'America/Chicago';

// Shift start: 1:00 AM CST (before DST transition)
const shiftStart = DateTime.fromISO('2026-03-10T01:00:00', { zone: projectTimezone });

// Shift end: 7:00 AM CDT (after DST transition)
const shiftEnd = DateTime.fromISO('2026-03-10T07:00:00', { zone: projectTimezone });

// Calculate duration - Luxon automatically accounts for the "lost" hour
const duration = shiftEnd.diff(shiftStart, 'hours').hours;  // Returns 6 (not 5 or 7)

// The shift duration is 6 hours, even though the clock "jumps" from 2 AM to 3 AM
// Luxon calculates the actual elapsed time correctly
```

**Key Points:**
- Shift duration remains correct: 6 hours (1:00 AM to 7:00 AM)
- The "lost" hour (2:00 AM) is automatically handled by Luxon
- No manual adjustment needed - duration calculation accounts for DST transition
- Worker is paid for 6 hours of work, not 5 or 7

**Related:** See [Epic 6: Refund Logic](../prd/epic-6.md#story-64-refund-logic-stripe-native-processing) for refund calculation examples including week boundary scenarios.

#### Shift Spanning Fall Back (2 AM → 1 AM)

**Scenario:** A shift starts before DST transition and ends after the "repeated" hour.

**Example:**
- **Project Timezone:** `America/Chicago` (CST/CDT)
- **DST Transition:** Sunday, November 3, 2026 at 2:00 AM (fall back to 1:00 AM)
- **Shift Start:** Sunday, November 3, 2026, 1:00 AM CDT
- **Shift End:** Sunday, November 3, 2026, 7:00 AM CST

**Calculation:**
```typescript
import { DateTime } from 'luxon';

const projectTimezone = 'America/Chicago';

// Shift start: 1:00 AM CDT (before DST transition, first occurrence)
const shiftStart = DateTime.fromISO('2026-11-03T01:00:00', { zone: projectTimezone });

// Shift end: 7:00 AM CST (after DST transition)
const shiftEnd = DateTime.fromISO('2026-11-03T07:00:00', { zone: projectTimezone });

// Calculate duration - Luxon automatically accounts for the "repeated" hour
const duration = shiftEnd.diff(shiftStart, 'hours').hours;  // Returns 6 (not 7 or 5)

// The shift duration is 6 hours, even though 1:00 AM occurs twice
// Luxon calculates the actual elapsed time correctly
```

**Key Points:**
- Shift duration remains correct: 6 hours (1:00 AM to 7:00 AM)
- The "repeated" hour (1:00 AM occurs twice) is automatically handled by Luxon
- No manual adjustment needed - duration calculation accounts for DST transition
- Worker is paid for 6 hours of work, not 7 or 5

#### Shift Starting Exactly at DST Transition

**Edge Case 1: Spring Forward (2 AM doesn't exist)**

**Scenario:** A shift is scheduled to start at 2:00 AM during spring forward transition.

**Behavior:**
- 2:00 AM CST doesn't exist on the DST transition date (it becomes 3:00 AM CDT)
- Luxon automatically resolves this to 3:00 AM CDT
- If a shift is scheduled for 2:00 AM on the transition date, it will start at 3:00 AM

**Example:**
```typescript
import { DateTime } from 'luxon';

const projectTimezone = 'America/Chicago';

// Attempting to create a time at 2:00 AM during spring forward
// March 10, 2026: 2:00 AM CST doesn't exist (springs forward to 3:00 AM CDT)
const shiftStart = DateTime.fromISO('2026-03-10T02:00:00', { zone: projectTimezone });

// Luxon automatically resolves to 3:00 AM CDT
console.log(shiftStart.hour);  // Returns 3 (not 2)
console.log(shiftStart.zoneName);  // Returns 'America/Chicago' (CDT offset)
```

**Recommendation:** Avoid scheduling shifts at exactly 2:00 AM on DST transition dates. Schedule at 1:00 AM or 3:00 AM instead.

**Edge Case 2: Fall Back (2 AM occurs twice)**

**Scenario:** A shift is scheduled to start at 2:00 AM during fall back transition.

**Behavior:**
- 2:00 AM occurs twice: once as 2:00 AM CDT (before transition) and once as 2:00 AM CST (after transition)
- Luxon defaults to the first occurrence (2:00 AM CDT)
- To specify the second occurrence, use `DateTime.fromISO()` with explicit offset or use `plus()` method

**Example:**
```typescript
import { DateTime } from 'luxon';

const projectTimezone = 'America/Chicago';

// November 3, 2026: 2:00 AM occurs twice
// First occurrence: 2:00 AM CDT (before fall back)
const first2AM = DateTime.fromISO('2026-11-03T02:00:00', { zone: projectTimezone });
console.log(first2AM.offsetNameShort);  // Returns 'CDT'

// Second occurrence: 2:00 AM CST (after fall back)
// Need to explicitly create by adding 1 hour to the first occurrence
const second2AM = first2AM.plus({ hours: 1 });
console.log(second2AM.offsetNameShort);  // Returns 'CST'
console.log(second2AM.hour);  // Still 2 (but now CST)
```

**Recommendation:** Avoid scheduling shifts at exactly 2:00 AM on DST transition dates. Schedule at 1:00 AM or 3:00 AM instead. If scheduling at 2:00 AM is necessary, explicitly specify which occurrence (first or second).

#### Weekly Payment Triggers During DST

**Scenario:** Weekly payment processing runs at 10:00 AM Wednesday in each project's local time. How does DST affect this?

**Answer:** DST does not affect weekly payment triggers. The trigger time (10:00 AM Wednesday) remains consistent in the project's local timezone, regardless of DST transitions.

**How It Works:**
- The cron job checks the project's local time (in project timezone) every hour
- 10:00 AM CST = 10:00 AM CDT (same local time, different UTC offset)
- Luxon automatically handles the timezone offset change during DST transitions
- The trigger fires at 10:00 AM local time, whether it's CST or CDT

**Example:**
```typescript
import { DateTime } from 'luxon';

// During DST transition week (March 10, 2026 - spring forward)
const projectTimezone = 'America/Chicago';

// Wednesday, March 6, 2026 at 10:00 AM (before DST, CST)
const beforeDST = DateTime.fromISO('2026-03-06T10:00:00', { zone: projectTimezone });
console.log(beforeDST.offsetNameShort);  // Returns 'CST'
console.log(beforeDST.hour);  // Returns 10

// Wednesday, March 13, 2026 at 10:00 AM (after DST, CDT)
const afterDST = DateTime.fromISO('2026-03-13T10:00:00', { zone: projectTimezone });
console.log(afterDST.offsetNameShort);  // Returns 'CDT'
console.log(afterDST.hour);  // Returns 10

// Both are 10:00 AM in project timezone - trigger logic works the same
// The cron job checks: projectTime.hour === 10 && projectTime.weekday === 3
// This condition is true for both dates, regardless of DST
```

**Cron Implementation:**
```typescript
// Inngest cron: Runs every hour
export const weeklyPaymentCron = inngest.createFunction(
  { id: 'weekly-payment-cron' },
  { cron: '0 * * * *' },  // Every hour
  async ({ step }) => {
    const projects = await getActiveWeeklyProgressProjects();
    
    for (const project of projects) {
      // Check if it's 10 AM Wednesday in project's timezone
      // This works correctly during DST transitions because:
      // - Luxon handles timezone offset changes automatically
      // - 10 AM CST = 10 AM CDT (same local time)
      const projectTime = DateTime.now().setZone(project.timezone);
      
      if (projectTime.weekday === 3 && projectTime.hour === 10 && projectTime.minute === 0) {
        // Trigger weekly payment for this project
        // This fires at 10 AM local time, whether CST or CDT
        await processWeeklyPayment(project.id);
      }
    }
  }
);
```

**Key Points:**
- Weekly payment triggers are unaffected by DST transitions
- The trigger time (10:00 AM Wednesday) remains consistent in project timezone
- Luxon automatically handles timezone offset changes
- No special handling needed for DST transition weeks

**Related:** See [Weekly Payments Blueprint](./blueprints/booking/weekly-payments.md#timezone-edge-cases) for additional DST handling details.

#### Auto-Approval Timer During DST Transitions

**Scenario:** Auto-approval occurs exactly 4 hours after clock-out. How does DST affect this calculation?

**Answer:** DST does not affect the auto-approval timer calculation because the system uses UTC timestamps for all calculations.

**How It Works:**
- Clock-out time is stored as UTC timestamp in the database
- Auto-approval timer = `clock_out_utc + 4 hours` (UTC calculation)
- The 4-hour interval is always exactly 4 hours in UTC, regardless of DST transitions
- Display times are converted to project timezone for user viewing, but calculations use UTC internally

**Example:**
```typescript
import { DateTime } from 'luxon';

// Worker clocks out at 1:00 AM on DST fall back day (November 3, 2026)
// In project timezone (America/Chicago), 1:00 AM occurs twice:
// - First occurrence: 1:00 AM CDT (before fall back)
// - Second occurrence: 1:00 AM CST (after fall back)

const projectTimezone = 'America/Chicago';

// Clock-out stored as UTC (assuming first occurrence at 1:00 AM CDT)
const clockOutUTC = DateTime.fromISO('2026-11-03T06:00:00Z', { zone: 'UTC' });
// 1:00 AM CDT = 6:00 AM UTC

// Auto-approval timer: 4 hours later in UTC
const autoApprovalUTC = clockOutUTC.plus({ hours: 4 });
// 10:00 AM UTC = 4:00 AM CST (after fall back)

// Display in project timezone for user
const autoApprovalProjectTime = autoApprovalUTC.setZone(projectTimezone);
console.log(autoApprovalProjectTime.toFormat('h:mm a'));  // "4:00 AM"
console.log(autoApprovalProjectTime.offsetNameShort);  // "CST"

// The calculation is always exactly 4 hours in UTC, regardless of DST
const duration = autoApprovalUTC.diff(clockOutUTC, 'hours').hours;
console.log(duration);  // Always 4 (not affected by DST)
```

**Key Points:**
- Auto-approval timer uses UTC for all calculations (stored in database)
- DST transitions do not affect the 4-hour calculation (always exactly 4 hours in UTC)
- Display times are converted to project timezone for user viewing only
- This ensures consistent timer behavior regardless of DST transitions

**Rationale:** Using UTC for calculations eliminates edge cases where DST "fall back" or "spring forward" could affect timer accuracy. For example, if a worker clocks out at 1:00 AM on the day DST ends (clock "falls back" to 1:00 AM again), using project timezone could create ambiguity about which 1:00 AM was intended. Using UTC ensures the timer always fires exactly 4 hours after the actual clock-out time, regardless of DST transitions.

**Related:** See [Epic 6: Direct Stripe Payout Processing](../prd/epic-6.md#story-61-direct-stripe-payout-processing) for complete auto-approval timer specifications.

### Best Practices for DST

1. **Never manually adjust for DST** - Let Luxon handle it
2. **Use IANA timezone identifiers** - Never use abbreviations (CST/EST) which are ambiguous
3. **Test DST transitions** - Include test cases for spring forward and fall back dates
4. **Document DST-sensitive operations** - Note any operations that might be affected by DST

---

## Edge Cases & Special Scenarios

### Multi-Timezone Bookings

**Scenario:** Worker travels from one timezone to another during booking period.

**Solution:** Project timezone remains authoritative. All shift times are in project timezone. Worker's location changes don't affect booking times.

**Example:**
- Project: Minneapolis, MN (America/Chicago - CST)
- Worker: Starts in Milwaukee, WI (America/Chicago - CST), travels to New York, NY (America/New_York - EST)
- Booking: 7:00 AM - 3:00 PM in project timezone (CST)
- Worker sees: 7:00 AM - 3:00 PM (Your Time) / 7:00 AM - 3:00 PM (Project Time - CST) when in WI
- Worker sees: 8:00 AM - 4:00 PM (Your Time) / 7:00 AM - 3:00 PM (Project Time - CST) when in NY
- Underlying booking times: Always 7:00 AM - 3:00 PM CST

### Server Timezone Independence

**Rule:** Server timezone is irrelevant for all business logic.

- All calculations use explicit timezone context (project timezone)
- Never rely on server's local timezone
- Always specify timezone explicitly in Luxon operations

**Anti-Pattern (Don't Do This):**
```typescript
// ❌ BAD: Relies on server timezone
const now = new Date();
const localTime = now.toLocaleString();
```

**Correct Pattern:**
```typescript
// ✅ GOOD: Explicit timezone
const project = await getProject(projectId);
const now = DateTime.now().setZone(project.timezone);
```

### Scheduled Jobs (Inngest Cron Triggers)

**Scenario:** Weekly payment processing runs at 10 AM Wednesday in each project's local time.

**Solution:** Inngest cron runs hourly, checks each project's local time.

```typescript
// Inngest cron: Runs every hour
export const weeklyPaymentCron = inngest.createFunction(
  { id: 'weekly-payment-cron' },
  { cron: '0 * * * *' },  // Every hour
  async ({ step }) => {
    // Get all active projects with weekly progress payments
    const projects = await getActiveWeeklyProgressProjects();
    
    for (const project of projects) {
      // Check if it's 10 AM Wednesday in project's timezone
      const projectTime = DateTime.now().setZone(project.timezone);
      
      if (projectTime.weekday === 3 && projectTime.hour === 10 && projectTime.minute === 0) {
        // Trigger weekly payment for this project
        await processWeeklyPayment(project.id);
      }
    }
  }
);
```

---

## Testing Timezone Handling

### Test Cases to Include

1. **Basic conversion:** UTC → Project timezone → User timezone
2. **DST spring forward:** Test dates during spring DST transition
3. **DST fall back:** Test dates during fall DST transition
4. **Shift duration during spring forward:** Verify shift duration calculation when shift spans DST spring forward (2 AM → 3 AM)
5. **Shift duration during fall back:** Verify shift duration calculation when shift spans DST fall back (2 AM → 1 AM)
6. **Shift at non-existent 2 AM:** Test behavior when shift is scheduled at 2:00 AM during spring forward
7. **Weekly payment trigger during DST:** Verify weekly payment triggers work correctly during DST transition weeks
8. **Multi-timezone booking:** Worker in different timezone than project
9. **Business day calculations:** Verify holidays and weekends excluded correctly
10. **Scheduled jobs:** Verify cron triggers at correct local times
11. **Availability matching:** Worker availability in different timezone than project

### Example Test

```typescript
import { DateTime } from 'luxon';
import { describe, it, expect } from 'vitest';

describe('Timezone Handling', () => {
  it('converts UTC to project timezone correctly', () => {
    const utcTime = DateTime.fromISO('2026-01-15T14:00:00Z', { zone: 'UTC' });
    const projectTime = utcTime.setZone('America/Chicago');
    
    expect(projectTime.hour).toBe(8);  // 14:00 UTC = 08:00 CST
    expect(projectTime.zoneName).toBe('America/Chicago');
  });
  
  it('handles DST spring forward correctly', () => {
    // March 10, 2026: Spring forward (2 AM → 3 AM)
    const beforeDST = DateTime.fromISO('2026-03-10T07:00:00Z', { zone: 'UTC' })
      .setZone('America/Chicago');
    const afterDST = DateTime.fromISO('2026-03-10T08:00:00Z', { zone: 'UTC' })
      .setZone('America/Chicago');
    
    // Both should be 1:00 AM local time (before DST) and 2:00 AM local time (after DST)
    // The "lost" hour is handled automatically
    expect(beforeDST.hour).toBe(1);
    expect(afterDST.hour).toBe(3);  // Skipped 2 AM due to DST
  });
  
  it('calculates shift duration correctly during spring forward', () => {
    // Shift spanning DST spring forward: 1:00 AM CST to 7:00 AM CDT
    const projectTimezone = 'America/Chicago';
    const shiftStart = DateTime.fromISO('2026-03-10T01:00:00', { zone: projectTimezone });
    const shiftEnd = DateTime.fromISO('2026-03-10T07:00:00', { zone: projectTimezone });
    
    // Duration should be 6 hours, not 5 or 7
    const duration = shiftEnd.diff(shiftStart, 'hours').hours;
    expect(duration).toBe(6);
    
    // Verify the "lost" hour is handled correctly
    expect(shiftStart.offsetNameShort).toBe('CST');
    expect(shiftEnd.offsetNameShort).toBe('CDT');
  });
  
  it('calculates shift duration correctly during fall back', () => {
    // Shift spanning DST fall back: 1:00 AM CDT to 7:00 AM CST
    const projectTimezone = 'America/Chicago';
    const shiftStart = DateTime.fromISO('2026-11-03T01:00:00', { zone: projectTimezone });
    const shiftEnd = DateTime.fromISO('2026-11-03T07:00:00', { zone: projectTimezone });
    
    // Duration should be 6 hours, not 7 or 5
    const duration = shiftEnd.diff(shiftStart, 'hours').hours;
    expect(duration).toBe(6);
    
    // Verify the "repeated" hour is handled correctly
    expect(shiftStart.offsetNameShort).toBe('CDT');
    expect(shiftEnd.offsetNameShort).toBe('CST');
  });
  
  it('handles shift scheduled at non-existent 2 AM during spring forward', () => {
    // Attempting to create 2:00 AM during spring forward
    const projectTimezone = 'America/Chicago';
    const shiftStart = DateTime.fromISO('2026-03-10T02:00:00', { zone: projectTimezone });
    
    // Luxon should automatically resolve to 3:00 AM CDT
    expect(shiftStart.hour).toBe(3);
    expect(shiftStart.offsetNameShort).toBe('CDT');
  });
  
  it('handles weekly payment trigger during DST transition week', () => {
    const projectTimezone = 'America/Chicago';
    
    // Wednesday before DST (March 6, 2026 at 10:00 AM CST)
    const beforeDST = DateTime.fromISO('2026-03-06T10:00:00', { zone: projectTimezone });
    expect(beforeDST.weekday).toBe(3);  // Wednesday
    expect(beforeDST.hour).toBe(10);
    expect(beforeDST.offsetNameShort).toBe('CST');
    
    // Wednesday after DST (March 13, 2026 at 10:00 AM CDT)
    const afterDST = DateTime.fromISO('2026-03-13T10:00:00', { zone: projectTimezone });
    expect(afterDST.weekday).toBe(3);  // Wednesday
    expect(afterDST.hour).toBe(10);
    expect(afterDST.offsetNameShort).toBe('CDT');
    
    // Both should trigger weekly payment (same local time, different UTC offset)
    const shouldTrigger = (dt: DateTime) => 
      dt.weekday === 3 && dt.hour === 10 && dt.minute === 0;
    
    expect(shouldTrigger(beforeDST)).toBe(true);
    expect(shouldTrigger(afterDST)).toBe(true);
  });
});
```

---

## Common Pitfalls to Avoid

1. **❌ Using Date objects without timezone context**
   - Always use Luxon DateTime with explicit timezone

2. **❌ Storing timezone abbreviations (CST/EST)**
   - Always store IANA timezone identifiers (America/Chicago)

3. **❌ Relying on server timezone**
   - Always use project timezone for business logic

4. **❌ Manual DST adjustments**
   - Let Luxon handle DST automatically

5. **❌ Mixing timezone libraries**
   - Use Luxon consistently across the codebase

6. **❌ Not showing project timezone in UI**
   - Always show both user time and project time for context

---

## Migration Notes

### If Migrating from Moment.js

1. Replace `moment()` with `DateTime.now()`
2. Replace `moment.tz()` with `DateTime.setZone()`
3. Replace `.format()` with `.toFormat()` (slightly different format strings)
4. Replace `.toDate()` with `.toJSDate()`

### If Migrating from Day.js

1. Install timezone plugin: `dayjs.extend(timezone)`
2. Replace `dayjs().tz()` with `DateTime.setZone()`
3. Consider migrating to Luxon for better timezone support

---

## References

- [Luxon Documentation](https://moment.github.io/luxon/)
- [IANA Timezone Database](https://www.iana.org/time-zones)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Project Timezone Authority](./data-dictionary-booking.md#project-timezone-is-authoritative) - Business rules

---

**Last Reviewed:** January 2026  
**Next Review:** When adding new timezone-sensitive features or receiving feedback on timezone handling
