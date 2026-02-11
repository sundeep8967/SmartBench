# Stripe Future Epic: Payments, Webhooks & Storefront

> Items to implement after onboarding is fully working.

## Epic 1: Checkout Session & Payment Flow
- [ ] Create `POST /api/stripe/checkout` route
  - Accept `priceId`, `connectedAccountId`, quantity
  - Create `stripe.checkout.sessions.create()` with:
    - `payment_intent_data.application_fee_amount` (platform fee)
    - `payment_intent_data.transfer_data.destination` (connected account)
  - Return checkout URL
- [ ] Build checkout page / redirect logic
- [ ] Build payment success + cancel pages
- [ ] Define `application_fee_amount` strategy (flat vs percentage)

## Epic 2: Webhook Handler
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
- [ ] Create `POST /api/stripe/webhook` route
  - Verify webhook signature
  - Handle `checkout.session.completed` event
  - Handle `account.updated` event (for onboarding status changes)
- [ ] Register webhook endpoint in Stripe Dashboard
- [ ] Handle idempotency for duplicate events

## Epic 3: Products & Storefront
- [ ] Create API routes for product/price management
  - `POST /api/stripe/products` — create product + price
  - `GET /api/stripe/products/[accountId]` — list products for account
- [ ] Build storefront UI per connected account
- [ ] Dynamic routing: `/storefront/[accountId]`

## References
- [Stripe Connect Marketplace Quickstart](https://docs.stripe.com/connect/marketplace/quickstart?client=next)
- [Destination Charges](https://docs.stripe.com/connect/destination-charges)
- [Webhooks](https://docs.stripe.com/webhooks)
