import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get user's company_id
        const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (userError || !userRecord?.company_id) {
            return NextResponse.json({ is_fully_onboarded: false });
        }

        // 2. Get company's stripe_account_id
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('stripe_account_id')
            .eq('id', userRecord.company_id)
            .single();

        if (companyError || !company?.stripe_account_id) {
            return NextResponse.json({ is_fully_onboarded: false });
        }

        // 3. Retrieve account details from Stripe
        const account = await stripe.accounts.retrieve(company.stripe_account_id);

        const isFullyOnboarded =
            account.charges_enabled &&
            account.details_submitted;

        return NextResponse.json({
            is_fully_onboarded: isFullyOnboarded,
            details_submitted: account.details_submitted,
            charges_enabled: account.charges_enabled,
        });

    } catch (error: any) {
        console.error('Stripe Status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
