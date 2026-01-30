# User Roles and Actors

**Purpose:** PRD-level definition of all user roles, actors, and their relationships in the SmartBench platform.

**Last Updated:** January 2026  
**Version:** 1.0

> **Note:** For technical implementation details of the Unified User Model, role assignment, and RBAC middleware, see [Unified User Model Blueprint](../architecture/blueprints/identity/unified-user-model.md).

---

## Role Hierarchy

The SmartBench platform uses a role-based access control (RBAC) system with the following hierarchy:

**System Admin** > **Company Admin** > **Manager** > **Supervisor** > **Worker**

---

## Core Roles

### Admin Role

**Definition:** User with administrative privileges within a Company. Admins have full control over company settings, worker management, financial operations, and booking management.

**Business Context:**
- **Borrowing Admin:** Admin role in the company that is booking/borrowing workers (see [Terminology Glossary](./glossary.md) for standardized terminology)
- **Lending Admin:** Admin role in the company that is listing/lending workers (see [Terminology Glossary](./glossary.md) for standardized terminology)
- Same user can be Borrowing Admin in one booking and Lending Admin in another

**Key Capabilities:**
- Create and manage company profile
- Invite and manage workers (bulk roster invites)
- Set worker lending rates
- Toggle worker marketplace listing
- Manage insurance policies
- Create and manage projects
- Book workers (Borrower context)
- Manage bookings (cancel, recall for long-term bookings)
- Access company financial dashboard and financial operations (Stripe balance, transactions, withdrawals)
- Withdraw funds to bank account
- View company dashboard and reports
- Manage saved searches and alerts

**Special Cases:**
- **Solopreneur:** User who is Admin, Supervisor, and Worker simultaneously in their own company

**Technical Reference:** See [Unified User Model](../architecture/blueprints/identity/unified-user-model.md) for role assignment and company membership implementation.

---

### Manager Role

**Definition:** User with operational management privileges within a Company. Managers can Book Workers (Demand) and List Workers (Supply) without full Admin access to billing/Stripe or financial dashboard operations.

**Business Context:**
- **Borrowing Manager:** Manager role in the company that is booking/borrowing workers (see [Terminology Glossary](./glossary.md) for standardized terminology)
- **Lending Manager:** Manager role in the company that is listing/lending workers (see [Terminology Glossary](./glossary.md) for standardized terminology)
- Same user can be Borrowing Manager in one booking and Lending Manager in another
- Manager role bridges the gap between Admin (full company control) and Supervisor (field verification only)

**Key Capabilities:**
- Book workers (Borrower context)
- Cancel bookings (Borrower context)
- Toggle worker marketplace listing (Lender context)
- Invite workers and supervisors (bulk roster invites)
- Manage company members (assign Worker and Supervisor roles)
- Verify hours (Borrower context - inherits Supervisor verification capabilities)
- Dispute timesheets (Borrower context)
- Select/manage Site Contact for bookings (Borrower context)
- View timesheets and booking details
- Access saved searches and alerts (Borrower context)

**Restrictions:**
- Cannot access financial operations or financial dashboard
- Cannot withdraw funds to bank account
- Cannot set worker lending rates (Admin only)
- Cannot upload insurance policies (Admin only)
- Cannot create or edit company profile
- Cannot view financial reports
- Cannot process payments or request refunds

**Special Cases:**
- Manager role is NOT auto-assigned to Solopreneurs (only Admin, Supervisor, Worker are auto-assigned)

**Technical Reference:** See [Unified User Model](../architecture/blueprints/identity/unified-user-model.md) for role assignment and company membership implementation.

---

### Supervisor Role

**Definition:** User responsible for verifying worker hours on job sites. Supervisors must be company members.

**Business Context:**
- All supervisors are company members with full company member access
- Verification is role-based: ANY user with Supervisor, Manager, or Admin role in the Borrower Company can verify timesheets
- No specific supervisor assignment is required for verification - it's based on role, not assignment
- Solopreneur owners are automatically set as Primary Site Contact when booking is created (for operational communication)
- Company owners can select any company member as Primary Site Contact during checkout (for operational communication)

**Key Capabilities:**
- Verify worker hours via SMS magic link
- View timesheet details (system time, submitted time, GPS data, photos)
- Approve or dispute timesheets
- Reject workers during trial period (first 4 hours)
- Rate workers after shift completion
- Access verification dashboard
- Access company dashboard and view booking details

**Workflow Integration:**
- Primary Site Contact receives SMS notification when worker clocks out (for operational communication)
- ANY Supervisor, Manager, or Admin in Borrower Company can verify timesheets (role-based verification)
- Must verify within 2 hours or Borrowing Admin is alerted
- Auto-approval occurs 4 hours after clock-out if not verified (no exceptions for weekends, holidays, or business days)

**Technical Reference:** See [Time Tracking & Verification Epic](./epic-5.md) for supervisor verification workflows.

---

### Worker Role

**Definition:** User who works shifts booked through the platform. Workers are listed in the marketplace and can be booked by borrowers.

**Business Context:**
- Workers belong to a Lender Company
- **Sequential Employment Supported:** Workers can leave Company A and join Company B (sequential employment)
- **Concurrent Employment Prevented:** Workers cannot be concurrently active at multiple companies. A worker can only have one `'Active'` company membership at a time
- Workers must complete profile before being listed

**Key Capabilities:**
- Complete worker profile (trade, skills, experience, photo, certifications)
- Clock in/out for shifts with GPS coordinate capture
- Log breaks and lunch periods
- Log travel time between job sites
- Self-correct time entries before submission
- View shift assignments and booking details
- Receive notifications (shift reminders, verification confirmations)
- Rate supervisors and companies after shift completion

**State Machine:** Workers progress through defined states during onboarding and listing. The "Listed" status is a persisted state column (`users.user_state = 'Listed'`) that is updated when admin toggles listing ON (if profile is complete and insurance is valid).

**Technical Reference:** See [Worker State Machine](../architecture/data-dictionary-identity.md#worker-state-machine) for complete state machine definition, all state values, transition rules, and diagrams. See [Worker Onboarding Epic](./epic-2.md) for business context and workflow.

---

## Special Actor: Solopreneur

**Definition:** A user who operates as a one-person company, holding all three roles (Admin, Supervisor, Worker) simultaneously. Note: Manager role is not auto-assigned to Solopreneurs.

**Business Context:**
- Solopreneurs are common in the construction industry
- They can both list themselves as workers AND book other workers
- System automatically assigns all three roles during registration

**Registration Flow:**
1. User creates account
2. System atomically creates: User record, Company record, Company_Member record with roles `['Worker', 'Supervisor', 'Admin']`
3. User directed to "My Profile" to add trade skills

**Key Characteristics:**
- Single user manages all company functions
- Can list themselves in marketplace
- Can book other workers
- Can verify their own hours (if they book themselves)
- Full access to all features without role switching

**Technical Reference:** See [Unified User Model](../architecture/blueprints/identity/unified-user-model.md#solopreneur-registration-flow) for implementation details.

---

## Context-Specific Roles

### Borrower

**Definition:** Any user in the Borrower's Company (typically Admin, but could be any role).

**Business Context:**
- Company that is booking/borrowing workers
- Can be Admin, Manager, Supervisor, or Worker depending on company structure
- Typically Admin or Manager performs booking operations

**Key Capabilities:**
- Search and book workers
- Manage projects and bookings
- Select Primary Site Contact for bookings (for operational communication)
- Verify hours (if Supervisor, Manager, or Admin role)
- Access saved searches and alerts

---

### Lender

**Definition:** Company that is listing/lending workers.

**Business Context:**
- Company that provides workers to the marketplace
- Lending Admin manages worker listings and receives payments

**Key Capabilities:**
- List workers in marketplace
- Set worker availability
- Manage worker profiles and rates
- Receive booking requests
- Access financial dashboard and withdrawals (Stripe balance, transactions)

---

## System Admin

**Definition:** Platform-level administrator with global system access.

**Business Context:**
- Platform owners/operators
- Not associated with any specific company
- Implements "Zero-Touch" philosophy (focuses on platform-level enforcement, not operational verification)

**Key Capabilities:**
- View global platform statistics
- Manage users and companies (ban/unban)
- Force-cancel bookings (with audit trail)
- View all financial transactions for audit
- Monitor system health and alerts
- Access error logs and exception tracking
- Handle dead letter queue items

**Restrictions:**
- Does NOT judge disputes (System only holds funds, provides read-only evidence access via Super Admin dashboard)
- Does NOT review GPS anomalies (only Supervisor approval required)
- Does NOT review time anomalies (only Supervisor approval required)

**Technical Reference:** See [Super Admin Dashboard Epic](./epic-7.md) for complete capabilities.

---

## Admin Role Philosophy & Liability Boundaries

**Context:** To scale efficiently and maintain clear responsibility boundaries, the platform implements a "Zero-Touch System Admin" philosophy where operational verification and risk management are handled by Company Admins, not System Admins.

### Role Definitions

1. **System Admin (Platform Owner):**
   * **Operational Role:** NONE. System Admin has NO operational role in verification, insurance checking, or listing approval.
   * **Focus:** "Police Work" only - banning bad actors, platform-level enforcement, handling disputes that escalate beyond Company Admin resolution, and monitoring system health.
   * **Responsibilities:** Platform policy enforcement, user/company bans, system monitoring, and critical platform operations.

2. **Company Admin (Lender/Borrower):**
   * **Full Responsibility:** Company Admins are fully responsible for managing their inventory, rates, and risk.
   * **Insurance Self-Certification:** Lenders self-certify insurance data under penalty of fraud. System Admin does NOT verify insurance documents.
   * **Verification:** Company Admins (Supervisors) verify worker timesheets. System Admin does NOT perform operational verification.
   * **Listing Approval:** Company Admins approve and list workers. System Admin does NOT approve listings.

### Rationale

This separation ensures scalability, reduces platform liability, and places operational responsibility where it belongs - with the companies using the platform.

---

## Role Relationships

### Many-to-Many Company Membership

**Key Architecture:** The SmartBench platform uses a many-to-many relationship model where users can belong to multiple companies with different roles in each company context.

**Technical Reference:** For complete implementation details of the Unified User Model, many-to-many relationship structure, and role assignment logic, see:
- [Unified User Model Blueprint](../architecture/blueprints/identity/unified-user-model.md)

---

## Role Assignment Rules

### Automatic Role Assignment

**Solopreneur Registration:**
- System automatically assigns `['Worker', 'Supervisor', 'Admin']` during registration

**Bulk Roster Invite:**
- Workers invited via bulk roster start with `Worker` role only
- Admin can add additional roles later if needed

### Manual Role Assignment

**Admin Actions:**
- Admin can add/remove roles for company members
- At least one role must remain, or status changes to `Suspended`
- Role changes are logged in `Audit_Log` table

### Role Validation

**Business Rules:**
- Only Admin can assign Supervisor, Manager, or Admin roles
- Admin and Manager can assign roles to company members (Admin can assign all roles, Manager can assign Worker and Supervisor roles)
- Workers cannot assign roles to themselves
- All supervisors and managers must be company members

---

## Role-Based Permissions Matrix

For detailed RBAC permissions across all features, see [RBAC Acceptance Criteria](./rbac-acceptance-criteria.md).

For notification-specific RBAC, see [Notifications & RBAC Matrix](./notifications-rbac-matrix.md).

---

## Related Documentation

- [Unified User Model Blueprint](../architecture/blueprints/identity/unified-user-model.md) - Technical implementation
- [RBAC Acceptance Criteria](./rbac-acceptance-criteria.md) - Comprehensive permission matrix
- [Notifications & RBAC Matrix](./notifications-rbac-matrix.md) - Notification-specific RBAC
- [Goals and Background Context](./goals-and-background-context.md) - Role context and business rules
