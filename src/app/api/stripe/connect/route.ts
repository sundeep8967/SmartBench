import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createCompanyAndAdmin } from '@/lib/services/auth';

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
            .maybeSingle();

        let companyId = memberRecord?.company_id;

        // 2. If user has no company, create one using centralized service
        if (!companyId) {
            try {
                // Determine user full name from metadata
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;

                const result = await createCompanyAndAdmin({
                    userId: user.id,
                    email: user.email || '',
                    fullName: fullName,
                    companyName: body.businessName || 'Unnamed Company',
                    ein: body.ein || null,
                    address: body.address || null,
                    type: body.type || null,
                });

                companyId = result.companyId;
            } catch (err: any) {
                console.error('Error in createCompanyAndAdmin:', err);
                return NextResponse.json({ error: err.message || 'Failed to create company and user' }, { status: 500 });
            }
        }

        // 3. Check if company already has a Stripe Connect account
        const { data: company, error: companyFetchError } = await supabase
            .from('companies')
            .select('stripe_account_id')
            .eq('id', companyId)
            .maybeSingle();

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
                settings: {
                    payouts: {
                        schedule: {
                            interval: 'manual',
                        },
                    },
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
        // Wrap in try-catch to handle stale/disconnected Stripe accounts gracefully
        try {
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-2`,
                return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-2?return_from_stripe=true`,
                type: 'account_onboarding',
            });

            return NextResponse.json({ url: accountLink.url });
        } catch (linkError: any) {
            // Stale or disconnected account — clear it and create a fresh one
            console.warn('Stripe account stale, recreating:', linkError.message);

            const newAccount = await stripe.accounts.create({
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
                settings: {
                    payouts: { schedule: { interval: 'manual' } },
                },
            });

            await supabase
                .from('companies')
                .update({ stripe_account_id: newAccount.id })
                .eq('id', companyId);

            const accountLink = await stripe.accountLinks.create({
                account: newAccount.id,
                refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-2`,
                return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-2?return_from_stripe=true`,
                type: 'account_onboarding',
            });

            return NextResponse.json({ url: accountLink.url });
        }
    } catch (error: any) {
        console.error('Stripe Connect error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
