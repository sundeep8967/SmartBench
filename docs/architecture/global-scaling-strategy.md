# B. Global Scaling Strategy (The "No Rewrite" Rules)

We are launching in the USA, but we must not hardcode US assumptions.

## 1. Project-Booking Relationship

**Decision:** Project is the Parent Entity. Every Booking belongs to a Project. Project holds the Address and Timezone.

**Schema Reference:** See [schema-booking.md](./schema-booking.md) for `projects` and `bookings` table definitions.

## 2. Jurisdiction Policy Engine (Overtime)

**Decision:** We use the Strategy Pattern to handle varying overtime rules. See [schema-booking.md](./schema-booking.md) for the `jurisdictions` table definition.

**Important:** The jurisdiction policy engine is used exclusively for overtime calculation strategy, holiday calendar definitions, and business day calculations. It is NOT used for break/lunch policy validation. Break/lunch policies use the self-attestation model where lenders certify compliance via Terms of Service acceptance (see [Epic 2: Story 2.9](../prd/epic-2.md#story-29-lender-policy-configuration)).

## 3. Timezones

**Decision:** All timestamps stored in UTC. Project table has `timezone` column (e.g., `America/Chicago`). All time-based calculations use the Project's timezone.

**Schema Reference:** See [schema.md](./schema.md) for `projects` table definition.

## 4. Currency & Localization

**Decision:** `Company` and `Booking` tables must have `currency_code` (ISO 4217). For MVP, system enforces USD only. Multi-currency support deferred to Post-MVP.

**Schema Reference:** See [schema.md](./schema.md) for `companies` and `bookings` table definitions.

## 5. Tax Architecture {#5-tax-architecture}

**Decision:** We use the Strategy Pattern via `ITaxProvider` interface to allow future tax provider integration without changing checkout flow.

**Implementation:**
- **Interface:** `ITaxProvider` defines `calculateTax(bookingContext)` method
- **MVP Implementation:** `NullTaxProvider` returns 0 for all calculations (reflecting MN/WI tax exemptions for temporary labor)
- **Post-MVP Integration Points:** Stripe Tax, Avalara, or custom tax calculation service (NOT integrated for MVP)
- **Integration Points:** Checkout flow, Invoice generation, Refund processing

**Rationale:** While MVP assumes pass-through model and temporary labor exemption in MN/WI, implementing the adapter pattern now provides:
- **Prevents Technical Debt:** Architecture allows swapping in `AvalaraTaxProvider` or other providers later without refactoring checkout logic
- Future-proofing for Marketplace Facilitator tax obligations
- Easy integration when tax calculation becomes required
- Consistent interface across all financial operations

**Technical Reference:** See [Tax Adapter Blueprint](./blueprints/financial/tax-adapter.md) for complete interface definition and implementation details.
