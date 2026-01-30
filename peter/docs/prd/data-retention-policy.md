# Data Retention and Deletion Policy

**Purpose:** Comprehensive data retention policies, deletion workflows, and compliance requirements for the SmartBench platform.

**Last Updated:** January 2026  
**Version:** 1.0

---

## Overview

SmartBench retains data for legal, tax, and business compliance purposes. This document defines retention periods, deletion workflows, and anonymization processes for all data types.

---

## Retention Periods

### Booking History
**Retention Period:** 7 years from booking completion date

**Rationale:**
- Tax compliance requirements (IRS requires 7 years for employment records)
- Legal liability protection
- Dispute resolution and audit trail

**Data Included:**
- Booking records (dates, times, workers, companies)
- Payment transactions
- Time logs and verification records
- Supervisor assignments
- Cancellation and refund records
- Dispute records and settlements

**After Retention Period:**
- Data is anonymized (personal identifiers removed)
- Aggregated statistics may be retained indefinitely for business analytics

---

### Transaction History
**Retention Period:** 7 years from transaction date

**Rationale:**
- Financial record keeping requirements
- Tax audit compliance
- Fraud investigation support

**Data Included:**
- Payment transactions (credit card, Stripe transfers)
- Funds held via Stripe escrow/hold (dispute-related holds)
- Withdrawals and payouts
- Refunds and chargebacks
- Service Fee calculations
- Payment transaction records

**After Retention Period:**
- Financial summaries retained for tax reporting
- Individual transaction details anonymized

---

### Audit Logs
**Retention Period:** 7 years from log entry date

**Rationale:**
- Security incident investigation
- Compliance auditing
- System troubleshooting

**Data Included:**
- Authentication events (logins, logouts, token refreshes)
- Authorization events (permission checks, access denials)
- Data modification events (creates, updates, deletes)
- API access logs
- System configuration changes
- Admin actions (impersonation, bans, force cancellations)

**After Retention Period:**
- Security-relevant events may be retained longer
- Routine audit logs anonymized

---

### User Account Data
**Retention Period:** Active accounts retained indefinitely; Deleted accounts: 7 years from deletion date

**Rationale:**
- Active accounts needed for ongoing service
- Deleted accounts retained for legal/compliance purposes

**Data Included:**
- User profiles (name, email, phone, photo)
- Company memberships
- Role assignments
- Preferences and settings
- Notification preferences

**After Account Deletion:**
- Personal identifiers anonymized after 7 years
- Historical booking associations retained (anonymized)

---

### Worker Profiles
**Retention Period:** 7 years from last active booking date

**Rationale:**
- Employment record requirements
- Reference verification support
- Rating and review integrity

**Data Included:**
- Worker profile information
- Skills, certifications, experience
- Ratings and reviews
- Availability history
- Booking history

**After Retention Period:**
- Profile anonymized
- Aggregated statistics retained

---

### Insurance Records
**Retention Period:** 1 year from policy expiration date or revocation date

**Rationale:**
- Liability protection
- Compliance verification
- Insurance audit support

**Data Included:**
- Insurance policy documents
- Expiration dates
- Coverage amounts
- Upload timestamps
- Validation records
- Revocation records and timestamps

**Retention Rules by Policy State:**

1. **Active Policies:**
   - Retain indefinitely while policy is active (policy has not expired and has not been revoked)
   - Once policy expires or is revoked, retention period begins: 1 year from expiration date or revocation date, whichever is later

2. **Revoked Policies:**
   - Retain 1 year from revocation date
   - Revocation date is the timestamp when insurance was revoked (not expiration date)
   - Policy documents and revocation records retained for full retention period

3. **Expired Policies:**
   - Retain 1 year from policy expiration date
   - Policy documents retained until retention period expires

4. **Deleted Companies:**
   - Insurance records retained per retention policy (1 year from expiration/revocation date)
   - Company deletion does not affect insurance retention requirements
   - Insurance records remain accessible for audit purposes even after company deletion
   - Retention period calculated from original expiration or revocation date, not company deletion date

**After Retention Period:**
- Policy documents deleted
- Expiration dates retained (anonymized) for compliance tracking
- Revocation records retained (anonymized) for audit purposes

---

### Communication Records
**Retention Period:** 2 years from last message date

**Rationale:**
- Customer support reference
- Dispute resolution support
- Privacy considerations

**Data Included:**
- In-app messaging
- SMS notifications (metadata only, not content)
- Email notifications (metadata only, not content)
- Support tickets

**After Retention Period:**
- Message content deleted
- Metadata anonymized

---

## User Account Deletion Workflow

### User-Initiated Deletion

**Process:**
1. User requests account deletion via account settings
2. System validates user identity (password confirmation or 2FA)
3. System checks for active bookings:
   - If active bookings exist: Deletion blocked with message "Cannot delete account with active bookings. Please complete or cancel all active bookings first."
   - If no active bookings: Proceed to deletion
4. System marks account for deletion (soft delete)
5. Account immediately becomes inactive (cannot log in)
6. Personal data anonymized after 7-year retention period

**Data Retained (Anonymized):**
- Historical booking records (linked to anonymized user ID)
- Transaction history (financial records required for tax compliance)
- Audit logs (security and compliance)

**Data Deleted Immediately:**
- User profile (name, email, phone, photo)
- Active session tokens
- Notification preferences
- Saved searches
- Personal settings

---

### Company-Initiated Deletion

**Process:**
1. Company Admin requests company deletion
2. System validates no active bookings exist
3. System checks for pending transactions:
   - If pending transactions: Deletion blocked until transactions complete
   - If no pending transactions: Proceed to deletion
4. All company members notified of company deletion
5. Company marked for deletion (soft delete)
6. Company data anonymized after 7-year retention period

**Data Retained (Anonymized):**
- Historical booking records
- Transaction history
- Worker profiles (if workers belong to multiple companies)

**Data Deleted Immediately:**
- Company profile information
- Company settings and preferences
- Active company memberships (users removed from company)

---

## Anonymization Process

### Anonymization Criteria

Data is anonymized when:
- Retention period expires
- User account deletion requested (after 7-year retention)
- Legal requirement met

### Anonymization Methods

**Personal Identifiers Removed:**
- Names → "User [Anonymized ID]"
- Email addresses → "[Anonymized]@[Anonymized].com"
- Phone numbers → "[Anonymized]"
- Photos → Deleted
- Addresses → General location only (city, state)

**Business Data Retained:**
- Booking dates and times (anonymized)
- Transaction amounts (anonymized)
- Worker skills and certifications (aggregated)
- Ratings and reviews (aggregated statistics only)

**Anonymization Timestamp:**
- All anonymized records include `anonymized_at` timestamp
- Original data cannot be recovered after anonymization

---

## Automated Deletion Jobs

All data deletion and anonymization is **automated** via scheduled background jobs. The system does not require manual intervention for routine data retention compliance.

**Automation Approach:**
- All data deletion and anonymization operations are performed automatically by scheduled background jobs
- Jobs run daily to process expired retention periods
- No manual deletion required for standard retention compliance

**Job Schedule:**
- **Execution Time:** Daily at 2:00 AM UTC (configurable by Super Admin via admin dashboard)
- **Frequency:** Once per day
- **Timezone:** UTC (server timezone) - jobs calculate retention periods based on record timestamps, not execution timezone

**Job Process:**

1. **Query Expired Records:**
   - System queries all records where retention period has expired based on retention policy rules:
     - Booking History: `completed_at + 7 years < NOW()`
     - Transaction History: `transaction_date + 7 years < NOW()`
     - Audit Logs: `timestamp + 7 years < NOW()`
     - User Account Data: `deleted_at + 7 years < NOW()` (for deleted accounts)
     - Worker Profiles: `last_active_booking_date + 7 years < NOW()`
     - Insurance Records: `expiration_date + 1 year < NOW()` OR `revocation_date + 1 year < NOW()`
     - Communication Records: `last_message_date + 2 years < NOW()`

2. **Apply Anonymization or Deletion:**
   - For each expired record, system applies the appropriate action per retention policy:
     - **Anonymization:** Personal identifiers removed, business data retained (see [Anonymization Methods](#anonymization-methods))
     - **Deletion:** Complete removal of data (for communication content, expired insurance documents, etc.)
   - Operations are performed in batches to avoid long-running transactions

3. **Log Actions:**
   - All deletion/anonymization actions are logged in `audit_log` with:
     - `action_type = 'Data_Retention_Deletion'` or `'Data_Retention_Anonymization'`
     - `target_entity = [Entity Type]` (e.g., 'User', 'Booking', 'Insurance_Policy')
     - `target_id = [Record ID]`
     - `metadata` includes: `retention_policy_applied`, `retention_period_expired_date`, `anonymization_timestamp` (if applicable)

4. **Send Summary Report:**
   - System generates summary report of all actions taken during job execution
   - Report includes: Number of records anonymized, number of records deleted, breakdown by entity type
   - Report is sent to Super Admin dashboard for review
   - Report is also logged for audit purposes

**Manual Override:**
- Super Admins can trigger immediate deletion/anonymization via admin dashboard (see [Epic 7: Story 7.8](./epic-7.md#story-78-data-retention-management))
- Super Admins can extend retention periods for specific records if needed (e.g., for legal holds)
- All manual overrides are logged in `audit_log` with `action_type = 'Data_Retention_Manual_Override'`

**Job Monitoring:**
- **Success Tracking:** Job execution success/failure rates are monitored
- **Retry Logic:** Failed jobs are retried with exponential backoff (up to 3 retries)
- **Alerting:** Critical failures (e.g., job fails 3 consecutive times) alert Super Admin
- **Performance Monitoring:** Job execution duration is tracked to ensure timely completion
- **Dead Letter Queue:** Records that cannot be processed (e.g., due to data corruption) are logged to dead letter queue for manual review

**Technical Implementation:**
- See [Background Jobs Blueprint](../architecture/blueprints/system/background-jobs.md) for complete job specifications, scheduling, error handling, and monitoring
- Jobs are implemented using durable workflow orchestration for reliable job execution
- Database transactions ensure atomicity of deletion/anonymization operations

---

## Super Admin Data Retention Management

Super Admins have capabilities to manage data retention (see [Epic 7: Story 7.8](./epic-7.md#story-78-data-retention-management)):

- View retention policies and current retention status
- Trigger data archival after retention period
- Manage user account deletion workflows
- View anonymization status and history
- Export anonymized data for compliance reporting

---

## Compliance Requirements

### Tax Compliance
- **IRS Requirements:** 7-year retention for employment and financial records
- **State Tax Requirements:** Varies by jurisdiction (Minnesota and Wisconsin: 7 years)
- **1099 Reporting:** Worker payment records retained for tax reporting

### Employment Law Compliance
- **FLSA Requirements:** Time tracking records retained for wage and hour compliance
- **Workers' Compensation:** Insurance and incident records retained for claims support
- **State Employment Law:** Varies by jurisdiction

### Financial Services Compliance
- **Payment Processing:** Transaction records retained per payment processor requirements
- **Bank Reconciliation:** Financial records retained for audit purposes

---

## Data Export and Portability

### User Data Export

Users can request export of their data:
- **Format:** JSON or CSV
- **Scope:** All user-accessible data (bookings, transactions, profile)
- **Timeline:** Export provided within 30 days of request
- **Frequency:** One export per 90 days (to prevent abuse)

### Company Data Export

Company Admins can request export of company data:
- **Format:** JSON or CSV
- **Scope:** All company-accessible data (bookings, workers, transactions, financial records)
- **Timeline:** Export provided within 30 days of request
- **Frequency:** One export per 90 days

---

## Related Documentation

- [Epic 7: Super Admin Dashboard](./epic-7.md) - Super Admin data retention management capabilities
- [Architecture: Security Architecture](../architecture/security-architecture.md) - Data security and encryption
- [Architecture: Database Schema](../architecture/schema.md) - Database structure and data models
