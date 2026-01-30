# Epic 7: Super Admin Dashboard

**Epic Goal:** Enable platform owners to manage the platform globally, view system-wide statistics, manage users and companies, and handle critical platform operations. This epic delivers the "God Mode" administrative interface required for platform management.

## Story 7.1: Super Admin Dashboard - Global Statistics

As a Super Admin,
I want to view global platform statistics,
so that I can monitor platform health and usage.

**Acceptance Criteria:**
1. Dashboard displays: Total users, Total companies, Active bookings count, Total revenue, Service Fees collected
2. Charts: User growth over time, Booking frequency trends, Revenue trends
3. Real-time or near real-time updates
4. Filters: Date range, Region, Company type

## Story 7.2: Super Admin - User and Company Management

As a Super Admin,
I want to manage users and companies,
so that I can handle support issues and enforce platform policies.

**Acceptance Criteria:**
1. User management: View user details, Ban/Unban users, View user's booking history
2. Company management: View company details, Ban/Unban companies, View company's strike history
3. Force-cancel bookings: Super Admin can force-cancel bookings if necessary (with proper audit trail)
4. View all strikes across platform
5. Access to all financial transactions for audit purposes

## Story 7.3: Super Admin - System Monitoring and Alerts

As a Super Admin,
I want to monitor system health and receive alerts,
so that I can respond to issues quickly.

**Acceptance Criteria:**
1. System health dashboard: API response times, Database performance, Payment processing status
2. Alert system: Payment webhook failures, Payment processing errors
3. Reconciliation status: Payment reconciliation job status, Failed webhook recovery status

**Technical Reference:** See [Financial Architecture](../architecture/financial-architecture.md) for webhook processing and reconciliation job technical details.
4. Error logs and exception tracking

## Story 7.4: The "Wednesday Rule" Traffic Control Center

As a Super Admin,
I want a dedicated dashboard widget for monitoring the Wednesday 10 AM (Project Time) weekly payment processing,
so that I can handle gateway outages and prevent funding failures during critical payment windows.

**Acceptance Criteria:**
1. Dashboard widget displays live feed showing: Total Scheduled Charges, Successful Charges, Unpaid Bookings count (bookings with payment failure where next week is still unpaid)
2. Widget shows real-time status of all active weekly progress payment bookings during Wednesday 10 AM window
3. Global "Pause Hard Cutoff" toggle allows Super Admin to temporarily suspend automatic cancellation of unpaid bookings
4. When "Pause Hard Cutoff" is active, system extends the hard cutoff deadline beyond Wednesday 11:59 PM to allow manual intervention
5. Widget displays breakdown by Project Timezone to show which regions are in active payment window
6. Alert notifications when Unpaid Bookings count exceeds threshold
7. Historical view shows past Wednesday payment processing statistics

## Story 7.5: "God Mode" Impersonation

As a Super Admin,
I want to view the platform as a specific user (read-only),
so that I can debug lender availability or booking issues without manual verification of every document.

**Acceptance Criteria:**
1. Super Admin can select "View as [User]" from user management interface
2. Impersonation mode provides read-only access to user's view of platform
3. Super Admin sees: User's marketplace search results, User's booking history, User's availability calendar, User's notification history
4. All actions are disabled in impersonation mode (read-only)
5. Clear visual indicator displays "Viewing as [User Name]" at all times
6. Audit trail logs all impersonation sessions with timestamp and Super Admin user ID
7. Impersonation session expires after 30 minutes of inactivity
8. Super Admin can exit impersonation mode at any time

## Story 7.6: Timeline Visualizer (Audit UI)

As a Super Admin,
I want a vertical visual timeline for any Booking ID showing the exact sequence of events,
so that I can investigate disputes and understand the complete lifecycle of a booking.

**Acceptance Criteria:**
1. Timeline view accessible from booking details or booking ID search
2. Vertical timeline displays chronological sequence of events queried from `audit_log` table:
   - `Created` - Booking creation timestamp
   - `Paid` - Payment confirmation timestamp (from `Booking_Status_Changed` with `new_value = 'Confirmed'`)
   - `Insurance Check` - Insurance validation timestamp
   - `Status Changed` - All booking status transitions (from `Booking_Status_Changed` entries with `previous_value` and `new_value` in metadata)
   - `Clock In` - Worker clock-in timestamp with GPS coordinates (may be NULL if GPS unavailable)
   - `Supervisor Override` - Supervisor approval/rejection actions with timestamps
3. Each timeline event shows: Event type, Timestamp, User who triggered event, Relevant data (GPS coordinates, photos, verification status, state change reason)
4. Timeline supports filtering by event type
5. Timeline can be exported as PDF for audit documentation
6. Clicking on timeline events expands to show full event details and associated data
7. **Data Source:** Timeline is generated by querying `audit_log` table filtered by `target_entity = 'Booking'` and `target_id = booking_id`, ordered by `timestamp ASC`. Status changes are extracted from `Booking_Status_Changed` entries with `previous_value` and `new_value` in the metadata JSONB field.

## Story 7.7: Shadow Banning

As a Super Admin,
I want to "Shadow Ban" a user so they can use the app but requests/messages fail silently,
so that I can slow down bad actors during investigation without alerting them.

**Acceptance Criteria:**
1. UI toggle in user management interface: "Shadow Ban" checkbox
2. When Shadow Ban is active:
   - User can log in and navigate the app normally
   - User's booking requests fail silently (no error message shown to user)
   - User's messages/notifications are not delivered
   - User's marketplace listings are hidden from search results
   - User appears active to themselves but is effectively invisible to other users
3. Shadow Ban status is visible only to Super Admin (not visible to user or other platform users)
4. Audit trail logs when Shadow Ban is activated/deactivated with timestamp and Super Admin user ID
5. Shadow Ban can be toggled on/off at any time
6. Shadow Ban status does not affect existing bookings (only prevents new interactions)

---

## Story 7.8: Data Retention Management

As a Super Admin,
I want to manage data retention policies and user account deletion workflows,
so that I can ensure compliance with legal requirements and handle data lifecycle management.

**Acceptance Criteria:**
1. **Retention Policy Dashboard:** Super Admin can view current retention policies for all data types (bookings, transactions, audit logs, user accounts)
2. **Retention Status View:** Dashboard displays retention status for each data type:
   - Current retention period
   - Number of records approaching retention expiration
   - Number of records ready for anonymization
   - Anonymization history and statistics
3. **Data Archival Trigger:** Super Admin can manually trigger data archival for records that have exceeded retention period
4. **Anonymization Management:** Super Admin can:
   - View anonymization queue (records ready for anonymization)
   - Trigger anonymization process for specific data types
   - View anonymization history and audit trail
   - Export anonymization reports for compliance
5. **User Account Deletion Workflow:** Super Admin can:
   - View pending account deletion requests
   - Approve or deny account deletion requests
   - View account deletion history
   - Manage company deletion workflows
   - Handle edge cases (active bookings, pending transactions)
6. **Retention Policy Configuration:** Super Admin can view (but not modify) retention policy settings:
   - Booking history: 7 years
   - Transaction history: 7 years
   - Audit logs: 7 years
   - User accounts: 7 years from deletion
   - Insurance records: 1 year from expiration/revocation (active policies retained indefinitely until expiration/revocation)
   - Communication records: 2 years
7. **Compliance Reporting:** Super Admin can export compliance reports showing:
   - Data retention status by type
   - Anonymization statistics
   - Account deletion history
   - Retention policy compliance status
8. **Audit Trail:** All data retention management actions are logged with:
   - Super Admin user ID
   - Action type (archival, anonymization, deletion approval)
   - Timestamp
   - Affected record counts
   - Reason/justification (if applicable)
9. **Bulk Operations:** Super Admin can trigger bulk operations:
   - Bulk anonymization for records exceeding retention period
   - Bulk archival for specific data types
   - Bulk deletion approval for multiple accounts (with safeguards)
10. **Safety Safeguards:** System prevents accidental data loss:
    - Confirmation dialogs for destructive operations
    - Dry-run mode to preview operations before execution
    - Rollback capability for recent operations (within 24 hours)
    - Alert notifications for bulk operations affecting >1000 records

**Related Documentation:**
- [Data Retention Policy](./data-retention-policy.md) - Complete data retention policies and deletion workflows
- [Architecture: Security Architecture](../architecture/security-architecture.md) - Data security and audit logging

---

## Story 7.9: Super Admin Evidence View

As a Super Admin,
I want to view all evidence (GPS logs, photos, chat history) for any dispute in a read-only interface,
so that I can review disputes and manually resolve them when admins cannot agree.

**Acceptance Criteria:**
1. **Evidence Access:** Super Admin dashboard provides read-only access to all evidence for any dispute:
   - GPS logs and location data (with map visualization)
   - Project photos (clock-in/clock-out photos)
   - Chat history (complete conversation between Lending Admin and Borrowing Admin)
   - System-injected evidence messages (supervisor edit notes, worker rejection comments, timestamps)
   - Timesheet data (clock-in/clock-out times, break/lunch durations, status transitions)
   - Incident report details (if dispute originated from incident report)
2. **Dispute List View:** Super Admin can view a list of all active disputes with:
   - Dispute ID
   - Booking ID
   - Worker name
   - Borrower Company name
   - Lender Company name
   - Dispute type (Timesheet Dispute or Incident Report)
   - Dispute status (Open, Resolved)
   - Amount frozen in escrow
   - Date filed
3. **Evidence Detail View:** Clicking on a dispute opens a read-only evidence view showing:
   - **GPS Data Tab:** Interactive map showing worker's clock-in/clock-out locations, GPS coordinates (captured at clock-in/clock-out, may be NULL if unavailable)
   - **Photos Tab:** All project photos associated with the disputed shift (clock-in photo, clock-out photo, incident photos if applicable)
   - **Chat History Tab:** Complete chat conversation between Lending Admin and Borrowing Admin, including all system-injected evidence messages
   - **Timesheet Data Tab:** Complete timesheet information including:
     - Clock-in/clock-out times
     - Break and lunch durations
     - Status transitions (including Negotiation Loop steps if applicable)
     - Supervisor edit notes (if supervisor edited time)
     - Worker rejection comments (if worker rejected edit)
     - Auto-approval timestamps
   - **Incident Report Tab:** (If applicable) Complete incident report details including severity, type, notes, photos
4. **Manual Resolution:** Super Admin can manually resolve disputes based on evidence review:
   - Super Admin can view all evidence and make a resolution decision
   - Resolution options: Release funds to lender, Refund to borrower, Split funds (specify percentage)
   - Super Admin must enter a resolution note explaining the decision
   - Resolution is processed immediately via Stripe API (transfer/refund as specified)
   - All parties are notified of Super Admin resolution
5. **Evidence Export:** Super Admin can export evidence package as PDF for legal/audit purposes:
   - PDF includes: All GPS data, photos, chat history, timesheet data, incident report (if applicable)
   - PDF is timestamped and includes Super Admin user ID who generated the export
6. **Access Control:** Evidence view is read-only for Super Admin - Super Admin cannot edit or delete evidence
7. **Audit Trail:** All Super Admin evidence views and manual resolutions are logged in audit trail with:
   - Super Admin user ID
   - Dispute ID
   - Action type (viewed_evidence, manual_resolution)
   - Timestamp
   - Resolution details (if manual resolution)

**Explicit Rule:** Since the shared Evidence Locker UI has been removed from the user-facing dispute resolution interface, the Super Admin dashboard must provide this read-only evidence access. This ensures that all evidence remains accessible for dispute resolution and audit purposes.

**Migration Context:** The Evidence Locker UI was removed as part of the "Simplified MVP" refactor (January 2026). Evidence is now automatically injected as system messages in the chat stream for regular dispute resolution. For details on the removal and migration, see:
- [Architecture Index - Migration Notes](../architecture/index.md#migration-notes) - Complete documentation of removed concepts
- [Story 5.10: Dispute Resolution - Chat-Based Resolution](./epic-5.md#story-510-dispute-resolution-chat-based-resolution) - Chat-based dispute resolution workflow (line 647 documents Evidence Locker UI removal)

**Related Documentation:**
- [Story 5.10: Dispute Resolution - Chat-Based Resolution](./epic-5.md#story-510-dispute-resolution-chat-based-resolution) - Chat-based dispute resolution workflow
- [Story 4.9: Incident Reporting & Termination](./epic-4.md#story-49-incident-reporting-termination) - Fast-Track Dispute workflow

---

## Related Documentation

- [Epic 1: Foundation & Core Infrastructure](./epic-1.md) - User and company management
- [Epic 4: Booking & Payment Processing](./epic-4.md) - Booking management and force cancellation
- [Epic 5: Time Tracking & Verification](./epic-5.md) - Time log management and dispute resolution
- [Story 7.9: Super Admin Evidence View](#story-79-super-admin-evidence-view) - Read-only evidence access for disputes
- [Epic 6: Financial Operations & Admin](./epic-6.md) - Financial transaction management
- [Data Retention Policy](./data-retention-policy.md) - Data retention policies and deletion workflows
- [Architecture: Security Architecture](../architecture/security-architecture.md) - Security and audit logging
- [Architecture: Observability & Monitoring](../architecture/observability-monitoring.md) - System monitoring and alerting

---