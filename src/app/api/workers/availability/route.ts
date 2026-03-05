import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/workers/availability?worker_id=xxx
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("worker_id") || user.id;

    const { data: availability, error } = await supabase
        .from("worker_availability")
        .select("*")
        .eq("worker_id", workerId)
        .eq("is_active", true)
        .order("start_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ availability: availability || [] });
}

// POST /api/workers/availability — Set availability window + blocked dates
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
        .from("company_members")
        .select("company_id, roles")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .maybeSingle();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    const body = await request.json();
    const { worker_id, availability_mode, start_date, end_date, blocked_dates, recall_notice_days, minimum_shift_length_hours } = body;

    // Allow specifying a worker ID, otherwise default to the current user
    const targetWorkerId = worker_id || user.id;

    if (!start_date) {
        return NextResponse.json({ error: "start_date required" }, { status: 400 });
    }

    // Verify the admin has permission to modify this worker's availability
    if (targetWorkerId !== user.id) {
        const { data: targetMember } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", targetWorkerId)
            .eq("status", "Active")
            .maybeSingle();

        if (!targetMember || targetMember.company_id !== member.company_id) {
            return NextResponse.json({ error: "Not authorized to modify this worker" }, { status: 403 });
        }
    }

    // Deactivate all existing records first for this worker
    await supabase
        .from("worker_availability")
        .update({ is_active: false })
        .eq("worker_id", targetWorkerId);

    // Insert new availability record
    const { data, error } = await supabase
        .from("worker_availability")
        .insert({
            worker_id: targetWorkerId,
            company_id: member.company_id,
            availability_mode: availability_mode || "available",
            start_date,
            end_date: end_date || null,
            blocked_dates: blocked_dates || [],
            recall_notice_days: recall_notice_days || 7,
            minimum_shift_length_hours: minimum_shift_length_hours || 4,
            is_active: true,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
}

// DELETE /api/workers/availability — Clear availability (mark as inactive)
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
        .from("company_members")
        .select("company_id, roles")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .maybeSingle();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const targetWorkerId = body.worker_id || user.id;

    if (targetWorkerId !== user.id) {
        const { data: targetMember } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", targetWorkerId)
            .eq("status", "Active")
            .maybeSingle();

        if (!targetMember || targetMember.company_id !== member.company_id) {
            return NextResponse.json({ error: "Not authorized to modify this worker" }, { status: 403 });
        }
    }

    const { error } = await supabase
        .from("worker_availability")
        .update({ is_active: false })
        .eq("worker_id", targetWorkerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
