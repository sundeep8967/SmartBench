# Architecture Blueprints

Technical implementation blueprints organized by domain. These blueprints provide detailed "how" documentation for implementing features, focusing on logic flows, algorithms, and technical strategies.

**Note:** All database schema definitions are in the [Database Schema](../schema.md) (SQL table structures) and [Data Dictionary](../data-dictionary.md) (business entity definitions). Blueprints reference these documents rather than duplicating schema information.

---

## Booking Domain

- [Booking Blueprints Index](./booking/index.md) - Weekly progress payment system and booking-related features

## Fulfillment Domain

- [Fulfillment Blueprints Index](./fulfillment/index.md) - Offline time clock and supervisor verification features

## Financial Domain

- [Tax Adapter](./financial/tax-adapter.md) - Tax calculation adapter pattern with strategy interface

## Identity Domain

- [Identity Blueprints Index](./identity/index.md) - Authentication, onboarding, and user management features

## Marketplace Domain

- [Marketplace Blueprints Index](./marketplace/index.md) - Worker search, availability, and inventory management features

## Notifications Domain

- [Notifications Blueprints Index](./notifications/index.md) - Notification delivery, quiet hours enforcement, and channel abstraction

## Messaging Domain

- [Messaging Blueprints Index](./messaging/index.md) - Real-time chat, context-aware threads, and immutable message history

## System Domain

Cross-cutting system-level blueprints that apply across all domains.

- [Error Handling & Resilience](./system/error-handling.md) - Comprehensive error handling patterns, retry policies, circuit breakers, idempotency keys, dead letter queues, and transaction rollback strategies
- [Background Jobs & Scheduled Tasks](./system/background-jobs.md) - Specifications for all scheduled jobs including weekly payments, insurance monitoring, saved search alerts, and auto-approval
