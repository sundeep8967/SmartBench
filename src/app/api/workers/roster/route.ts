import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Get all company members (the roster)
    const { data: members, error } = await supabase
        .from('company_members')
        .select(`
            id,
            user_id,
            roles,
            status,
            user:users!inner(full_name, email)
        `)
        .eq('company_id', member.company_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get worker profiles separately (no direct FK from company_members)
    const userIds = (members || []).map(m => m.user_id);
    const { data: profiles } = userIds.length > 0
        ? await supabase
            .from('worker_profiles')
            .select('user_id, trade, skills, photo_url')
            .in('user_id', userIds)
        : { data: [] };

    const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]));


    // Get worker rates for this company
    const { data: rates } = await supabase
        .from('worker_rates')
        .select('worker_id, hourly_rate')
        .eq('company_id', member.company_id);

    const ratesMap = new Map((rates || []).map(r => [r.worker_id, r.hourly_rate]));

    // Get active bookings to determine deployed status
    const { data: bookings } = await supabase
        .from('bookings')
        .select('worker_id')
        .or(`borrower_company_id.eq.${member.company_id},lender_company_id.eq.${member.company_id}`)
        .in('status', ['Active', 'Confirmed']);

    const deployedWorkerIds = new Set((bookings || []).map(b => b.worker_id));

    // Get pending invitations
    const { data: invitations } = await supabase
        .from('company_invitations')
        .select('id, email, role, status, created_at')
        .eq('company_id', member.company_id)
        .eq('status', 'pending');

    // Build roster items
    const rosterItems = (members || []).map(m => {
        const isDeployed = deployedWorkerIds.has(m.user_id);
        const workerProfile = profilesMap.get(m.user_id);

        return {
            id: m.id,
            user_id: m.user_id,
            name: (m.user as any)?.full_name || 'Unknown',
            email: (m.user as any)?.email || '',
            roles: m.roles,
            status: m.status,
            deployment_status: isDeployed ? 'Deployed' : 'Bench',
            trade: workerProfile?.trade || null,
            skills: workerProfile?.skills || [],
            photo_url: workerProfile?.photo_url || null,
            hourly_rate: ratesMap.get(m.user_id) || null,
        };
    });

    // Compute metrics
    const totalWorkers = rosterItems.length;
    const deployed = rosterItems.filter(r => r.deployment_status === 'Deployed').length;
    const bench = totalWorkers - deployed;

    return NextResponse.json({
        roster: rosterItems,
        invitations: invitations || [],
        metrics: { totalWorkers, deployed, bench },
    });
}
