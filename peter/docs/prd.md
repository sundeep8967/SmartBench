# Product Requirements Document (PRD)

**Version:** 1.2 (BMAD Format)  
**Last Updated:** January 10, 2026  
**Project:** SmartBench  
**Region Scope:** Minnesota & Wisconsin (USA)  
**Platform:** B2B Web Application / PWA (Mobile Responsive)

**📋 This is a PRD Index** - This document serves as a navigation index to the Product Requirements Document. For complete PRD navigation, see [PRD Documentation Index](./prd/index.md).

---

## Core PRD Sections

- **[Executive Summary](./prd/executive-summary.md)** - High-level overview of SmartBench MVP, architectural vision, and key strategic decisions
- **[Goals and Background Context](./prd/goals-and-background-context.md)** - Business objectives, market context, and background information
- **[User Interface Design Goals](./prd/ui-design-goals.md)** - UI/UX design principles, accessibility requirements, and user experience objectives
- **[Feature Blueprint](./prd/feature-blueprint.md)** - High-level overview of all features and domains
- **[Customer Journey](./prd/customer-journey.md)** - End-to-end user journeys for Borrower, Lender, and Worker personas
- **[User Roles and Actors](./prd/user-roles-and-actors.md)** - PRD-level definition of all user roles, actors, and their relationships
- **[RBAC Acceptance Criteria](./prd/rbac-acceptance-criteria.md)** - Comprehensive role-based access control acceptance criteria
- **[Notifications & RBAC Matrix](./prd/notifications-rbac-matrix.md)** - Notification triggers, delivery methods, and RBAC matrix

---

## Epics (Implementation Order)

- **[Epic List](./prd/epic-list.md)** - Overview of all epics with brief descriptions and execution order
- **[Epic 1: Foundation & Core Infrastructure](./prd/epic-1.md)** - Project setup, authentication, company/user management, and direct Stripe payment infrastructure
- **[Epic 1.1: Project Management](./prd/epic-1-1.md)** - Enable borrowers to create, edit, and manage projects as persistent entities
- **[Epic 2: Worker Onboarding & Profile Management](./prd/epic-2.md)** - Worker profiles, roster management, insurance verification, and worker listing
- **[Epic 3: Marketplace & Search](./prd/epic-3.md)** - Worker search engine with filters and availability management
- **[Epic 4: Booking & Payment Processing](./prd/epic-4.md)** - Booking workflow, direct Stripe payment processing, payment processing, and supervisor assignment
- **[Epic 5: Time Tracking & Verification](./prd/epic-5.md)** - Time clock with GPS coordinate capture, break/lunch tracking, offline support, and supervisor verification
- **[Epic 6: Financial Operations & Admin](./prd/epic-6.md)** - Direct Stripe payment functionality including withdrawals, refunds, overtime calculations, and company dashboard
- **[Epic 7: Super Admin Dashboard](./prd/epic-7.md)** - Platform management, system-wide statistics, user/company management, and critical platform operations

---

## Related Documentation

- **[PRD Documentation Index](./prd/index.md)** - Complete navigation to all PRD sections and epics
- **[UX Documentation Index](./ux/index.md)** - User experience design, navigation structure, and front-end specifications
- **[Architecture Overview](./architecture.md)** - High-level technical architecture and design decisions
- **[Architecture Documentation Index](./architecture/index.md)** - Complete navigation to all architecture documentation
- **[Main Documentation Index](./index.md)** - Complete documentation navigation

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-10 | 1.0 | Initial BMAD-formatted PRD created from existing comprehensive PRD v18.0 | PM Agent |
| 2026-01-10 | 1.1 | Added Executive Summary & Architectural Vision, Core System Design, and Domain-Driven Vertical Slicing structure | PM Agent |
| 2026-01-10 | 1.2 | Added detailed offline error recovery workflows (FR26, FR27) and comprehensive visual diagrams | PM Agent |
| 2026-01-10 | 1.3 | Added Notifications & RBAC Matrix for implementation clarity | PM Agent |
