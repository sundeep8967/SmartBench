# SmartBench Documentation

**Welcome to the SmartBench documentation.** This index provides navigation to all documentation organized by the BMad Method v6 structure.

**Important for Agents:** This documentation uses a dual-index structure. When exploring the `/docs` folder:
- **Start with this file** (`docs/index.md`) for overall documentation navigation
- **For PRD:** Both `docs/prd.md` (PRD index) and `docs/prd/index.md` (complete PRD documentation index) serve as navigation points
- **For UX:** `docs/ux/index.md` (UX documentation index) provides navigation to all UX and front-end design documentation
- **For architecture:** Both `docs/architecture.md` (architectural decisions index) and `docs/architecture/index.md` (complete architecture documentation index) serve as navigation points

---

## Documentation Structure

### Phase 2: Product Requirements (What & Why)

The Product Requirements Document (PRD) defines what we're building and why.

**PRD Documentation (Dual Index Structure):**
- **[PRD Overview](./prd.md)** - **START HERE** - PRD index with links to core sections and all epics
- **[PRD Documentation Index](./prd/index.md)** - Complete navigation index of all PRD files (detailed sections, epics, blueprints, etc.)

**Note:** Both `prd.md` and `prd/index.md` serve as navigation indexes. The `prd.md` file provides quick access to core sections and epics, while `prd/index.md` provides comprehensive navigation to all PRD documentation.

### Phase 3: Technical Design (How)

Technical documentation describing how the system is built.

**Architecture Documentation (Dual Index Structure):**
- **[Architecture Overview](./architecture.md)** - **START HERE** - High-level architecture decisions index with links to all architectural decision documents (A-J)
- **[Architecture Documentation Index](./architecture/index.md)** - Complete navigation index of all architecture files (schemas, blueprints, tech stack, etc.)

**Note:** Both `architecture.md` and `architecture/index.md` serve as navigation indexes. The `architecture.md` file focuses on architectural decisions, while `architecture/index.md` provides comprehensive navigation to all technical documentation.
- **[Database Schema](./architecture/schema.md)** - Technical source of truth for all SQL table definitions, constraints, indexes, and foreign keys (includes technical conventions, business rule enforcement policy, and RLS)
  - [Identity Domain](./architecture/schema-identity.md) | [Financial Domain](./architecture/schema-financial.md) | [Booking Domain](./architecture/schema-booking.md)
  - [Fulfillment Domain](./architecture/schema-fulfillment.md) | [Marketplace Domain](./architecture/schema-marketplace.md) | [Notifications Domain](./architecture/schema-notifications.md) | [Messaging Domain](./architecture/schema-messaging.md)
  - [Audit & Logging Domain](./architecture/schema-audit.md)
- **[Data Dictionary](./architecture/data-dictionary.md)** - Human-readable definitions of business entities, concepts, and domain logic
  - [Identity Domain](./architecture/data-dictionary-identity.md) | [Financial Domain](./architecture/data-dictionary-financial.md) | [Booking Domain](./architecture/data-dictionary-booking.md)
  - [Fulfillment Domain](./architecture/data-dictionary-fulfillment.md) | [Marketplace Domain](./architecture/data-dictionary-marketplace.md) | [Notifications Domain](./architecture/data-dictionary-notifications.md) | [Messaging Domain](./architecture/data-dictionary-messaging.md)
  - [Audit & Logging Domain](./architecture/data-dictionary-audit.md)
- **[Tech Stack](./architecture/tech-stack.md)** - Technology stack, frameworks, and infrastructure choices
- **[API Contracts](./architecture/api-contracts.md)** - API endpoint specifications and contracts
- **[Test Strategy](./architecture/test-strategy.md)** - Comprehensive test strategy covering unit, integration, E2E, and performance testing
- **[Deployment Runbook](./architecture/deployment-runbook.md)** - Deployment procedures, database migrations, rollback procedures, and troubleshooting

### Phase 2-3: User Experience Design (What & How Users Interact)

UX documentation defining how users interact with the platform, navigation structure, and front-end specifications.

**UX Documentation:**
- **[UX Documentation Index](./ux/index.md)** - **START HERE** - Complete navigation index of all UX and front-end design documentation
- **[UX Analysis](./ux/ux-analysis.md)** - User personas, goals, pain points, and key user flows
- **[Navigation Structure](./ux/navigation-structure.md)** - Information architecture and sidebar navigation design
- **[Front-End Specification](./ux/front-end-specification.md)** - Design system, component specifications, wireframes, and interaction patterns

#### Architecture Blueprints

- **[Blueprints Index](./architecture/blueprints/index.md)** - Complete index of all architecture blueprints organized by domain

**Quick Links by Domain:**
- [Booking Domain](./architecture/blueprints/booking/index.md) - Weekly progress payment system and booking-related features
- [Fulfillment Domain](./architecture/blueprints/fulfillment/index.md) - Offline time clock and supervisor verification features
- [Financial Domain](./architecture/blueprints/financial/tax-adapter.md) - Tax calculation adapter pattern
- [Identity Domain](./architecture/blueprints/identity/index.md) - Authentication, onboarding, and user management features
- [Marketplace Domain](./architecture/blueprints/marketplace/index.md) - Worker search, availability, and inventory management features
- [System Domain](./architecture/blueprints/system/error-handling.md) - Error handling, background jobs, and cross-cutting system features (see [Error Handling](./architecture/blueprints/system/error-handling.md), [Background Jobs](./architecture/blueprints/system/background-jobs.md))

### Phase 4: Execution Tasks

Epic definitions and user stories for implementation.

- **[Epic List](./prd/epic-list.md)** - Overview of all epics with brief descriptions and execution order
- **[All Epics](./prd/index.md#epics)** - Complete list of all epics with acceptance criteria

---

## Quick Navigation

**Starting a new feature?** → Start with [PRD Overview](./prd.md) for quick access to epics, then see [PRD Index](./prd/index.md) for complete requirements

**Designing the UI?** → See [UX Documentation Index](./ux/index.md) for user analysis, navigation structure, and front-end specifications

**Need database schema?** → See [Database Schema](./architecture/schema.md) for SQL definitions or [Data Dictionary](./architecture/data-dictionary.md) for business concepts

**Implementing a feature?** → Check relevant [Architecture Blueprints](./architecture/blueprints/) for technical details

**Understanding the system?** → Start with [Architecture Overview](./architecture.md) for architectural decisions, then see [Architecture Index](./architecture/index.md) for complete technical documentation

**Deploying to production?** → See [Deployment Runbook](./architecture/deployment-runbook.md) for deployment procedures, migrations, and rollback procedures

**Setting up testing?** → See [Test Strategy](./architecture/test-strategy.md) for comprehensive testing guidelines and requirements

---

## File Structure

```
docs/
├── index.md (this file - main documentation index)
├── architecture.md (architecture decisions index - links to decision documents A-J)
├── prd.md (PRD index - links to core sections and epics)
├── architecture/
│   ├── index.md (architecture documentation index - comprehensive navigation)
│   ├── schema.md (schema index)
│   ├── schema-*.md (domain-specific schema files)
│   ├── data-dictionary.md (data dictionary index)
│   ├── data-dictionary-*.md (domain-specific data dictionary files)
│   ├── tech-stack.md
│   ├── api-contracts.md
│   └── blueprints/
│       ├── booking/
│       ├── fulfillment/
│       ├── identity/
│       ├── marketplace/
│       └── system/
└── prd/
    ├── index.md
    ├── executive-summary.md
    ├── goals-and-background-context.md
    ├── feature-blueprint.md
    ├── customer-journey.md
    ├── user-roles-and-actors.md
    ├── rbac-acceptance-criteria.md
    ├── epic-*.md
    └── [other PRD sections]
└── ux/
    ├── index.md (UX documentation index)
    ├── ux-analysis.md
    ├── navigation-structure.md
    └── front-end-specification.md
```

For a complete file tree, see [FILE_TREE.txt](./FILE_TREE.txt).
