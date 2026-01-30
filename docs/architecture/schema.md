# Database Schema

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Technical source of truth for all database schema definitions, constraints, indexes, and foreign keys in the SmartBench platform.

This document contains complete SQL table definitions, column types, constraints, indexes, foreign keys, ENUM values, and technical rules. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [data-dictionary.md](data-dictionary.md).**

---

## Table of Contents

- [Identity Domain](./schema-identity.md) - Users, companies, authentication, insurance, and onboarding
- [Financial Domain](./schema-financial.md) - Stripe payments, refunds, and financial tracking
- [Booking Domain](./schema-booking.md) - Projects, bookings, jurisdictions, and booking lifecycle
- [Fulfillment Domain](./schema-fulfillment.md) - Time tracking, offline sync, and verification
- [Marketplace Domain](./schema-marketplace.md) - Worker availability, cart items, saved searches, and geo-availability
- [Notifications Domain](./schema-notifications.md) - Notification preferences, delivery logs, and in-app inbox
- [Messaging Domain](./schema-messaging.md) - Chat channels, participants, and messages
- [Audit & Logging Domain](./schema-audit.md) - Ratings, disputes, strikes, and audit logs

---

## Technical Conventions and Rules

This section contains technical notes and conventions that apply across all domains in the SmartBench database schema.

### Technical Notes

- **Timestamps:** All timestamps are stored in UTC
- **Monetary Values:** All monetary amounts are stored in cents (BigInt) - never use Floats
- **ENUM Values:** All ENUM values are documented above in their respective table definitions. These are strict technical enforcers of valid system states.
- **Foreign Keys:** All foreign key relationships use CASCADE on delete unless otherwise specified.
- **Indexes:** Indexes are optimized for common query patterns. GIN indexes are used for JSONB columns.

### Business Rule Enforcement Policy

> **Note:** These are examples of the pattern. For authoritative constraints on specific tables, refer to the domain-specific schema files (e.g., `schema-booking.md`).

**Hybrid Guardrails Philosophy:** SmartBench uses a hybrid approach to business rule enforcement, combining database constraints for row-local validation with application logic for relational and contextual validation.

#### Database Constraints (Schema Level) - "Row-Local Truths"

Use database CHECK constraints, NOT NULL constraints, and ENUM types for rules that can be validated by looking **only** at the data in the row being inserted/updated. These are "row-local truths" that don't require querying other tables or external context.

**Examples:**
- `end_date >= start_date` - Date range validation within a single row
- `amount >= 0` - Non-negative monetary values
- `status` must be a valid ENUM value - Enumerated state validation
- `balance >= 0` - Non-negative balance constraints

**Benefits:**
- Enforced at the database level, providing defense-in-depth
- Cannot be bypassed by application code
- Consistent validation regardless of entry point (API, migrations, direct SQL)
- Clear, explicit SQL syntax in schema definitions

#### Application Logic (Service Level) - "Relational/Contextual Rules"

> **Note:** These are examples of the pattern. For authoritative constraints on specific tables, refer to the domain-specific schema files (e.g., `schema-booking.md`).

Use application/middleware logic for rules that require querying other tables, checking external context, or validating relationships between entities. These are "relational/contextual rules" that cannot be validated by examining a single row in isolation.

**Examples (Illustrative Patterns):**
- `worker_id` must belong to `lender_company_id` - Requires querying `company_members` table
- `currency_code` must match borrower company's `default_currency` - Requires querying `companies` table
- Break/lunch policy self-attestation - Lenders must certify compliance with local labor laws via Terms of Service acceptance (no database validation)
- Insurance policy must be active and valid - Requires querying `insurance_policies` table

**Benefits:**
- Flexible validation that can access related data
- Can provide detailed error messages with context
- Can implement complex business logic that spans multiple entities
- Can integrate with external services or APIs

#### Documentation Standards

All schema documentation must clearly indicate the enforcement level:
- **Database Constraints:** Documented with explicit SQL syntax (e.g., `CONSTRAINT valid_date_range CHECK (end_date >= start_date)`)
- **Application Logic:** Explicitly marked as "Enforced at Application Level (Relational Check)" with explanation of what relationship or context is being validated

**Related Documentation:** See individual domain schema files for specific constraint implementations.

### Row Level Security (RLS)

**Multi-Tenant Data Isolation:** All multi-tenant tables have Row Level Security (RLS) policies enabled to enforce strict data isolation at the database level.

**RLS Policy Implementation:**
- RLS policies use `current_setting('app.current_company_id')` to filter rows by company context
- All SELECT, INSERT, UPDATE, and DELETE operations are automatically scoped to the current company
- Application code must set the session variable `app.current_company_id` before executing database operations

**Session Variable Setup:**
Before any database operation, the NestJS middleware sets:
```sql
SET LOCAL app.current_company_id = :company_id
```
The `company_id` is extracted from the JWT token's claims on every request.

**Benefits:**
- Prevents application-level data leakage across tenants
- Enforces multi-tenancy at the database level, not just application logic
- Simplifies application code by removing the need for manual `WHERE company_id = ?` clauses
- Provides defense-in-depth security architecture

**Related Documentation:** See [Architecture](../architecture.md#row-level-security-rls-strategy) for complete RLS strategy and [Security Architecture](./security-architecture.md) for implementation details.

---

## Domain Documentation

### [Identity Domain](./schema-identity.md)

SQL table definitions for user management, authentication, company structure, and insurance policies.

**Key Tables:**
- users, companies, company_members
- insurance_policies
- Authentication tokens (refresh_tokens, password_reset_tokens, magic_link_tokens)
- onboarding_sessions, user_agreements

### [Financial Domain](./schema-financial.md)

SQL table definitions for financial transactions and payment processing.

**Key Tables:**
- pending_payments

### [Booking Domain](./schema-booking.md)

SQL table definitions for project management, booking lifecycle, and site contact management.

**Key Tables:**
- jurisdictions (overtime calculation strategy)
- holiday_calendar (jurisdiction-specific holidays for business day calculations)
- projects (parent entity for bookings)
- bookings (status tracked via audit_log)

### [Fulfillment Domain](./schema-fulfillment.md)

SQL table definitions for time tracking, offline synchronization, and verification workflows.

**Key Tables:**
- time_log (clock-in/clock-out entries)
- time_log_offline_sync

### [Marketplace Domain](./schema-marketplace.md)

SQL table definitions for worker availability, search functionality, and booking cart management.

**Key Tables:**
- worker_availability (date ranges and patterns)
- cart_items (booking checkout)
- saved_searches (alert preferences)
- zip_codes (geo-availability calculations)

### [Notifications Domain](./schema-notifications.md)

SQL table definitions for notification delivery, preferences, and in-app inbox management.

**Key Tables:**
- notification_preferences (user-specific quiet hours and channel settings)
- notification_logs (audit trail for all notification delivery attempts)
- notification_inbox (persistent in-app notification list for PWA)

### [Messaging Domain](./schema-messaging.md)

SQL table definitions for user-to-user messaging, context-aware chat threads, and real-time communication.

**Key Tables:**
- chat_channels (context-aware conversation threads linked to Bookings or Disputes)
- chat_participants (channel membership and read status tracking)
- chat_messages (immutable message history serving as legal evidence)

### [Audit & Logging Domain](./schema-audit.md)

SQL table definitions for ratings, disputes, reliability tracking, and audit trails.

**Key Tables:**
- ratings (worker and supervisor ratings)
- disputes (timesheet dispute resolution)
- company_strikes (reliability tracking)
- audit_log (immutable action records)

---

## Related Documentation

- [Data Dictionary](./data-dictionary.md) - Human-readable business entity definitions
- [Architecture](../architecture.md) - High-level technical architecture and design decisions
- [Tech Stack](./tech-stack.md) - Technology stack, frameworks, and infrastructure choices
- [Data Integrity & Business Rules](../prd/goals-and-background-context.md#data-integrity--business-rules) - Business rationale behind database constraints and validation rules
