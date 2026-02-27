import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabaseSession = await createClient();
    const { data: { user }, error: userError } = await supabaseSession.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    try {
        // Initialize Supabase Admin client (service_role) to bypass RLS
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // ──────────────────────────────────────────────────────────
        // STEP 1: Handle Stripe cleanup & Company deletion
        // ──────────────────────────────────────────────────────────
        const { data: memberData } = await supabaseAdmin
            .from('company_members')
            .select('company_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (memberData?.company_id) {
            const companyId = memberData.company_id;

            // Check if user is the ONLY member of this company
            const { count } = await supabaseAdmin
                .from('company_members')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId);

            if (count === 1) {
                // Fetch company's stripe_account_id
                const { data: company } = await supabaseAdmin
                    .from('companies')
                    .select('stripe_account_id')
                    .eq('id', companyId)
                    .single();

                // Delete Stripe Connect Account if exists
                if (company?.stripe_account_id) {
                    try {
                        await stripe.accounts.del(company.stripe_account_id);
                    } catch (stripeError: any) {
                        // Log but don't block — Stripe account may already be deleted
                        console.error('Stripe account deletion failed (continuing):', stripeError.message);
                    }
                }

                // Delete the company (cascades company_members, insurance_policies, etc.)
                await supabaseAdmin
                    .from('companies')
                    .delete()
                    .eq('id', companyId);
            }
        }

        // ──────────────────────────────────────────────────────────
        // STEP 2: Nullify/Delete NO ACTION FK references
        // These tables reference users(id) with NO ACTION and would
        // block deletion of public.users if not handled first.
        // ──────────────────────────────────────────────────────────

        // bookings: nullify site contact & cancelled_by references
        // (worker_id is CASCADE so it auto-deletes)
        await supabaseAdmin
            .from('bookings')
            .update({ primary_site_contact_id: null })
            .eq('primary_site_contact_id', userId);

        await supabaseAdmin
            .from('bookings')
            .update({ cancelled_by: null })
            .eq('cancelled_by', userId);

        // company_invitations: nullify invited_by
        await supabaseAdmin
            .from('company_invitations')
            .update({ invited_by: null })
            .eq('invited_by', userId);

        // notifications: delete all notifications for this user
        await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        // time_entries: delete all time entries for this user
        await supabaseAdmin
            .from('time_entries')
            .delete()
            .eq('user_id', userId);

        // ──────────────────────────────────────────────────────────
        // STEP 3: Delete from public.users
        // This triggers ON DELETE CASCADE for: company_members,
        // worker_profiles, worker_availability, worker_rates,
        // cart_items, user_preferences, user_agreements,
        // onboarding_sessions
        // ──────────────────────────────────────────────────────────
        const { error: deletePublicUserError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (deletePublicUserError) {
            console.error('Failed to delete from public.users:', deletePublicUserError);
            throw new Error(`Failed to delete profile data: ${deletePublicUserError.message}`);
        }

        // ──────────────────────────────────────────────────────────
        // STEP 4: Delete from auth.users (removes login capability)
        // ──────────────────────────────────────────────────────────
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteAuthError) {
            console.error('Failed to delete from auth.users:', deleteAuthError);
            throw new Error(`Failed to delete auth record: ${deleteAuthError.message}`);
        }

        return NextResponse.json({ success: true, message: 'Account deleted successfully.' });
    } catch (err: any) {
        console.error('Account deletion failed:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
