import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculatePayWithOvertime, type OtTermsSnapshot, type TimePeriod } from "@/lib/services/overtime";

/**
 * POST /api/bookings/overtime
 *
 * Epic 6.5 — Calculate overtime pay for a booking period.
 * Uses the ot_terms_snapshot from the booking to apply the correct OT rules.
 *
 * Body: {
 *   booking_id,
 *   hourly_rate_cents: number,
 *   periods: [{ date: "YYYY-MM-DD", minutes: number, day_of_week: number }]
 * }
 * OR pass booking_id only to auto-fetch from the DB time entries.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { booking_id, hourly_rate_cents, periods: manualPeriods } = body;

    if (!booking_id) {
        return NextResponse.json({ error: "booking_id required" }, { status: 400 });
    }

    // Fetch booking and its OT terms snapshot
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("ot_terms_snapshot, worker_id, borrower_company_id, total_amount")
        .eq("id", booking_id)
        .single();

    if (bookingError || !booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const otTerms: OtTermsSnapshot = (booking as any).ot_terms_snapshot || {
        ot_rate_type: "1.5x",
        ot_rule_daily: 8,
        ot_rule_weekly: 40,
    };

    let periods: TimePeriod[] = manualPeriods || [];

    // If no manual periods provided, auto-fetch from time_entries
    if (periods.length === 0) {
        const { data: entries } = await supabase
            .from("time_entries")
            .select("clock_in, clock_out, total_minutes")
            .eq("worker_id", (booking as any).worker_id)
            .eq("company_id", (booking as any).borrower_company_id)
            .in("status", ["Verified", "Approved"])
            .not("clock_out", "is", null);

        periods = (entries || []).map((e: any) => {
            const dt = new Date(e.clock_in);
            return {
                date: dt.toISOString().split("T")[0],
                minutes: e.total_minutes || 0,
                day_of_week: dt.getUTCDay(),
            };
        });
    }

    if (periods.length === 0) {
        return NextResponse.json({ error: "No time periods to calculate" }, { status: 400 });
    }

    const rate = hourly_rate_cents || 0;
    const result = calculatePayWithOvertime(periods, rate, otTerms);

    return NextResponse.json({
        booking_id,
        ot_terms: otTerms,
        hourly_rate_cents: rate,
        ...result,
    });
}
