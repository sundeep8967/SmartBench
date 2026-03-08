import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
) {
    const { bookingId } = await params;
    const body = await request.json();
    const { reason, incidentData } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate the user belongs to the borrower company associated with this booking
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id, roles')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Ensure member has permission
    const roles: string[] = (member as any).roles || [];
    if (!roles.includes('Admin') && !roles.includes('Supervisor') && !roles.includes('Manager')) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get Booking info
    const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('borrower_company_id', member.company_id)
        .single();

    if (bookingErr || !booking) return NextResponse.json({ error: "Booking not found or access denied." }, { status: 404 });

    // Prevent double cancellation
    if (booking.status === 'Cancelled' || booking.status === 'Completed') {
        return NextResponse.json({ error: "Booking is already closed." }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Reason: Cause -> Create Incident Report + End Booking
    if (reason === "Cause" && incidentData) {
        // Insert incident report
        const { error: incErr } = await supabase.from('incident_reports').insert({
            booking_id: bookingId,
            company_id: booking.borrower_company_id,
            reported_by: user.id,
            severity: incidentData.severity,
            type: incidentData.type,
            notes: incidentData.notes,
            photo_urls: incidentData.photoUrls || []
        });

        if (incErr) return NextResponse.json({ error: incErr.message }, { status: 500 });

        const newStatus = incidentData.severity === 'Critical' ? 'Payment_Paused_Dispute' : booking.status;

        // Change Booking status
        if (newStatus !== booking.status) {
            await supabase.from('bookings').update({
                status: newStatus,
                updated_at: now
            }).eq('id', bookingId);
        }

        return NextResponse.json({ success: true, bookingStatus: newStatus });
    }

    // Reason: Convenience -> Standard cancellation flow. (Already exists using cancel endpoint, but we can wrap it here if we want)
    if (reason === "Convenience") {
        return NextResponse.json({ error: "Use standard cancel endpoint for Convenience cancellations." }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid reason provided." }, { status: 400 });
}
