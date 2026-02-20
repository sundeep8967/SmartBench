import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Pending";

    // Fetch time entries for the company (no FK join on users — it points to auth.users)
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
    const statusCounts: Record<string, number> = { Pending: 0, Disputed: 0, Verified: 0 };
    const { data: allEntries } = await supabase
        .from('time_entries')
        .select('status')
        .eq('company_id', member.company_id);

    (allEntries || []).forEach(e => {
        if (statusCounts[e.status] !== undefined) statusCounts[e.status]++;
    });

    return NextResponse.json({
        entries: enrichedEntries,
        counts: statusCounts,
    });
}

// PATCH — approve or dispute a time entry
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { time_entry_id, action } = body;

    if (!time_entry_id || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const newStatus = action === "approve" ? "Verified" : action === "dispute" ? "Disputed" : null;
    if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const { data, error } = await supabase
        .from('time_entries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', time_entry_id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
