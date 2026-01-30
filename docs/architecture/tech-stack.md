# Technology Stack

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Complete technology stack specification including versions, infrastructure, and external services for the SmartBench platform.

This document serves as the single source of truth for all technology choices, versions, and infrastructure decisions. All development work should reference this document to ensure consistency across the codebase.

**For architectural patterns and design decisions, see [Architecture](../architecture.md).**

---

## Technology Stack Table

| Category | Technology | Version | Purpose | Notes |
|----------|-----------|---------|---------|-------|
| **Runtime** | Node.js | 20.11.0 LTS (recommended) | Backend runtime | TypeScript compilation target |
| **Frontend Framework** | Next.js | 14.x (App Router) | Frontend framework | Mobile-responsive PWA |
| **Frontend Library** | React | (via Next.js) | UI components | Component-based UI |
| **Mobile Wrapper** | CapacitorJS | Latest | Native mobile app wrapper | Provides access to native plugins including `capacitor-sqlite` for offline data storage (prevents iOS auto-deletion) and `capacitor-background-geolocation` for location tracking |
| **Language** | TypeScript | Latest stable | Type-safe development | Used across frontend and backend |
| **Backend Framework** | NestJS | Latest | Backend API framework | Dockerized deployment, replaces Next.js API Routes |
| **Database** | PostgreSQL | 15.x (recommended) | Primary database | Relational database with proper indexing. **Required extensions:** `pg_trgm` (fuzzy text search), `cube` and `earthdistance` (geo-location/radius search), or `postgis` (alternative to earthdistance). Extensions must be installed via database migration: `CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS earthdistance;` |
| **Database Security** | PostgreSQL Row Level Security (RLS) | (PostgreSQL 15.x feature) | Multi-tenant data isolation | Enforces data access at database level using `company_id` from JWT session variables |
| **ORM** | Drizzle ORM | Latest | Database abstraction | Type safety and SQL-like control |
| **Validation** | Zod | Latest | Schema validation | Shared validation schemas between frontend and backend |
| **Caching** | Redis | Latest stable | Session & cache | Session management and frequently accessed data |
| **File Storage** | S3-compatible | - | Object storage | Insurance documents, worker photos, project photos |
| **Background Jobs & Workflows** | BullMQ (Redis) | Latest | Queue-based job processing | Queue-based job processing for Notifications module. Handles transactional, bursty notifications (e.g., mass "Wednesday Rule" alerts) with rolling windows to prevent thundering herd issues, rate limiting, and controlled concurrency |
| **Background Jobs & Workflows** | Inngest | Latest | Scheduled jobs & durable workflows | Timezone-aware scheduling, durable workflows for multi-step processes |
| **Real-Time Communication** | Socket.io | Latest | WebSocket server for real-time messaging | Real-time bi-directional events for Messaging module. Manages persistent WebSocket connections, rooms, and real-time message delivery |

## External Services

| Service | Provider | Purpose | Notes |
|---------|----------|---------|-------|
| **SMS Provider** | Twilio | SMS delivery and phone verification | Reliable SMS delivery and phone number verification |
| **Email Provider** | SendGrid | Transactional emails | Or similar service for transactional emails |
| **Geofencing** | Google Maps API | GPS coordinate capture and distance calculations | Or similar service for GPS coordinate capture and distance calculations (not used for time clock validation - supervisor verification is the source of truth) |
| **Payment Processing** | Stripe Connect | Payment processing and KYC | Express accounts with Manual Payouts configuration |

## Libraries

| Library | Purpose | Notes |
|---------|---------|-------|
| **Dinero.js** | Financial calculations | Prevents floating point errors, all monetary calculations use this library |
| **Luxon** | Timezone-aware date/time handling | Timezone conversions, DST handling, and date/time calculations across all project timezones |
| **PDF Generation** | Document generation | Generating booking confirmations and lien waivers |

## Monitoring & Logging

| Tool | Purpose | Notes |
|------|---------|-------|
| **APM (Application Performance Monitoring)** | Performance monitoring | API response times and error tracking |
| **Structured Logging** | Logging | Financial transactions and audit trails |

## Infrastructure

### Development Environment
- **Package Manager:** npm, yarn, or pnpm
- **Version Control:** Git
- **CI/CD:** (To be specified)

### Deployment
- **Hosting:** (To be specified)
- **Database Hosting:** (To be specified)
- **Cache Hosting:** (To be specified)
- **File Storage:** S3-compatible storage service

---

## Version Management

**Note:** Specific version numbers should be maintained in `package.json` and other dependency files. This document reflects the recommended versions for new development. When updating versions, ensure compatibility across all stack components.

---

## Related Documentation

- [Architecture](../architecture.md) - High-level technical architecture and design decisions
- [Database Schema](./schema.md) - Database schema definitions
- [API Contracts](./api-contracts.md) - API endpoint specifications
