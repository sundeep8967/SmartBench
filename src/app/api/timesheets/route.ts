import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { releasePayoutForTimeEntry } from "@/lib/services/payout";

// GET — fetch time entries for verification (admin view)
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .maybeSingle();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Pending";

    // Fetch time entries for the company
    const { data: entries, error } = await supabase
        .from('time_entries')
        .select(`
            *,
            project:projects(name, address)
        `)
        .eq('company_id', member.company_id)
        .eq('status', status)
        .order('clock_in', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch worker info from public.users
    const userIds = [...new Set((entries || []).map(e => e.user_id))];
    const { data: users } = userIds.length > 0
        ? await supabase.from('users').select('id, full_name, email').in('id', userIds)
        : { data: [] };
    const usersMap = new Map((users || []).map(u => [u.id, u]));

    // Attach worker info
    const enrichedEntries = (entries || []).map(e => ({
        ...e,
        worker: usersMap.get(e.user_id) || null,
    }));

    // Get counts per status for tabs
    const statusCounts: Record<string, number> = { Pending: 0, Pending_Verification: 0, Disputed: 0, Verified: 0 };
    const { data: allEntries } = await supabase
        .from('time_entries')
        .select('status')
        .eq('company_id', member.company_id);

    (allEntries || []).forEach(e => {
        // Merge "Pending" and "Pending_Verification" into the Pending tab count
        if (e.status === 'Pending' || e.status === 'Pending_Verification') statusCounts['Pending']++;
        else if (statusCounts[e.status] !== undefined) statusCounts[e.status]++;
    });

    return NextResponse.json({
        entries: enrichedEntries,
        counts: { Pending: statusCounts.Pending, Disputed: statusCounts.Disputed, Verified: statusCounts.Verified },
    });
}

// PATCH — approve or dispute a time entry (supervisor action)
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify company membership
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id, roles')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Only Supervisors, Managers, or Admins can verify timesheets
    const memberRoles: string[] = (member as any).roles || [];
    const allowedRoles = ['Admin', 'Manager', 'Supervisor'];
    const hasPermission = memberRoles.some(r => allowedRoles.includes(r));
    if (!hasPermission) {
        return NextResponse.json({ error: "Insufficient permissions to verify timesheets" }, { status: 403 });
    }

    const body = await request.json();
    const { time_entry_id, action } = body;

    if (!time_entry_id || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const now = new Date().toISOString();

    if (action === "approve") {
        // Update status to Verified and set verified_at / verified_by
        const { data, error } = await supabase
            .from('time_entries')
            .update({
                status: 'Verified',
                verified_at: now,
                verified_by: user.id,
                updated_at: now,
            })
            .eq('id', time_entry_id)
            .eq('company_id', member.company_id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // 🔑 Trigger Stripe payout (non-fatal — log errors but don't fail the response)
        const payoutResult = await releasePayoutForTimeEntry(time_entry_id);
        if (!payoutResult.success) {
            console.error(`Payout failed for time entry ${time_entry_id}:`, payoutResult.error);
            // Return success for the approval, but flag payout status
            return NextResponse.json({
                ...data,
                payout_status: 'failed',
                payout_error: payoutResult.error,
            });
        }

        return NextResponse.json({
            ...data,
            payout_status: 'released',
            payout_amount_cents: payoutResult.payoutAmountCents,
            stripe_transfer_id: payoutResult.transferId,
        });

    } else if (action === "dispute") {
        const { data, error } = await supabase
            .from('time_entries')
            .update({
                status: 'Disputed',
                updated_at: now,
            })
            .eq('id', time_entry_id)
            .eq('company_id', member.company_id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Inject system message to start the chat
        await supabase.from('dispute_messages').insert({
            time_entry_id: time_entry_id,
            sender_id: user.id, // Using the acting user's ID as sender
            sender_company_id: member.company_id,
            message: "Supervisor flagged this timesheet for review.",
            is_system_message: true,
        });

        return NextResponse.json(data);

    } else {
        return NextResponse.json({ error: "Invalid action. Use 'approve' or 'dispute'" }, { status: 400 });
    }
}
