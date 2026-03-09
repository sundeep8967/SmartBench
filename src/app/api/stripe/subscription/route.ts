import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

// Monthly: $30/mo | Annual: $300/yr
// These should be real Stripe Price IDs from your Stripe dashboard
// Set them as environment variables:
//   STRIPE_PRICE_MONTHLY=price_xxx
//   STRIPE_PRICE_ANNUAL=price_xxx
const PRICE_IDS = {
    monthly: process.env.STRIPE_PRICE_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ANNUAL || '',
};

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan } = await request.json(); // 'monthly' | 'annual'

        if (!plan || !['monthly', 'annual'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan. Must be monthly or annual.' }, { status: 400 });
        }

        const priceId = PRICE_IDS[plan as 'monthly' | 'annual'];
        if (!priceId) {
            return NextResponse.json({ error: `Stripe price ID not configured for ${plan}. Set STRIPE_PRICE_${plan.toUpperCase()} env var.` }, { status: 500 });
        }

        // Get company for this user
        const { data: member } = await supabase
            .from('company_members')
            .select('company_id, companies(id, name, stripe_customer_id, subscription_status, stripe_subscription_id)')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        if (!member) {
            return NextResponse.json({ error: 'No active company membership found' }, { status: 403 });
        }

        const company = Array.isArray(member.companies) ? member.companies[0] : member.companies as any;
        const companyId = member.company_id;

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // If already has active subscription, redirect to portal to manage it
        if (company.subscription_status === 'active' && company.stripe_subscription_id) {
            return NextResponse.json({ alreadyActive: true });
        }

        // Get or create Stripe Customer
        let customerId = company.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: company.name,
                metadata: { company_id: companyId },
            });
            customerId = customer.id;

            // Persist customer ID
            await supabase
                .from('companies')
                .update({ stripe_customer_id: customerId })
                .eq('id', companyId);
        }

        // Create Stripe Checkout Session for subscription
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?tab=subscription&session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?tab=subscription&canceled=true`,
            subscription_data: {
                metadata: {
                    company_id: companyId,
                    plan,
                },
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: 'pause',
                    },
                },
            },
            metadata: {
                company_id: companyId,
                plan,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Subscription checkout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
