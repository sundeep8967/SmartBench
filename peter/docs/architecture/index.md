# Architecture Documentation Index

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Comprehensive index of all architecture documentation for the SmartBench platform.

This document provides navigation to all technical architecture documentation, organized by category.

---

## Core Architecture Documents

- **[Architecture Overview](../architecture.md)** - High-level technical architecture and design decisions index
- **[Tech Stack](./tech-stack.md)** - Technology stack, frameworks, and infrastructure choices
- **[API Contracts](./api-contracts.md)** - API endpoint specifications and contracts
- **[Test Strategy](./test-strategy.md)** - Comprehensive test strategy covering unit, integration, E2E, and performance testing
- **[Deployment Runbook](./deployment-runbook.md)** - Deployment procedures, database migrations, rollback procedures, and troubleshooting
- **[Error Message Catalog](./error-message-catalog.md)** - Centralized catalog of all user-facing error messages
- **[Timezone Handling](./timezone-handling.md)** - Comprehensive guide to timezone handling, libraries, and conversion patterns
- **[Performance Optimization](./performance-optimization.md)** - Database performance optimization, composite indexes, and query optimization strategies

### Architecture Decision Documents

The architecture is organized into key decision areas:

- **[A. The "Membership" User Model (Unified User)](./blueprints/identity/unified-user-model.md)** - Many-to-many user-company relationship via Company_Member junction table, supporting multi-role users and multi-company membership
- **[B. Global Scaling Strategy (The "No Rewrite" Rules)](./global-scaling-strategy.md)** - Project-booking relationships, jurisdiction policy engine, timezones, currency, and tax architecture
- **[C. Financial Architecture (Stripe Direct Payments)](./financial-architecture.md)** - Stripe Connect Express integration, data integrity, and recurring payments
- **[D. Offline Time Clock & Trust](./offline-time-clock-trust.md)** - Trust but audit model for offline sync
- **[E. Repository Structure & Development Standards](./repository-structure-development-standards.md)** - Monorepo structure, modular monolith architecture, and testing requirements
- **[F. Error Handling & Resilience](./error-handling-resilience.md)** - Comprehensive error handling strategy with retry policies and circuit breakers
- **[G. Security Architecture](./security-architecture.md)** - Defense-in-depth security with authentication, encryption, rate limiting, and audit logging
- **[H. Observability & Monitoring](./observability-monitoring.md)** - SLOs, metrics, logging, tracing, and alerting
- **[I. Database Migrations](./database-migrations.md)** - Zero-downtime migration strategy and rollback procedures

---

## Database Documentation

### Database Schema

- **[Database Schema Index](./schema.md)** - Technical source of truth for all SQL table definitions, constraints, indexes, and foreign keys

**Domain-Specific Schema Files:**
- [Identity Domain](./schema-identity.md) - Users, companies, authentication, insurance, and onboarding
- [Financial Domain](./schema-financial.md) - Transactions, refunds, and payment processing
- [Booking Domain](./schema-booking.md) - Projects, bookings, jurisdictions, and booking lifecycle
- [Fulfillment Domain](./schema-fulfillment.md) - Time tracking, offline sync, and verification
- [Marketplace Domain](./schema-marketplace.md) - Worker availability, cart items, saved searches, and geo-availability
- [Notifications Domain](./schema-notifications.md) - Notification preferences, delivery logs, and in-app inbox
- [Messaging Domain](./schema-messaging.md) - Chat channels, participants, and messages
- [Audit & Logging Domain](./schema-audit.md) - Ratings, disputes, strikes, and audit logs

### Data Dictionary

- **[Data Dictionary Index](./data-dictionary.md)** - Human-readable definitions of business entities, concepts, and domain logic

**Domain-Specific Data Dictionary Files:**
- [Identity Domain](./data-dictionary-identity.md) - Users, companies, authentication, insurance, and onboarding
- [Financial Domain](./data-dictionary-financial.md) - Transactions, refunds, and overtime calculations
- [Booking Domain](./data-dictionary-booking.md) - Projects, bookings, jurisdictions, and booking lifecycle
- [Fulfillment Domain](./data-dictionary-fulfillment.md) - Time tracking, offline sync, and verification
- [Marketplace Domain](./data-dictionary-marketplace.md) - Worker availability, cart items, saved searches, and geo-availability
- [Notifications Domain](./data-dictionary-notifications.md) - Notification preferences, delivery logs, and in-app inbox
- [Messaging Domain](./data-dictionary-messaging.md) - Chat channels, participants, and messages
- [Audit & Logging Domain](./data-dictionary-audit.md) - Ratings, disputes, strikes, and audit logs

---

## Architecture Blueprints

- **[Blueprints Index](./blueprints/index.md)** - Technical implementation blueprints organized by domain

**Domain Blueprints:**
- [Booking Domain Blueprints](./blueprints/booking/index.md) - Weekly progress payment system and booking-related features
- [Fulfillment Domain Blueprints](./blueprints/fulfillment/index.md) - Offline time clock and supervisor verification features
- [Financial Domain Blueprints](./blueprints/financial/tax-adapter.md) - Tax calculation adapter pattern
- [Identity Domain Blueprints](./blueprints/identity/index.md) - Authentication, onboarding, and user management features
- [Marketplace Domain Blueprints](./blueprints/marketplace/index.md) - Worker search, availability, and inventory management features

---

## Quick Navigation

**Need database schema?** → See [Database Schema](./schema.md) for SQL definitions or [Data Dictionary](./data-dictionary.md) for business concepts

**Implementing a feature?** → Check relevant [Architecture Blueprints](./blueprints/) for technical details

**Understanding the system?** → Read [Architecture Overview](../architecture.md) for high-level design

**Need API specifications?** → See [API Contracts](./api-contracts.md) for endpoint definitions

---

## Migration Notes

### Simplified MVP Refactor (January 2026)

This section documents significant architectural changes made during the "Simplified MVP" refactor that removed complex workflows in favor of streamlined processes.

#### Removed Concepts

The following concepts were removed and replaced with simpler alternatives:

1. **Finite Edit Protocol** - Removed in favor of a linear 3-step Negotiation Loop
2. **Digital Courtroom** - Removed in favor of chat-based dispute resolution
3. **Step 4 Hard Stop** - Removed as part of the simplified workflow
4. **Evidence Locker UI** - Removed; evidence is now injected as system messages in chat
5. **Settlement Offer Buttons** - Removed from dispute resolution interface
6. **Legal Hold Buttons** - Removed from dispute resolution interface
7. **Pending_Supervisor_Final_Review Status** - Removed from schema; replaced with Negotiation Loop statuses

#### New Implementation

**Negotiation Loop (3-Step Linear Workflow):**
- **Step 1:** Supervisor edits time → `Pending_Worker_Review` (with required note)
- **Step 2:** Worker accepts → `Verified` OR rejects with comment → `Pending_Supervisor_Reevaluation`
- **Step 3:** Supervisor corrects → `Pending_Worker_Review` (loop) OR files dispute → `Disputed`

**Chat-Based Dispute Resolution:**
- Evidence automatically injected as system messages in chat stream
- No separate Evidence Locker UI component
- Super Admin retains read-only evidence access via dashboard (see [Epic 7.9](../prd/epic-7.md#story-79-super-admin-evidence-view))

**Fork in the Road:**
- Mandatory decision at dispute filing
- Option A: Booking remains `Active`, only disputed shift frozen
- Option B: Booking `Cancelled`, total freeze (shift + penalty)

**Weekly Payment "Pay or Release" Model (January 2026):**
- **Previous Model:** State-based payment failure handling with `Funding_At_Risk` and `Payment_Paused` statuses, including a Thursday 10 AM grace period
- **New Model:** Time-based "Pay or Release" model with three checkpoints:
  - **Wednesday 10:00 AM (Project Time):** Payment attempt - if success, extend `funded_period_end`; if failure, status remains `Active` (no status change), send "Action Required" notification
  - **Wednesday 2:00 PM (Project Time):** Final Warning notification if still unpaid
  - **Wednesday 11:59 PM / Thursday 12:00 AM (Project Time):** Hard Cutoff - release worker (set `end_date` to Sunday, status to `Completed`, cancel future shifts), notify all parties
- **Key Change:** Payment failures no longer change booking status to intermediate states. Booking remains `Active` until hard cutoff, at which point it transitions to `Completed` (worker released). This simplifies the state machine and provides clear "pay or release" behavior.
- **Removed Statuses:** `Funding_At_Risk` and payment-failure `Payment_Paused` (note: `Payment_Paused_Dispute` remains for Option A disputes, which is a separate workflow)

#### Documentation References

For detailed information on these changes, see:
- [Epic 5: Time Tracking & Verification](../prd/epic-5.md) - Negotiation Loop and dispute resolution workflows
- [Epic 7.9: Super Admin Evidence View](../prd/epic-7.md#story-79-super-admin-evidence-view) - Evidence access for Super Admin
- [Schema - Fulfillment Domain](./schema-fulfillment.md) - Updated status ENUM values
- [Weekly Payments Blueprint](./blueprints/booking/weekly-payments.md#the-wednesday-rule-timeline-pay-or-release-model) - Pay or Release model implementation
- [Epic 4: Story 4.5](../prd/epic-4.md#story-45-weekly-progress-payment-system) - Weekly progress payment system requirements

#### Removal Notes in Documentation

Multiple files contain explicit removal notes documenting these changes. These notes are intentional and should remain for:
- Developer reference during implementation
- Historical context for future changes
- Ensuring understanding of architectural decisions

**Files with removal notes:**
- `docs/ux/front-end-specification.md` - Evidence Locker UI removal
- `docs/architecture/test-strategy.md` - Evidence Locker UI removal
- `docs/architecture/api-contracts.md` - Evidence Locker UI and endpoint removals
- `docs/prd/epic-5.md` - Evidence Locker UI removal
- `docs/prd/epic-7.md` - Evidence Locker UI removal context

---

## Related Documentation

- [PRD Index](../prd/index.md) - Product Requirements Document with all epics and requirements
- [Main Documentation Index](../index.md) - Complete documentation navigation

---

**[↑ Back to Top](#architecture-documentation-index)** | **[← Main Documentation Index](../index.md)**
