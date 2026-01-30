# Data Dictionary

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Human-readable definitions of business entities, concepts, and domain logic in the SmartBench platform.

This document contains business-focused descriptions of entities, their relationships, state machines, and business rules. For technical schema definitions, SQL table structures, constraints, and indexes, see [schema.md](schema.md).

**ENUM Values:** All ENUM values referenced in this document (user_state, booking.status, transaction_type, etc.) are defined in [schema.md](schema.md), which serves as the single source of truth for all technical ENUM definitions. This document provides business context and state machine transitions for these values.

---

## Table of Contents

- [Identity Domain](./data-dictionary-identity.md) - Users, companies, authentication, insurance, and onboarding
- [Financial Domain](./data-dictionary-financial.md) - Stripe payment processing, transactions, refunds, and overtime calculations
- [Booking Domain](./data-dictionary-booking.md) - Projects, bookings, jurisdictions, and booking lifecycle
- [Fulfillment Domain](./data-dictionary-fulfillment.md) - Time tracking, offline sync, and verification
- [Marketplace Domain](./data-dictionary-marketplace.md) - Worker availability, cart items, saved searches, and geo-availability
- [Notifications Domain](./data-dictionary-notifications.md) - Notification preferences, delivery logs, and in-app inbox
- [Messaging Domain](./data-dictionary-messaging.md) - Chat channels, participants, and messages
- [Audit & Logging Domain](./data-dictionary-audit.md) - Ratings, disputes, strikes, and audit logs

---

## Domain Documentation

### [Identity Domain](./data-dictionary-identity.md)

Entities related to user management, authentication, company structure, and insurance policies.

**Key Entities:**
- User, Company, Company Member
- Worker State Machine
- Insurance Policy and Insurance Gate Validation
- Authentication tokens (Refresh Token, Password Reset Token, Magic Link Token)
- Onboarding Session, User Agreement

### [Financial Domain](./data-dictionary-financial.md)

Entities related to financial transactions, Stripe payment processing, refunds, and overtime calculations.

**Key Entities:**
- Stripe Payment Processing (direct to Connected Accounts)
- Financial Transaction Tracking (via Stripe API and bookings table)
- Refund Calculation Validation
- Pending Payment
- Overtime Calculation Rules

### [Booking Domain](./data-dictionary-booking.md)

Entities related to project management, booking lifecycle, and supervisor assignment.

**Key Entities:**
- Jurisdiction (overtime calculation strategy)
- Project (parent entity for bookings)
- Booking and Booking Supervisor
- Booking Status State Machine

### [Fulfillment Domain](./data-dictionary-fulfillment.md)

Entities related to time tracking, offline synchronization, and verification workflows.

**Key Entities:**
- Time Log (clock-in/clock-out entries)
- Time Log Offline Sync

### [Marketplace Domain](./data-dictionary-marketplace.md)

Entities related to worker availability, search functionality, and booking cart management.

**Key Entities:**
- Worker Availability (date ranges and patterns)
- Cart Item (booking checkout)
- Saved Search (alert preferences)
- Zip Code (geo-availability calculations)

### [Notifications Domain](./data-dictionary-notifications.md)

Entities related to notification delivery, preferences, and in-app inbox management.

**Key Entities:**
- Notification Preferences (user-specific quiet hours and channel settings)
- Notification Log (audit trail for all notification delivery attempts)
- Notification Inbox (persistent in-app notification list for PWA)

### [Messaging Domain](./data-dictionary-messaging.md)

Entities related to user-to-user messaging, context-aware chat threads, and real-time communication.

**Key Entities:**
- Chat Channel (context-aware conversation threads linked to Bookings or Disputes)
- Chat Participant (channel membership and read status tracking)
- Chat Message (immutable message history serving as legal evidence)

### [Audit & Logging Domain](./data-dictionary-audit.md)

Entities related to ratings, disputes, reliability tracking, and audit trails.

**Key Entities:**
- Rating (worker and supervisor ratings)
- Dispute (timesheet dispute resolution)
- Company Strike (reliability tracking)
- Audit Log (immutable action records)

---

## Related Documentation

- [Database Schema](./schema.md) - SQL table definitions, constraints, indexes, and foreign keys
- [Architecture](../architecture.md) - High-level technical architecture and design decisions
- [API Contracts](./api-contracts.md) - API endpoint specifications
