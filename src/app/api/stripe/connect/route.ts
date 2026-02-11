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
        let { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('company_id')
            .eq('id', user.id)
            .single();

        // If user record doesn't exist in public.users, create one
        if (userError?.code === 'PGRST116') {
            const { data: newUser, error: createUserError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                })
                .select('company_id')
                .single();

            if (createUserError) {
                console.error('Error creating user record:', createUserError);
                return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
            }
            userRecord = newUser;
            userError = null;
        }

        if (userError) {
            console.error('Error fetching user record:', userError);
            return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
        }

        let companyId = userRecord?.company_id;

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

            // Link user to the new company and set as admin
            const { error: linkError } = await supabase
                .from('users')
                .update({ company_id: companyId, role: 'admin' })
                .eq('id', user.id);

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
