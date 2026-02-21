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

        // 1. Get user's company membership
        const { data: memberRecord, error: memberError } = await supabase
            .from('company_members')
            .select('company_id, roles')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .maybeSingle();

        if (memberError || !memberRecord?.company_id) {
            return NextResponse.json({ is_fully_onboarded: false });
        }

        // 2. RBAC Check: Must be Admin to view Stripe Status
        const roles = (memberRecord.roles as unknown as string[]) || [];
        if (!roles.some(r => r.toLowerCase() === 'admin')) {
            return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
        }

        // 2. Get company's stripe_account_id
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('stripe_account_id')
            .eq('id', memberRecord.company_id)
            .maybeSingle();

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
