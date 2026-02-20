import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — fetch current active shift + recent shifts
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

    // Get active shift (clocked in, not yet clocked out)
    const { data: activeShift } = await supabase
        .from('time_entries')
        .select('*, project:projects(name)')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Get recent completed shifts (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentShifts } = await supabase
        .from('time_entries')
        .select('*, project:projects(name)')
        .eq('user_id', user.id)
        .not('clock_out', 'is', null)
        .gte('clock_in', weekAgo)
        .order('clock_in', { ascending: false })
        .limit(10);

    // Get available projects for clock-in
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', member.company_id)
        .eq('status', 'Active');

    return NextResponse.json({
        activeShift,
        recentShifts: recentShifts || [],
        projects: projects || [],
        companyId: member.company_id,
    });
}

// POST — clock in, clock out, start/end break
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action, project_id, time_entry_id } = body;

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    switch (action) {
        case 'clock_in': {
            // Check no existing active shift
            const { data: existing } = await supabase
                .from('time_entries')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'Active')
                .is('clock_out', null)
                .maybeSingle();

            if (existing) return NextResponse.json({ error: "Already clocked in" }, { status: 400 });

            const { data, error } = await supabase
                .from('time_entries')
                .insert({
                    user_id: user.id,
                    company_id: member.company_id,
                    project_id: project_id || null,
                    clock_in: new Date().toISOString(),
                    status: 'Active',
                })
                .select('*, project:projects(name)')
                .single();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        case 'clock_out': {
            if (!time_entry_id) return NextResponse.json({ error: "time_entry_id required" }, { status: 400 });

            const clockOut = new Date();
            const { data: entry } = await supabase
                .from('time_entries')
                .select('clock_in, total_break_minutes')
                .eq('id', time_entry_id)
                .single();

            const { data, error } = await supabase
                .from('time_entries')
                .update({
                    clock_out: clockOut.toISOString(),
                    status: 'Pending',
                    updated_at: clockOut.toISOString(),
                })
                .eq('id', time_entry_id)
                .eq('user_id', user.id)
                .select('*, project:projects(name)')
                .single();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        case 'start_break': {
            if (!time_entry_id) return NextResponse.json({ error: "time_entry_id required" }, { status: 400 });

            const { data, error } = await supabase
                .from('time_entries')
                .update({ break_start: new Date().toISOString() })
                .eq('id', time_entry_id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        case 'end_break': {
            if (!time_entry_id) return NextResponse.json({ error: "time_entry_id required" }, { status: 400 });

            const { data: entry } = await supabase
                .from('time_entries')
                .select('break_start, total_break_minutes')
                .eq('id', time_entry_id)
                .single();

            if (!entry?.break_start) return NextResponse.json({ error: "No active break" }, { status: 400 });

            const breakMinutes = Math.round((Date.now() - new Date(entry.break_start).getTime()) / 60000);

            const { data, error } = await supabase
                .from('time_entries')
                .update({
                    break_start: null,
                    break_end: new Date().toISOString(),
                    total_break_minutes: (entry.total_break_minutes || 0) + breakMinutes,
                })
                .eq('id', time_entry_id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        default:
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
}
