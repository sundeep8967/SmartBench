# Feature Blueprint: Unified User Model
**Domain:** Identity
**Related Epics:** [Epic 1: Foundation & Core Infrastructure](../../../prd/epic-1.md), [Epic 2: Worker Onboarding & Profile Management](../../../prd/epic-2.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Goals and Background Context](../../../prd/goals-and-background-context.md) - Business goals and context for the unified user model
- [User Roles and Actors](../../../prd/user-roles-and-actors.md) - Complete role definitions, capabilities, relationships, and business context
- [RBAC Acceptance Criteria](../../../prd/rbac-acceptance-criteria.md) - Feature-level permission matrices
- [Epic 1: Foundation & Core Infrastructure](../../../prd/epic-1.md) - Core infrastructure requirements
- [Epic 2: Worker Onboarding & Profile Management](../../../prd/epic-2.md) - Worker onboarding and profile requirements

## Overview

### Business Context

We need a Solopreneur to act as Admin, Supervisor, and Worker simultaneously. The system supports **Sequential Employment** (worker leaves Company A, then joins Company B) but prevents **Concurrent Employment** (working for both companies simultaneously). A user can only have one `'Active'` company membership at a time.

### Architectural Decision

**Do not link `User` directly to `Company`.** Use a Many-to-Many relationship via `Company_Member` junction table. The `User` table does NOT have a direct `Company_ID` foreign key. The User-Company relationship is managed exclusively through the `Company_Member` junction table.

This design enables:
- **Multi-role support:** A single user can hold multiple roles (Worker, Supervisor, Manager, Admin) within the same company
- **Multi-company support:** A user can belong to multiple companies with different roles in each
- **Flexible role management:** Roles are stored per company membership, allowing independent role assignment across companies

## Technical Strategy (The "How")

### Database Schema

**Schema Reference:** See [schema-identity.md](../../schema-identity.md) for complete table definitions, indexes, constraints, and foreign keys:
- `users` - Core user identity
- `companies` - Company information
- `company_members` - Junction table for User-Company relationships (stores roles as JSONB array)

### Solopreneur Registration Flow

**Atomic Transaction:**
```typescript
async function createSolopreneurAccount(userData: {
  mobile_number: string; // Primary identifier (phone-first authentication)
  email?: string; // Optional
  password: string;
  companyName: string;
  ein: string;
  address: string;
}) {
  return await db.transaction(async (trx) => {
    // 1. Create User (phone-first: mobile_number is primary identifier)
    const user = await trx('users').insert({
      mobile_number: userData.mobile_number,
      email: userData.email || null, // Optional
      password_hash: await hashPassword(userData.password),
      user_state: 'Pending_Profile'
    }).returning('*');

    // 2. Create Company
    const company = await trx('companies').insert({
      name: userData.companyName,
      ein: userData.ein,
      address: userData.address,
      default_currency: 'USD'
    }).returning('*');

    // 3. Create Company_Member with all roles
    await trx('company_members').insert({
      user_id: user[0].id,
      company_id: company[0].id,
      roles: ['Worker', 'Supervisor', 'Admin'], // Auto-assign all roles (Manager not included)
      status: 'Active'
    });


    return { user: user[0], company: company[0] };
  });
}
```

### Role-Based Access Control (RBAC)

**Role Checking Middleware:**
```typescript
function requireRole(requiredRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const companyId = req.params.companyId || req.body.company_id;

    const membership = await db('company_members')
      .where({ user_id: userId, company_id: companyId, status: 'Active' })
      .first();

    if (!membership) {
      return res.status(403).json({ error: 'User not a member of this company' });
    }

    const userRoles = membership.roles as string[];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.userRoles = userRoles;
    req.companyId = companyId;
    next();
  };
}

// Usage examples:
router.get('/financial-dashboard', requireRole(['Admin']), getFinancialDashboard); // Admin only - Manager cannot access financial dashboard
router.post('/verify-hours', requireRole(['Supervisor', 'Manager', 'Admin']), verifyHours); // All can verify
router.post('/bookings', requireRole(['Admin', 'Manager']), createBooking); // Admin and Manager can create bookings
router.get('/my-profile', requireRole(['Worker', 'Admin']), getProfile);
```

### Querying User's Companies

**Get All Companies for a User:**
```sql
SELECT 
  c.*,
  cm.roles,
  cm.status as membership_status
FROM companies c
JOIN company_members cm ON c.id = cm.company_id
WHERE cm.user_id = :user_id
  AND cm.status = 'Active';
```

**Get All Users for a Company:**
```sql
SELECT 
  u.*,
  cm.roles,
  cm.status as membership_status
FROM users u
JOIN company_members cm ON u.id = cm.user_id
WHERE cm.company_id = :company_id
  AND cm.status = 'Active';
```

## Edge Cases & Failure Handling

### Multi-Company Users

**Scenario:** User belongs to multiple companies with different roles
- **Solution:** Each `Company_Member` record stores roles independently
- **Query:** Always filter by both `user_id` AND `company_id` when checking roles
- **UI:** User must select which company context they're operating in

### Role Transitions

**Scenario:** Admin removes a role from a user
- **Solution:** Update the `roles` JSONB array in `Company_Member`
- **Validation:** Ensure at least one role remains, or change status to `Suspended`
- **Audit:** Log role changes in `Audit_Log` table

### Status Changes

**Scenario:** User status transitions (e.g., `Invited` → `Active`)
- **Solution:** Update `Company_Member.status` field
- **Validation:** Only allow valid state transitions
- **Notification:** Send notifications on status changes (e.g., when `Invited` → `Active`)

### Concurrent Registration

**Scenario:** Multiple users try to create companies with same EIN
- **Solution:** Database unique constraint on `companies.ein`
- **Error Handling:** Return user-friendly error: "A company with this EIN already exists"

### Orphaned Records

**Scenario:** User deleted but Company_Member records remain
- **Solution:** Foreign key with `ON DELETE CASCADE` ensures Company_Member records are deleted
- **Alternative:** Soft delete users (set `user_state = 'Banned'`) to preserve referential integrity

## Data Model Impact

### Tables Modified/Created

**Schema Reference:** See [schema-identity.md](../../schema-identity.md) for complete table definitions, indexes, constraints, and foreign key relationships.

**Related Tables:**
This model impacts:
- `bookings` - References both users (workers) and companies (borrowers/lenders)
- `time_log` - References users (workers)
- `ratings` - References users and companies
- `insurance_policies` - References companies
