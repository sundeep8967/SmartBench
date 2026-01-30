# SmartBench Product Requirements Document (PRD)

**Version:** 1.2 (BMAD Format) - Updated with Issue Resolutions  
**Date:** January 10, 2026  
**Project:** SmartBench  
**Region Scope:** Minnesota & Wisconsin (USA)  
**Platform:** B2B Web Application / PWA (Mobile Responsive)

---


## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-10 | 1.0 | Initial BMAD-formatted PRD created from existing comprehensive PRD v18.0 | PM Agent |
| 2026-01-10 | 1.1 | Added Executive Summary & Architectural Vision, Core System Design, and Domain-Driven Vertical Slicing structure | PM Agent |
| 2026-01-10 | 1.2 | Added detailed offline error recovery workflows (FR26, FR27) and comprehensive visual diagrams (system architecture, data flows, state machines, user journeys) | PM Agent |
| 2026-01-10 | 1.3 | Added Notifications & RBAC Matrix for implementation clarity | PM Agent |


---

## Table of Contents

### Core Sections

- [Executive Summary](./executive-summary.md) - High-level overview of SmartBench MVP, architectural vision, and key strategic decisions for the B2B construction labor marketplace
- [Goals and Background Context](./goals-and-background-context.md) - Business objectives, market context, and background information driving the SmartBench platform development
- [User Interface Design Goals](./ui-design-goals.md) - UI/UX design principles, accessibility requirements, and user experience objectives
- [Architecture](../architecture.md) - High-level technical architecture, design patterns, architectural decisions, repository structure, development standards, and technology stack for the SmartBench platform
- [Database Schema](../architecture/schema.md) - Technical source of truth for all SQL table definitions, constraints, indexes, and foreign keys
- [Data Dictionary](../architecture/data-dictionary.md) - Human-readable definitions of business entities, concepts, state machines, and domain logic

### Epics

- [Epic List](./epic-list.md) - Overview of all epics with brief descriptions and execution order
- [Epic 1: Foundation & Core Infrastructure](./epic-1.md) - Establish project setup, authentication, company/user management, and basic database schema with direct Stripe payment processing
- [Epic 1.1: Project Management](./epic-1-1.md) - Enable borrowers to create, edit, and manage projects as persistent entities that serve as the parent entity for all bookings
- [Epic 2: Worker Onboarding & Profile Management](./epic-2.md) - Enable workers to create profiles, admins to manage rosters, and system to handle insurance verification and worker listing
- [Epic 3: Marketplace & Search](./epic-3.md) - Build worker search engine with filters and availability management to enable borrowers to find and evaluate workers
- [Epic 4: Booking & Payment Processing](./epic-4.md) - Implement booking workflow, direct Stripe payment processing, and site contact selection
- [Epic 5: Time Tracking & Verification](./epic-5.md) - Build time clock with GPS coordinate capture, break/lunch tracking, offline support, and supervisor verification workflows
- [Epic 6: Financial Operations & Admin](./epic-6.md) - Complete financial operations including direct Stripe payouts, refunds, overtime calculations, and company dashboard
- [Epic 7: Super Admin Dashboard](./epic-7.md) - Enable platform owners to manage the platform globally, view system-wide statistics, manage users and companies, and handle critical platform operations

### Additional Sections

- [Feature Blueprint](./feature-blueprint.md) - **[Overview]** High-level overview of all features and domains, showing feature relationships and how they support user goals
- [Customer Journey](./customer-journey.md) - **[User Experience]** End-to-end user journeys for Borrower, Lender, and Worker personas with decision points and pain points
- [User Roles and Actors](./user-roles-and-actors.md) - **[Requirements]** PRD-level definition of all user roles, actors, and their relationships
- [Terminology Glossary](./glossary.md) - **[Reference]** Standardized terminology definitions for consistent use across all documentation
- [RBAC Acceptance Criteria](./rbac-acceptance-criteria.md) - **[Requirements & Implementation Guide]** Comprehensive role-based access control acceptance criteria for all features across all epics
- [Checklist Results Report](./checklist-results.md) - **[Review Artifact]** Comprehensive analysis of PRD completeness, quality assessment, and recommendations for improvement
- [Notifications & RBAC Matrix](./notifications-rbac-matrix.md) - **[Requirements & Implementation Guide]** Notification triggers, delivery methods, and role-based access control matrix for implementation clarity
- [Next Steps](./next-steps.md) - **[Implementation Handoff]** Recommended next actions and priorities for continuing development
- [Data Retention Policy](./data-retention-policy.md) - **[Compliance]** Data retention periods, deletion workflows, and compliance requirements
- [Document Reference Map](../document-reference-map.md) - **[Navigation]** Visual reference map showing document relationships and navigation guide

### UX & Front-End Design

- **[UX Documentation Index](../ux/index.md)** - Complete navigation to all UX and front-end design documentation
- [UX Analysis](../ux/ux-analysis.md) - User personas, goals, pain points, and key user flows analysis
- [Navigation Structure](../ux/navigation-structure.md) - Information architecture and sidebar navigation design
- [Front-End Specification](../ux/front-end-specification.md) - Design system, component specifications, wireframes, and interaction patterns

### Architecture Blueprints

#### Booking Domain

- [Weekly Payments](../architecture/blueprints/booking/weekly-payments.md) - Weekly progress payment system for long-term bookings with insurance gating and Pay or Release model

#### Fulfillment Domain

- [Time Tracking Verification](../architecture/blueprints/fulfillment/time-tracking-verification.md) - Time tracking and verification system with Negotiation Loop and offline support

#### Identity Domain

- [Authentication System](../architecture/blueprints/identity/authentication-system.md) - JWT-based authentication with password hashing, RBAC, and session management
- [Company Onboarding](../architecture/blueprints/identity/company-onboarding.md) - Multi-step onboarding wizard for company setup with KYB verification and solopreneur support
- [Magic Link Onboarding](../architecture/blueprints/identity/magic-link-onboarding.md) - SMS magic link system for passwordless onboarding and supervisor verification workflows
- [Unified User Model](../architecture/blueprints/identity/unified-user-model.md) - Many-to-many User-Company relationship model supporting solopreneurs and multi-company users

#### Marketplace Domain

- [Availability Management](../architecture/blueprints/marketplace/availability-management.md) - Worker availability date ranges and date blocking with automatic locking
- [Geo-Availability](../architecture/blueprints/marketplace/geo-availability.md) - Distance-based worker filtering using zip codes and Haversine formula for radius calculations
- [Optimistic Concurrency](../architecture/blueprints/marketplace/optimistic-concurrency.md) - Optimistic concurrency approach for worker availability with final availability check at checkout to prevent double-booking
- [Saved Searches & Alerts](../architecture/blueprints/marketplace/saved-searches-alerts.md) - Saved search criteria with timezone-aware alerts (daily digest and instant notifications)
- [Worker Search Engine](../architecture/blueprints/marketplace/worker-search-engine.md) - Comprehensive worker search with filters, privacy controls, and performance optimization

#### Financial Domain

- [Financial Architecture](../architecture/financial-architecture.md) - Stripe-native payment processing with direct Stripe Connect integration

**Note:** Visual diagrams are also embedded inline in relevant sections (Architecture, Goals and Background Context) for context-specific flows.

---

**[↑ Back to Top](#smartbench-product-requirements-document-prd)** | **[← Main Documentation Index](../index.md)**
