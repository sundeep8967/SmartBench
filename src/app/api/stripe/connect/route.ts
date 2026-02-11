import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse company info from request body (sent from step-1 onboarding data)
        const body = await req.json().catch(() => ({}));

        // 1. Get the user's record to find their company_id (or create if doesn't exist)
        // 1. Get the user's company membership
        let { data: memberRecord, error: memberError } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        // If user record doesn't exist in public.users, create one
        // Note: checking users table to ensure record exists, but company association is now in company_members
        const { data: userRecord, error: userFetchError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

        if (userFetchError?.code === 'PGRST116') {
            const { error: createUserError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email || '',
                    // full_name is kept in users table
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                });

            if (createUserError) {
                console.error('Error creating user record:', createUserError);
                return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
            }
            // User created, memberRecord is still null which is correct for new user
        }

        if (memberError && memberError.code !== 'PGRST116') {
            console.error('Error fetching member record:', memberError);
            return NextResponse.json({ error: 'Failed to fetch member record' }, { status: 500 });
        }

        let companyId = memberRecord?.company_id;

        // 2. If user has no company, create one using step-1 data
        if (!companyId) {
            const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert({
                    name: body.businessName || 'Unnamed Company',
                    ein: body.ein || null,
                    address: body.address || null,
                    kyb_status: 'pending',
                    type: body.type || null,
                })
                .select('id')
                .single();

            if (companyError) {
                console.error('Error creating company:', companyError);
                return NextResponse.json({ error: 'Failed to create company record' }, { status: 500 });
            }

            companyId = newCompany.id;

            // Link user to the new company and set as admin in company_members
            const { error: linkError } = await supabase
                .from('company_members')
                .insert({
                    user_id: user.id,
                    company_id: companyId,
                    roles: ['Admin'],
                    status: 'Active'
                });

            if (linkError) {
                console.error('Error linking user to company:', linkError);
                return NextResponse.json({ error: 'Failed to link user to company' }, { status: 500 });
            }
        }

        // 3. Check if company already has a Stripe Connect account
        const { data: company, error: companyFetchError } = await supabase
            .from('companies')
            .select('stripe_account_id')
            .eq('id', companyId)
            .single();

        if (companyFetchError) {
            console.error('Error fetching company:', companyFetchError);
            return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
        }

        let accountId = company?.stripe_account_id;

        // 4. If no Stripe account, create one
        if (!accountId) {
            const account = await stripe.accounts.create({
                email: user.email,
                country: 'US',
                controller: {
                    fees: { payer: 'application' },
                    losses: { payments: 'application' },
                    stripe_dashboard: { type: 'express' },
                },
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            accountId = account.id;

            // Save Stripe account ID to the company record
            const { error: updateError } = await supabase
                .from('companies')
                .update({ stripe_account_id: accountId })
                .eq('id', companyId);

            if (updateError) {
                console.error('Error saving Stripe account ID:', updateError);
                return NextResponse.json({ error: 'Failed to save Stripe account ID' }, { status: 500 });
            }
        }

        // 5. Create an Account Link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding/step-2`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding/step-2?return_from_stripe=true`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });
    } catch (error: any) {
        console.error('Stripe Connect error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
