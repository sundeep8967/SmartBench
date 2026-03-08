import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

// Customer portal — lets users manage/cancel/update their subscription
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get company and customer ID
        const { data: member } = await supabase
            .from('company_members')
            .select('company_id, companies(stripe_customer_id)')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        const company = Array.isArray(member?.companies) ? member?.companies[0] : member?.companies as any;
        const customerId = company?.stripe_customer_id;

        if (!customerId) {
            return NextResponse.json({ error: 'No Stripe customer found. Please subscribe first.' }, { status: 400 });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?tab=subscription`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error: any) {
        console.error('Billing portal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
