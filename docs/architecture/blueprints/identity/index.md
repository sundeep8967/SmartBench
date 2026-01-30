# Identity Domain Blueprints

Technical implementation blueprints for the Identity domain.

## Blueprints

- [Authentication System](./authentication-system.md) - JWT-based authentication with password hashing, RBAC, and session management
- [Company Onboarding](./company-onboarding.md) - Multi-step onboarding wizard for company setup with KYB verification and solopreneur support
- [Magic Link Onboarding](./magic-link-onboarding.md) - SMS magic link system for passwordless onboarding and supervisor verification workflows
- [Unified User Model](./unified-user-model.md) - Many-to-many User-Company relationship model via Company_Member junction table, supporting solopreneurs with multiple roles and users belonging to multiple companies
