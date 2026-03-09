import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { releasePayoutForTimeEntry } from "@/lib/services/payout";

export const dynamic = 'force-dynamic';

/**
 * CRON JOB: Runs every 5 minutes.
 * Auto-approves time entries where auto_approval_at <= NOW() and status is still Pending/Pending_Verification.
 * Per PRD Story 5.9: Funds move exactly 4 hours after clock-out if no dispute filed.
 */
export async function GET(request: NextRequest) {
    // Authenticate the Cron request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.VERCEL_CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const now = new Date().toISOString();

        // Find time entries where auto_approval_at has passed and not yet verified
        const { data: pendingEntries, error: fetchError } = await supabaseAdmin
            .from('time_entries')
            .select('id, user_id, company_id, auto_approval_at, status')
            .in('status', ['Pending', 'Pending_Verification'])
            .lte('auto_approval_at', now)
            .eq('payout_released', false)
            .not('clock_out', 'is', null);

        if (fetchError) {
            console.error('Auto-approval cron fetch error:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!pendingEntries || pendingEntries.length === 0) {
            return NextResponse.json({ message: 'No entries ready for auto-approval.', processed: 0 });
        }

        let approved = 0;
        let payoutsFailed = 0;
        const results: any[] = [];

        for (const entry of pendingEntries) {
            // Update status to Verified (auto-approved)
            const { error: updateError } = await supabaseAdmin
                .from('time_entries')
                .update({
                    status: 'Verified',
                    verified_at: now,
                    updated_at: now,
                    // verified_by is null for auto-approvals — indicates system
                })
                .eq('id', entry.id)
                .in('status', ['Pending', 'Pending_Verification']); // Safety: only update if still pending

            if (updateError) {
                console.error(`Auto-approval update failed for ${entry.id}:`, updateError);
                results.push({ id: entry.id, status: 'update_failed', error: updateError.message });
                continue;
            }

            // Release payout via Stripe
            const payoutResult = await releasePayoutForTimeEntry(entry.id);
            if (payoutResult.success) {
                approved++;
                results.push({
                    id: entry.id,
                    status: 'auto_approved',
                    payout_cents: payoutResult.payoutAmountCents,
                    transfer_id: payoutResult.transferId
                });
                console.log(`✅ Auto-approved time entry ${entry.id} — Payout: $${((payoutResult.payoutAmountCents || 0) / 100).toFixed(2)}`);
            } else {
                payoutsFailed++;
                console.error(`⚠️ Auto-approved ${entry.id} but payout failed:`, payoutResult.error);
                results.push({ id: entry.id, status: 'auto_approved_payout_failed', error: payoutResult.error });
            }
        }

        return NextResponse.json({
            success: true,
            checked: pendingEntries.length,
            approved,
            payoutsFailed,
            results,
        });

    } catch (err: any) {
        console.error('Auto-approval cron error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
