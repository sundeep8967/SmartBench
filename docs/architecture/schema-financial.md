# Database Schema - Financial Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Database Schema](./schema.md)

This document contains complete SQL table definitions, constraints, indexes, and foreign keys for the Financial domain. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [Data Dictionary - Financial Domain](./data-dictionary-financial.md).**

---

## Financial Domain

**Architecture Note:** The MVP uses a direct Stripe-native approach. All payments go directly to Stripe Connect Connected Accounts, and all refunds go directly back to customer payment methods via Stripe API. Financial tracking is handled via:
- Stripe API for payment/refund processing
- `bookings` table fields: `total_amount`, `service_fee_amount`, `worker_payout_amount`
- `bookings.status` field for refund tracking ('Refunded', 'Partially_Refunded')
- `pending_payments` table for weekly progress payment tracking

All financial operations are processed directly through Stripe.

### pending_payments

```sql
CREATE TABLE pending_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  amount BIGINT NOT NULL, -- in cents
  funded_period_start TIMESTAMP NOT NULL,
  funded_period_end TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL, -- ENUM: 'Pending', 'Settled', 'Failed'
  created_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP,
  insurance_check_passed BOOLEAN NOT NULL
);

CREATE INDEX idx_pending_payments_booking_id ON pending_payments(booking_id);
CREATE INDEX idx_pending_payments_payment_intent_id ON pending_payments(payment_intent_id);
CREATE INDEX idx_pending_payments_status ON pending_payments(status);
```

**Technical Constraints:**
- `payment_intent_id` must be UNIQUE
- `status` ENUM: 'Pending', 'Settled', 'Failed'

---

**Back to:** [Database Schema](./schema.md)
