# Architecture

**Version:** 1.0  
**Last Updated:** January 2026

**📋 This is an Architecture Decisions Index** - This document serves as a navigation index to all architectural decision documents (sections A-J). For complete architecture documentation navigation, see [Architecture Documentation Index](./architecture/index.md).

This document describes the high-level technical architecture and design decisions for the SmartBench platform. For database schema definitions, see [schema.md](./architecture/schema.md) for SQL table structures and [data-dictionary.md](./architecture/data-dictionary.md) for business entity definitions.

**Note:** This architecture adheres to the 5 Core Decisions defined in the [Executive Summary](./prd/executive-summary.md#executive-summary-of-key-decisions). Developers should read the PRD for the "Why" behind these decisions, and this Architecture document for the "How" they are implemented.

---

## System Architecture Overview

This section provides a high-level **overview** of the SmartBench **system architecture**. The platform follows a **Modular Monolith** architecture pattern, designed for scalability, security, and mobile reliability:

- **Frontend:** Next.js (App Router) - Mobile-responsive PWA that communicates with backend via REST/GraphQL APIs
- **Backend:** NestJS (Dockerized) - Handles all API logic, replaces Next.js API Routes. Deployed as a containerized service to prevent vendor lock-in, solve database connection pooling issues, and enable long-running processes
- **Mobile:** CapacitorJS wrapper around Next.js frontend - Provides native mobile app capabilities with access to native plugins (SQLite for offline storage, background geolocation)
- **Database:** PostgreSQL with Row Level Security (RLS) - Enforces multi-tenant data isolation at the database level

For complete technology stack details, see [Tech Stack](./architecture/tech-stack.md).

---

## Row Level Security (RLS) Strategy

**Decision:** Implement PostgreSQL Row Level Security (RLS) to enforce strict multi-tenant data isolation at the database level, preventing application-level data leakage.

**Implementation:**

1. **JWT Token Claims:** JWT tokens contain a `company_id` claim identifying the user's active company context
2. **NestJS Middleware:** On every request, NestJS middleware extracts `company_id` from the JWT token
3. **Session Variable:** Before executing any database query, the application sets a PostgreSQL session variable:
   ```sql
   SET LOCAL app.current_company_id = :company_id
   ```
4. **RLS Policies:** All multi-tenant tables have RLS policies enabled that automatically filter rows based on `current_setting('app.current_company_id')`
5. **Automatic Filtering:** All SELECT, INSERT, UPDATE, and DELETE operations are automatically scoped to the current company, preventing cross-tenant data access

**Benefits:**
- **Security:** Database-level enforcement prevents application bugs from causing data leakage
- **Simplicity:** Application code doesn't need to manually add `WHERE company_id = ?` clauses to every query
- **Audit:** All data access is automatically logged and traceable to company context

**Related Documentation:** See [Security Architecture](./architecture/security-architecture.md) for complete security implementation details.

---

## Architecture Decision Documents

The architecture is organized into the following key decision areas:

- **[A. The "Membership" User Model (Unified User)](./architecture/blueprints/identity/unified-user-model.md)** - Many-to-many user-company relationship via Company_Member junction table, supporting multi-role users and multi-company membership
- **[B. Global Scaling Strategy (The "No Rewrite" Rules)](./architecture/global-scaling-strategy.md)** - Project-booking relationships, jurisdiction policy engine, timezones, currency, and tax architecture
- **[C. Financial Architecture (Stripe Direct Payments)](./architecture/financial-architecture.md)** - Stripe Connect Express integration, data integrity, and recurring payments
- **[D. Offline Time Clock & Trust](./architecture/offline-time-clock-trust.md)** - Trust but audit model for offline sync
- **[E. Repository Structure & Development Standards](./architecture/repository-structure-development-standards.md)** - Monorepo structure, modular monolith architecture, and testing requirements
- **[F. Error Handling & Resilience](./architecture/error-handling-resilience.md)** - Comprehensive error handling strategy with retry policies and circuit breakers
- **[G. Security Architecture](./architecture/security-architecture.md)** - Defense-in-depth security with authentication, encryption, rate limiting, and audit logging
- **[H. Observability & Monitoring](./architecture/observability-monitoring.md)** - SLOs, metrics, logging, tracing, and alerting
- **[I. Database Migrations](./architecture/database-migrations.md)** - Zero-downtime migration strategy and rollback procedures

---

## Related Documentation

This section provides links to **related documentation** that complements this architecture overview.

- [PRD Index](./prd/index.md) - Product requirements and feature specifications
- [Architecture Documentation Index](./architecture/index.md) - Complete navigation to all architecture documentation
- [Tech Stack](./architecture/tech-stack.md) - Complete technology stack specification including versions, infrastructure, and external services
- [Database Schema](./architecture/schema.md) - SQL table definitions, constraints, indexes, and foreign keys
- [Data Dictionary](./architecture/data-dictionary.md) - Business entity definitions, state machines, and domain logic
- [API Contracts](./architecture/api-contracts.md) - API endpoint specifications, request/response schemas, and authentication requirements
- [Test Strategy](./architecture/test-strategy.md) - Comprehensive test strategy covering unit, integration, E2E, and performance testing
- [Deployment Runbook](./architecture/deployment-runbook.md) - Deployment procedures, database migrations, rollback procedures, and troubleshooting
- [Architecture Blueprints](./architecture/blueprints/) - Detailed technical implementation blueprints
- [Document Reference Map](./document-reference-map.md) - Visual reference map showing document relationships

---

## Migration Notes

**Simplified MVP Refactor (January 2026):** Significant architectural changes were made to streamline workflows, removing complex automation in favor of simpler, chat-based processes. For complete details on removed concepts (Finite Edit Protocol, Digital Courtroom, Evidence Locker UI, etc.) and their replacements, see [Architecture Index - Migration Notes](./architecture/index.md#migration-notes).