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

        // 2. RBAC Check: We'll return basic status to everyone in company, 
        // but withhold sensitive bank details from non-admins.
        const roles = (memberRecord.roles as unknown as string[]) || [];
        const isAdmin = roles.some(r => r.toLowerCase() === 'admin');

        // 2. Get company's stripe_account_id
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('stripe_account_id, name')
            .eq('id', memberRecord.company_id)
            .maybeSingle();

        if (companyError) {
            console.error('Database error fetching company:', companyError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!company?.stripe_account_id) {
            return NextResponse.json({
                is_fully_onboarded: false,
                has_account: false,
                is_admin: isAdmin,
                company_name: company?.name
            });
        }

        // 3. Retrieve account details from Stripe
        const account = await stripe.accounts.retrieve(company.stripe_account_id);

        const needsAction = !account.details_submitted || (account.requirements?.currently_due && account.requirements.currently_due.length > 0);
        const isFullyOnboarded = account.charges_enabled && account.details_submitted && !needsAction;

        let last4 = null;
        let bankName = null;

        if (isFullyOnboarded) {
            try {
                const externalAccounts = await stripe.accounts.listExternalAccounts(
                    company.stripe_account_id,
                    { object: 'bank_account', limit: 1 }
                );

                if (externalAccounts.data.length > 0) {
                    const bankAccount = externalAccounts.data[0] as any;
                    last4 = bankAccount.last4;
                    bankName = bankAccount.bank_name;
                }
            } catch (err) {
                console.error('Error fetching bank details:', err);
                // Non-fatal, just don't return bank info
            }
        }

        return NextResponse.json({
            is_fully_onboarded: isFullyOnboarded,
            has_account: true,
            details_submitted: account.details_submitted,
            charges_enabled: account.charges_enabled,
            requirements: account.requirements,
            needs_action: needsAction,
            last4: isAdmin ? last4 : null,
            bank_name: isAdmin ? bankName : null,
            is_admin: isAdmin,
            company_name: company.name
        });

    } catch (error: any) {
        console.error('Stripe Status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
