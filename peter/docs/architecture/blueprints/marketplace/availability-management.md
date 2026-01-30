# Feature Blueprint: Availability Management
**Domain:** Marketplace
**Related Epics:** [Epic 3: Marketplace & Search](../../../prd/epic-3.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 3.3: Availability Management](../../../prd/epic-3.md#story-33-availability-management)

## Technical Strategy (The "How")

### Availability Data Model

**Schema Reference:** See [schema-marketplace.md](../../schema-marketplace.md) for complete table definition, indexes, constraints, and foreign keys:
- `worker_availability` - Worker availability date ranges and blocked dates

**Important Distinction:**
- **`blocked_dates` field:** Used for UI display and availability management interface. Allows lenders to manually block specific dates for workers (e.g., holidays, personal time off).
- **Search Availability:** Worker search queries use **real-time `NOT EXISTS` checks** against the `bookings` table to determine availability. Search does NOT rely on `blocked_dates` - it queries bookings directly for real-time accuracy. This ensures that:
  - Workers become available immediately when bookings are cancelled (no sync delay)
  - Search results reflect the current state of bookings in real-time
  - `blocked_dates` is used for UI/calendar display only, not for search filtering

### Set Availability Endpoint

**Implementation:**
```typescript
async function setWorkerAvailability(req: Request, res: Response) {
  const { workerId } = req.params;
  const { 
    availabilityMode, 
    startDate, 
    endDate, 
    blockedDates,
    recallNoticeDays 
  } = req.body;

  const companyId = req.user.companyId;
  const userId = req.user.userId;

  // Verify user has Admin, Manager (Lender context), or Supervisor role
  const membership = await db('company_members')
    .where({ user_id: userId, company_id: companyId, status: 'Active' })
    .first();

  if (!membership) {
    return res.status(403).json({ 
      error: 'Not a member of this company',
      userHint: 'You must be a member of this company'
    });
  }

  const roles = membership.roles as string[];
  // Manager can set availability in Lender context (same as Admin)
  if (!roles.includes('Admin') && !roles.includes('Manager') && !roles.includes('Supervisor')) {
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      userHint: 'Only Admins, Managers (Lender context), and Supervisors can set availability'
    });
  }

  // Verify worker belongs to same company
  const workerMembership = await db('company_members')
    .where({ user_id: workerId, company_id: companyId, status: 'Active' })
    .first();

  if (!workerMembership) {
    return res.status(404).json({ 
      error: 'Worker not found',
      userHint: 'Worker is not a member of this company'
    });
  }

  // Deactivate existing availability
  await db('worker_availability')
    .where({ worker_id: workerId, company_id: companyId, is_active: true })
    .update({ is_active: false });

  // Create new availability record
  const [availability] = await db('worker_availability').insert({
    worker_id: workerId,
    company_id: companyId,
    availability_mode: availabilityMode,
    start_date: startDate || null,
    end_date: endDate || null, // NULL for long-term
    blocked_dates: blockedDates || [],
    recall_notice_days: recallNoticeDays || 3,
    is_active: true
  }).returning('*');

  res.json({
    success: true,
    availability: {
      id: availability.id,
      availabilityMode: availability.availability_mode,
      startDate: availability.start_date,
      endDate: availability.end_date,
      blockedDates: availability.blocked_dates,
      recallNoticeDays: availability.recall_notice_days
    }
  });
}
```

### Check Availability Function

**Availability Check:**
```typescript
async function checkWorkerAvailability(
  workerId: string, 
  startDate: Date, 
  endDate: Date
): Promise<{ available: boolean; reason?: string }> {
  // Get active availability
  const availability = await db('worker_availability')
    .where({ worker_id: workerId, is_active: true })
    .first();

  if (!availability) {
    return { available: false, reason: 'No availability set' };
  }

  // Check for existing bookings in blocking statuses
  // Blocking statuses: Confirmed, Active, Pending_Payment, Payment_Paused_Dispute,
  // Suspended_Insurance
  // Note: Cancelled bookings (including Option B dispute cancellations) are excluded from conflict checking
  // Option B dispute cancellations immediately release worker availability (real-time via PostgreSQL query - no sync delay)
  const conflictingBooking = await db('bookings')
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
    .first();

  if (conflictingBooking) {
    return { available: false, reason: 'Worker already booked for these dates' };
  }

  // Check date range against availability
  if (availability.availability_mode === 'Short_Term') {
    if (availability.start_date && startDate < availability.start_date) {
      return { available: false, reason: 'Requested date before availability start' };
    }
    if (availability.end_date && endDate > availability.end_date) {
      return { available: false, reason: 'Requested date after availability end' };
    }
  }

  // Check blocked dates
  const blockedDates = availability.blocked_dates || [];
  const requestedDates = getDateRange(startDate, endDate);
  const hasBlockedDate = requestedDates.some(date => 
    blockedDates.some(blocked => 
      new Date(blocked).toDateString() === date.toDateString()
    )
  );

  if (hasBlockedDate) {
    return { available: false, reason: 'Requested dates include blocked dates' };
  }

  return { available: true };
}

function getDateRange(start: Date, end: Date): Date[] {
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
```

### Calendar Display

**Get Availability Calendar:**
```typescript
async function getAvailabilityCalendar(req: Request, res: Response) {
  const { workerId } = req.params;
  const { month, year } = req.query; // e.g., month=1, year=2026

  const availability = await db('worker_availability')
    .where({ worker_id: workerId, is_active: true })
    .first();

  if (!availability) {
    return res.json({ calendar: [], message: 'No availability set' });
  }

  // Get existing bookings in blocking statuses for calendar display
  // Blocking statuses: Confirmed, Active, Pending_Payment, Payment_Paused_Dispute,
  // Suspended_Insurance
  // Note: Cancelled bookings (including Option B dispute cancellations) are excluded
  // Option B dispute cancellations immediately release worker availability (real-time via PostgreSQL query - no sync delay)
  const bookings = await db('bookings')
    .where({ worker_id: workerId })
    .whereIn('status', ['Confirmed', 'Active', 'Pending_Payment', 'Payment_Paused_Dispute', 'Suspended_Insurance'])
    .select('start_date', 'end_date');

  // Generate calendar for month
  const calendar = generateCalendarMonth(
    parseInt(month as string),
    parseInt(year as string),
    availability,
    bookings
  );

  res.json({ calendar });
}

function generateCalendarMonth(
  month: number, 
  year: number, 
  availability: any, 
  bookings: any[]
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const blockedDates = availability.blocked_dates || [];

  for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    // Check if date is blocked
    const isBlocked = blockedDates.some(blocked => 
      new Date(blocked).toDateString() === date.toDateString()
    );

    // Check if date is booked
    const isBooked = bookings.some(booking => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      return date >= start && date <= end;
    });

    // Check date range
    let inRange = true;
    if (availability.availability_mode === 'Short_Term') {
      if (availability.start_date && date < new Date(availability.start_date)) {
        inRange = false;
      }
      if (availability.end_date && date > new Date(availability.end_date)) {
        inRange = false;
      }
    }

    days.push({
      date: dateStr,
      dayOfWeek,
      available: !isBlocked && !isBooked && inRange,
      isBlocked,
      isBooked,
      inRange
    });
  }

  return days;
}
```

### Automatic Date Locking

**Lock Dates on Booking:**
```typescript
// Called when booking is confirmed
async function lockAvailabilityDates(workerId: string, startDate: Date, endDate: Date) {
  // Dates are automatically "locked" by existence of booking
  // No explicit locking needed - availability check handles this
  
  // However, we can add blocked dates to prevent conflicts
  const dates = getDateRange(startDate, endDate);
  const dateStrings = dates.map(d => d.toISOString().split('T')[0]);

  // Update availability to add these as blocked (optional - bookings already prevent conflicts)
  // This is mainly for UI display purposes
}
```

## 4. Edge Cases & Failure Handling

### Timezone Handling

**Project Timezone Authority:**
- **Authoritative Source:** Project timezone is authoritative for all booking times. When a booking is created, all shift start/end times are stored and calculated in the project's timezone, regardless of where the worker is located.
- **Availability vs. Booking:** When a booking is created, the booking times use the project's timezone as the authoritative source. Availability date ranges are matched against booking requests using the project's timezone.

**Storage and Display:**
- **Storage:** All dates/times stored in UTC in the database, but all time-based calculations use the project's timezone (for bookings).
- **Display:** Convert to user's local timezone for display using user's preferred timezone (from `user_preferences.timezone` or company default), but underlying calculations always use project timezone for bookings.
- **Validation:** Use timezone-aware date libraries (Luxon/DayJS) for all timezone conversions and calculations.

### DST Transitions

**Scenario:** Daylight Saving Time transitions affect bookings
- **Solution:** Use timezone-aware libraries that handle DST automatically. During DST transitions, project timezone remains consistent (no double-counting or missing hours). The project timezone provides a consistent reference point for all calculations.
- **Testing:** Test availability calculations and booking time conversions across DST boundaries to ensure consistency.

### Overlapping Patterns

**Scenario:** Admin sets multiple availability patterns that overlap
- **Solution:** Only one active availability record per worker
- **Handling:** Deactivate old pattern when creating new one
- **Validation:** Prevent creating overlapping active patterns

### Long-Term Indefinite Availability

**Scenario:** Long-term availability with no end date
- **Solution:** Store `end_date = NULL` for long-term
- **Validation:** Check recall notice requirements (3 business days minimum)
- **Booking:** Long-term bookings require recall notice workflow

## Data Model Impact

### Tables Modified/Created

**Schema Reference:** See [schema-marketplace.md](../../schema-marketplace.md) for complete table definitions, indexes, constraints, and foreign keys:
- `worker_availability` - Worker availability date ranges and blocked dates

### Related Tables

This feature interacts with:
- `users` - Worker information
- `companies` - Company context
- `bookings` - Conflict checking
- `company_members` - Permission checking
