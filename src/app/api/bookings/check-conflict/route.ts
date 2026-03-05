import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/bookings/check-conflict
 *
 * Epic 3.5 — Booking conflict prevention at checkout.
 * Validates that the worker has no overlapping confirmed/active bookings
 * for the requested date range before payment is taken.
 *
 * Body: { worker_id, start_date, end_date, exclude_booking_id? }
 * Returns: { conflict: boolean, conflicting_booking?: { id, start_date, end_date, status } }
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { worker_id, start_date, end_date, exclude_booking_id } = body;

    if (!worker_id || !start_date || !end_date) {
        return NextResponse.json({ error: "worker_id, start_date, end_date required" }, { status: 400 });
    }

    // Find any existing bookings for this worker that overlap with the requested dates
    // Overlap condition: existing.start_date < requested.end_date AND existing.end_date > requested.start_date
    let query = supabase
        .from("bookings")
        .select("id, start_date, end_date, status, project:projects(name)")
        .eq("worker_id", worker_id)
        .in("status", ["Confirmed", "Active", "Pending"])
        .lt("start_date", end_date)
        .gt("end_date", start_date);

    if (exclude_booking_id) {
        query = query.neq("id", exclude_booking_id);
    }

    const { data: conflicts, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (conflicts && conflicts.length > 0) {
        const conflict = conflicts[0] as any;
        return NextResponse.json({
            conflict: true,
            conflicting_booking: {
                id: conflict.id,
                start_date: conflict.start_date,
                end_date: conflict.end_date,
                status: conflict.status,
                project_name: conflict.project?.name || "Another project",
            },
            message: `This worker is already booked from ${new Date(conflict.start_date).toLocaleDateString()} to ${new Date(conflict.end_date).toLocaleDateString()} (${conflict.status}).`,
        });
    }

    return NextResponse.json({ conflict: false });
}
