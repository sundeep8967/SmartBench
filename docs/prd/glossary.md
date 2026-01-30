# SmartBench Terminology Glossary

**Purpose:** Standardized terminology definitions for consistent use across all SmartBench documentation.

**Last Updated:** January 2026  
**Version:** 1.0

---

## Role Terminology

### Borrowing Admin
**Definition:** A user with Admin role in a company that is booking/borrowing workers from the marketplace.

**Usage Guidelines:**
- Use "Borrowing Admin" (not "Borrower Admin") when referring to the role
- Context: This role is context-specific - the same user can be a Borrowing Admin in one booking and a Lending Admin in another
- Plural: "Borrowing Admins"

**Related Terms:** Borrowing Company, Admin Role

---

### Lending Admin
**Definition:** A user with Admin role in a company that is listing/lending workers to the marketplace.

**Usage Guidelines:**
- Use "Lending Admin" (not "Lender Admin") when referring to the role
- Context: This role is context-specific - the same user can be a Lending Admin in one booking and a Borrowing Admin in another
- Plural: "Lending Admins"

**Related Terms:** Lending Company, Admin Role

---

### Supervisor
**Definition:** A user role that grants authority to verify worker hours on job sites. Supervisors must be company members.

**Usage Guidelines:**
- Use "Supervisor" when referring to the verification role (role-based, not assignment-based)
- All supervisors must be company members
- Context: Verification is role-based - ANY user with Supervisor, Manager, or Admin role in Borrower Company can verify timesheets
- No specific supervisor assignment is required for verification
- Solopreneur owners are automatically set as Primary Site Contact when booking is created (separate from verification role)

**Related Terms:** 
- **Site Contact:** Person selected for operational communication (gate codes, running late, site access). Separate from verification authority.
- **Role-Based Verification:** Verification authority based on role (Supervisor, Manager, or Admin), not assignment

---

### Manager
**Definition:** A user role that grants operational management privileges, allowing users to Book Workers (Demand) and List Workers (Supply) without full Admin access to billing/Stripe or financial dashboard operations.

**Usage Guidelines:**
- Use "Manager" when referring to the operational management role
- Context: Manager role is context-specific - can be Borrowing Manager or Lending Manager depending on company context
- Manager can Book Workers (Borrower context) and List Workers (Lender context)
- Manager inherits Supervisor verification capabilities (can verify hours in Borrower context)
- Manager cannot access financial operations or set lending rates (Admin-only functions)
- Plural: "Managers"

**Context-Specific Usage:**
- **Borrowing Manager:** Manager role in the company that is booking/borrowing workers
- **Lending Manager:** Manager role in the company that is listing/lending workers
- Same user can be Borrowing Manager in one booking and Lending Manager in another

**Related Terms:** 
- **Borrowing Manager:** Manager role in Borrower context
- **Lending Manager:** Manager role in Lender context
- **Admin Role:** Full company control (includes Manager capabilities plus financial dashboard/financial access)
- **Supervisor Role:** Field verification role (Manager inherits these capabilities)

---

## Company Terminology

### Borrowing Company
**Definition:** A company that books/borrows workers from the marketplace for their projects.

**Usage Guidelines:**
- Use "Borrowing Company" (not "Borrower") when referring to the company entity
- Context: In a booking transaction, the Borrowing Company is the entity paying for workers
- Plural: "Borrowing Companies"

**Related Terms:** Borrowing Admin, Borrower (deprecated - use Borrowing Company)

---

### Lending Company
**Definition:** A company that lists/lends workers to the marketplace for booking by other companies.

**Usage Guidelines:**
- Use "Lending Company" (not "Lender") when referring to the company entity
- Context: In a booking transaction, the Lending Company is the entity providing workers
- Plural: "Lending Companies"

**Related Terms:** Lending Admin, Lender (deprecated - use Lending Company)

---

## Dispute Terminology

### Option A Dispute (Dispute Shift Only)
**Definition:** A dispute resolution path where the supervisor chooses to dispute only a specific shift while allowing the booking to continue.

**Usage Guidelines:**
- Use "Option A Dispute" or "Dispute Shift Only" when referring to this dispute type
- Context: Used for disagreements on hours/breaks where the relationship is still good
- Booking Status: Remains `Active`
- Worker Access: Worker **CAN** clock in for future shifts
- Financials: Only the disputed shift funds are frozen in Stripe Escrow (Stripe hold for disputes)

**Related Terms:** Fork in the Road, Option B Dispute, Payment_Paused_Dispute

---

### Option B Dispute (End Booking & Dispute)
**Definition:** A dispute resolution path where the supervisor chooses to terminate the booking and dispute simultaneously.

**Usage Guidelines:**
- Use "Option B Dispute" or "End Booking & Dispute" when referring to this dispute type
- Context: Used for performance issues, no-shows, or safety incidents
- Booking Status: Immediately transitions to `Cancelled`
- Worker Access: Worker is released immediately, future shifts removed, worker becomes available in search
- Financials: Total Freeze - both disputed shift funds AND cancellation penalty are frozen in Stripe Escrow (Stripe hold for disputes)

**Related Terms:** Fork in the Road, Option A Dispute, Total Freeze

---

### Fork in the Road
**Definition:** The mandatory decision point when filing a dispute where the supervisor must choose between Option A (Dispute Shift Only) or Option B (End Booking & Dispute).

**Usage Guidelines:**
- Use "Fork in the Road" when referring to the dispute filing decision point
- Context: This decision is mandatory and must be made at the moment of dispute filing - cannot be deferred
- The fork decision determines booking status immediately - Option A = Active, Option B = Cancelled
- There is no middle ground for disputes - booking is either `Active` (work continues) or `Cancelled` (work stops)

**Related Terms:** Option A Dispute, Option B Dispute, Dispute Resolution

---

## Deprecated Terms

The following terms should no longer be used in documentation. Use the standardized terms above instead:

- **"Borrower Admin"** → Use **"Borrowing Admin"**
- **"Lender Admin"** → Use **"Lending Admin"**
- **"Borrower"** (when referring to company) → Use **"Borrowing Company"**
- **"Lender"** (when referring to company) → Use **"Lending Company"**
- **"Site Contact"** (when referring to verification role) → Use **"Supervisor"**

---

## Context-Specific Usage

### When to Use Role Terms vs. Company Terms

**Use Role Terms (Borrowing Admin, Lending Admin) when:**
- Referring to a specific user's role or permissions
- Describing actions a user can perform
- Discussing RBAC or access control
- Example: "Borrowing Admin can create bookings"

**Use Company Terms (Borrowing Company, Lending Company) when:**
- Referring to the company entity itself
- Describing company-level policies or settings
- Discussing company-to-company relationships
- Example: "Borrowing Company must maintain valid insurance"

---

## Policy & Compliance Terminology

### Self-Attestation Model
**Definition:** A compliance model where lenders self-certify that their break/lunch policies comply with local labor laws via Terms of Service acceptance, with the lender accepting full legal liability for policy compliance.

**Usage Guidelines:**
- Use "Self-Attestation Model" when referring to the break/lunch policy compliance approach
- Context: Replaces the previous State Labor Law Database enforcement engine
- The platform does NOT validate policies against state minimums
- Lenders can set any values for break/lunch parameters without database blocking
- Self-attestation is tracked in `user_agreements` table with `agreement_type = 'Labor_Law_Compliance'` for audit purposes

**Key Characteristics:**
- Lender accepts full legal liability for policy compliance
- Platform bears no responsibility for validating compliance
- Policy compliance disputes are legal matters handled outside the platform
- Audit trail provides evidence if disputes arise

**Related Terms:** Lender Policy Configuration, Terms of Service, Labor Law Compliance

---

## Related Documentation

- [User Roles and Actors](./user-roles-and-actors.md) - Complete role definitions and relationships
- [RBAC Acceptance Criteria](./rbac-acceptance-criteria.md) - Role-based access control specifications
- [Unified User Model Blueprint](../architecture/blueprints/identity/unified-user-model.md) - Technical implementation of user-company relationships
