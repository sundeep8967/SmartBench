# Feature Blueprint: Tax Integration Adapter
**Domain:** Financial
**Related Epics:** [Epic 6: Financial Operations & Admin](../../../prd/epic-6.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 6.7: Pricing Display and Sales Tax](../../../prd/epic-6.md#story-67-pricing-display-and-sales-tax)
- [Architecture: Tax Architecture](../../global-scaling-strategy.md#5-tax-architecture)

## Overview

The Tax Integration Adapter provides a Strategy Pattern interface for tax calculation, allowing future integration with tax calculation services (Stripe Tax, Avalara) without modifying checkout flow. **For MVP, only `NullTaxProvider` is implemented - Avalara and other tax providers are NOT integrated for MVP.** The `NullTaxProvider` returns 0 for all calculations, reflecting MN/WI tax exemptions for temporary labor and implementing the pass-through marketplace model.

**Tax Exemption Declaration:** Tax exemption declaration functionality (UI, validation, document upload, audit trail) is deferred to post-MVP. Minnesota does not charge sales tax for temporary labor services, and MVP is limited to Minnesota. While the `ITaxProvider` interface includes `taxExempt` parameters for future use, borrowers do not declare exemptions during MVP checkout. Tax exemption declaration will be implemented when expanding to states that require tax collection.

## Technical Strategy (The "How")

### Interface Definition

```typescript
interface ITaxProvider {
  /**
   * Calculate tax amount for a transaction
   * @param amount - Transaction amount in cents
   * @param jurisdiction - Jurisdiction ID or code (e.g., 'MN', 'WI')
   * @param taxExempt - Whether the company has tax-exempt status
   * @param companyId - Company ID for tax exemption verification
   * @returns Tax amount in cents (always >= 0)
   */
  calculateTax(
    amount: number,
    jurisdiction: string,
    taxExempt: boolean,
    companyId: UUID
  ): Promise<number>;
  
  /**
   * Get tax breakdown for display purposes
   * @param amount - Transaction amount in cents
   * @param jurisdiction - Jurisdiction ID or code
   * @param taxExempt - Whether the company has tax-exempt status
   * @param companyId - Company ID
   * @returns Tax breakdown object with rate and amount
   */
  getTaxBreakdown(
    amount: number,
    jurisdiction: string,
    taxExempt: boolean,
    companyId: UUID
  ): Promise<TaxBreakdown>;
}

interface TaxBreakdown {
  taxRate: number;      // e.g., 0.0675 for 6.75%
  taxAmount: number;    // in cents
  taxableAmount: number; // in cents
  exemptAmount: number;  // in cents
}
```

### MVP Implementation: NullTaxProvider

```typescript
class NullTaxProvider implements ITaxProvider {
  async calculateTax(
    amount: number,
    jurisdiction: string,
    taxExempt: boolean,
    companyId: UUID
  ): Promise<number> {
    // MVP: Pass-through model, no tax calculation
    // Returns 0 for all calculations
    return 0;
  }
  
  async getTaxBreakdown(
    amount: number,
    jurisdiction: string,
    taxExempt: boolean,
    companyId: UUID
  ): Promise<TaxBreakdown> {
    return {
      taxRate: 0,
      taxAmount: 0,
      taxableAmount: 0,
      exemptAmount: amount
    };
  }
}
```

### Integration Points

#### 1. Checkout Flow

```typescript
async function processCheckout(booking: Booking, paymentMethod: PaymentMethod) {
  const taxProvider = getTaxProvider(); // Factory returns NullTaxProvider for MVP
  
  const baseAmount = calculateBookingCost(booking);
  const taxAmount = await taxProvider.calculateTax(
    baseAmount,
    booking.project.jurisdiction_id,
    booking.borrower_company.tax_exempt_status,
    booking.borrower_company_id
  );
  
  const totalAmount = baseAmount + taxAmount;
  
  // Process payment with totalAmount
  // ...
}
```

#### 2. Invoice Generation

```typescript
async function generateInvoice(booking: Booking) {
  const taxProvider = getTaxProvider();
  const taxBreakdown = await taxProvider.getTaxBreakdown(
    booking.total_amount,
    booking.project.jurisdiction_id,
    booking.borrower_company.tax_exempt_status,
    booking.borrower_company_id
  );
  
  return {
    subtotal: booking.total_amount,
    tax: taxBreakdown.taxAmount,
    total: booking.total_amount + taxBreakdown.taxAmount,
    taxRate: taxBreakdown.taxRate,
    taxExempt: booking.borrower_company.tax_exempt_status
  };
}
```

#### 3. Refund Processing

```typescript
async function processRefund(booking: Booking, refundAmount: number) {
  const taxProvider = getTaxProvider();
  
  // Calculate proportional tax refund (if applicable)
  const taxRefund = await taxProvider.calculateTax(
    refundAmount,
    booking.project.jurisdiction_id,
    booking.borrower_company.tax_exempt_status,
    booking.borrower_company_id
  );
  
  // For MVP (NullTaxProvider), taxRefund will always be 0
  // Future implementations may need to handle tax refunds differently
  // ...
}
```

### Factory Pattern

```typescript
function getTaxProvider(): ITaxProvider {
  const providerType = process.env.TAX_PROVIDER || 'null';
  
  switch (providerType) {
    case 'stripe':
      // Post-MVP only
      return new StripeTaxProvider();
    case 'avalara':
      // Post-MVP only
      return new AvalaraTaxProvider();
    case 'null':
    default:
      // MVP implementation
      return new NullTaxProvider();
  }
}
```

## Post-MVP Implementations

**Note:** The following implementations are for post-MVP only. MVP uses `NullTaxProvider` exclusively.

### Stripe Tax Provider (Post-MVP)

```typescript
class StripeTaxProvider implements ITaxProvider {
  private stripe: Stripe;
  
  async calculateTax(
    amount: number,
    jurisdiction: string,
    taxExempt: boolean,
    companyId: UUID
  ): Promise<number> {
    if (taxExempt) {
      return 0;
    }
    
    // Use Stripe Tax API
    const taxCalculation = await this.stripe.tax.calculations.create({
      currency: 'usd',
      line_items: [{
        amount: amount,
        reference: `booking_${companyId}`
      }],
      customer_details: {
        address: {
          country: 'US',
          state: jurisdiction
        }
      }
    });
    
    return taxCalculation.tax_amount_exclusive;
  }
  
  // ... getTaxBreakdown implementation
}
```

### Avalara Tax Provider (Post-MVP)

**Note:** This implementation is for post-MVP only. MVP does NOT integrate Avalara.

```typescript
class AvalaraTaxProvider implements ITaxProvider {
  private avalaraClient: AvalaraClient;
  
  async calculateTax(
    amount: number,
    jurisdiction: string,
    taxExempt: boolean,
    companyId: UUID
  ): Promise<number> {
    if (taxExempt) {
      return 0;
    }
    
    // Use Avalara API
    const taxResult = await this.avalaraClient.createTransaction({
      type: 'SalesOrder',
      companyCode: process.env.AVALARA_COMPANY_CODE,
      date: new Date(),
      lines: [{
        number: '1',
        quantity: 1,
        amount: amount / 100, // Convert cents to dollars
        taxCode: 'P0000000' // Labor services tax code
      }],
      addresses: {
        ShipTo: {
          country: 'US',
          region: jurisdiction
        }
      }
    });
    
    return Math.round(taxResult.totalTax * 100); // Convert dollars to cents
  }
  
  // ... getTaxBreakdown implementation
}
```

## Configuration

### Environment Variables

```bash
# Tax provider selection
# MVP: Only 'null' is supported. 'stripe' and 'avalara' are post-MVP options.
TAX_PROVIDER=null  # MVP: 'null' only. Post-MVP options: 'stripe', 'avalara'

# Stripe Tax (Post-MVP only - if using Stripe provider)
STRIPE_SECRET_KEY=sk_...

# Avalara (Post-MVP only - if using Avalara provider)
AVALARA_ACCOUNT_ID=...
AVALARA_LICENSE_KEY=...
AVALARA_COMPANY_CODE=...
```

## Business Rules

1. **Tax Exempt Status:** Companies with `tax_exempt_status = true` always receive 0 tax, regardless of provider *(Post-MVP: tax exemption declaration functionality deferred)*
2. **Pass-Through Model (MVP):** NullTaxProvider returns 0 for all calculations, implementing pass-through marketplace model
3. **Jurisdiction-Based:** Tax calculation uses project jurisdiction (from `projects.jurisdiction_id`)
4. **Invoice Display:** Tax breakdown shown on invoices even if amount is 0 (transparency)
5. **Future Compliance:** When Marketplace Facilitator obligations apply, switch provider via environment variable
6. **Tax Exemption Declaration (Post-MVP):** Tax exemption declaration, validation, and document upload functionality is deferred to post-MVP. MVP does not include exemption declaration UI or validation logic.

## Edge Cases & Failure Handling

### Tax Provider Unavailable

- **Fallback:** If tax provider API fails, fall back to NullTaxProvider
- **Logging:** Log all tax calculation failures for audit
- **User Experience:** Show warning: "Tax calculation unavailable. Please consult tax advisor."

### Tax Rate Changes

- **Caching:** Cache tax rates with TTL (e.g., 24 hours)
- **Invalidation:** Invalidate cache on tax rate update webhooks (if provider supports)

### Multi-Jurisdiction Bookings

- **Current Limitation:** MVP assumes single jurisdiction per booking (project-based)
- **Future Enhancement:** Support multi-jurisdiction tax calculation for cross-state bookings

## Data Model Impact

### No Schema Changes Required

The tax adapter pattern does not require database schema changes. Tax amounts are calculated on-the-fly during checkout and stored in Stripe payment metadata for audit trail.

**Optional Enhancement (Future):**
- Add `tax_amount` field to `bookings` table for audit trail
- Add `tax_provider` field to track which provider calculated tax
- Add `tax_rate` field for historical rate tracking

## Testing Strategy

### Unit Tests

```typescript
describe('NullTaxProvider', () => {
  it('should return 0 for all tax calculations', async () => {
    const provider = new NullTaxProvider();
    const tax = await provider.calculateTax(10000, 'MN', false, companyId);
    expect(tax).toBe(0);
  });
  
  it('should return 0 even for tax-exempt companies', async () => {
    const provider = new NullTaxProvider();
    const tax = await provider.calculateTax(10000, 'MN', true, companyId);
    expect(tax).toBe(0);
  });
});
```

### Integration Tests

```typescript
describe('Checkout with Tax Adapter', () => {
  it('should integrate tax calculation into checkout flow', async () => {
    const booking = createTestBooking();
    const result = await processCheckout(booking, 'card');
    
    // Verify tax was calculated (even if 0)
    expect(result.taxAmount).toBeDefined();
    expect(result.totalAmount).toBeGreaterThanOrEqual(result.baseAmount);
  });
});
```

---
