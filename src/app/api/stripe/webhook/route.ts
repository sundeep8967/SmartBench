import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Admin Supabase client to bypass RLS for webhook updates
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            // --- Subscription Created/Updated ---
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const companyId = subscription.metadata?.company_id;
                const plan = subscription.metadata?.plan as 'monthly' | 'annual' | undefined;

                if (!companyId) {
                    console.warn('Subscription event missing company_id metadata', subscription.id);
                    break;
                }

                const statusMap: Record<Stripe.Subscription.Status, string> = {
                    active: 'active',
                    past_due: 'past_due',
                    canceled: 'canceled',
                    unpaid: 'past_due',
                    incomplete: 'none',
                    incomplete_expired: 'none',
                    trialing: 'trial',
                    paused: 'past_due',
                };

                const newStatus = statusMap[subscription.status] || 'none';
                const periodEnd = new Date(((subscription as any).current_period_end as number) * 1000).toISOString();

                await supabaseAdmin
                    .from('companies')
                    .update({
                        stripe_subscription_id: subscription.id,
                        subscription_status: newStatus,
                        subscription_plan: plan || null,
                        subscription_current_period_end: periodEnd,
                    })
                    .eq('id', companyId);

                console.log(`✅ Subscription ${subscription.id} updated to ${newStatus} for company ${companyId}`);
                break;
            }

            // --- Subscription Deleted/Cancelled ---
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const companyId = subscription.metadata?.company_id;

                if (!companyId) break;

                await supabaseAdmin
                    .from('companies')
                    .update({
                        subscription_status: 'canceled',
                        subscription_current_period_end: new Date(((subscription as any).current_period_end as number) * 1000).toISOString(),
                    })
                    .eq('id', companyId);

                console.log(`⚠️ Subscription canceled for company ${companyId}`);
                break;
            }

            // --- Invoice Payment Succeeded (keeps status active after renewal) ---
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string | null;

                if (!subscriptionId) break;

                // Retrieve subscription to get company_id
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                const companyId = sub.metadata?.company_id;

                if (!companyId) break;

                await supabaseAdmin
                    .from('companies')
                    .update({
                        subscription_status: 'active',
                        subscription_current_period_end: new Date(((sub as any).current_period_end as number) * 1000).toISOString(),
                        subscription_expiry_notified_at: null,
                    })
                    .eq('id', companyId);

                console.log(`💰 Payment succeeded for company ${companyId}`);
                break;
            }

            // --- Invoice Payment Failed ---
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string | null;

                if (!subscriptionId) break;

                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                const companyId = sub.metadata?.company_id;

                if (!companyId) break;

                await supabaseAdmin
                    .from('companies')
                    .update({ subscription_status: 'past_due' })
                    .eq('id', companyId);

                console.log(`❌ Payment failed for company ${companyId}`);
                break;
            }

            default:
                // Silently ignore unhandled events
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

// Ensure Next.js doesn't aggressively cache the webhook endpoint
export const dynamic = 'force-dynamic';
