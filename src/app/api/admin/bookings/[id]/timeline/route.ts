import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // 1. Verify Super Admin access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: membership } = await supabase
            .from('company_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'SuperAdmin')
            .maybeSingle();

        const isSuperAdminEmail = user.email?.endsWith('@smartbench.com');
        if (!membership && !isSuperAdminEmail) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const events: any[] = [];

        // 2. Fetch Booking
        const { data: booking, error: bError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (bError || !booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        events.push({
            id: `booking_created`,
            type: "creation",
            title: "Booking Created",
            description: `Booking #${booking.id.slice(0, 8)} was created and confirmed.`,
            timestamp: booking.created_at,
            icon: "FilePlus",
            color: "blue"
        });

        if (booking.status === 'Cancelled') {
            events.push({
                id: `booking_cancelled`,
                type: "cancellation",
                title: "Booking Cancelled",
                description: `The booking was cancelled.`,
                timestamp: booking.updated_at || booking.created_at,
                icon: "XCircle",
                color: "red"
            });
        }

        // 3. Fetch Time Entries
        const { data: timeEntries } = await supabase
            .from('time_entries')
            .select('*')
            .eq('booking_id', id);

        if (timeEntries) {
            for (const te of timeEntries) {
                if (te.clock_in) {
                    events.push({
                        id: `te_${te.id}_clockin`,
                        type: "clock_in",
                        title: "Worker Clocked In",
                        description: `Worker started their shift.`,
                        timestamp: te.clock_in,
                        icon: "Play",
                        color: "green"
                    });
                }

                if (te.clock_out) {
                    events.push({
                        id: `te_${te.id}_clockout`,
                        type: "clock_out",
                        title: "Worker Clocked Out",
                        description: `Worker ended their shift.`,
                        timestamp: te.clock_out,
                        icon: "LogOut",
                        color: "orange"
                    });
                }

                if (te.verified_at) {
                    events.push({
                        id: `te_${te.id}_verified`,
                        type: "verified",
                        title: "Timesheet Verified",
                        description: te.verified_by ? `Timesheet was manually approved.` : `Timesheet was auto-approved by the system.`,
                        timestamp: te.verified_at,
                        icon: "CheckCircle2",
                        color: "emerald"
                    });
                }

                if (te.stripe_transfer_id && te.payout_released) {
                    events.push({
                        id: `te_${te.id}_payout`,
                        type: "payout",
                        title: "Payout Released",
                        description: `Funds were transferred to the lender (Transfer ID: ${te.stripe_transfer_id.slice(0, 10)}...).`,
                        timestamp: te.updated_at || te.verified_at,
                        icon: "DollarSign",
                        color: "purple"
                    });
                }
            }
        }

        // 4. Fetch Reviews
        const { data: reviews } = await (supabase as any)
            .from('worker_reviews')
            .select('created_at, aggregate_rating')
            .eq('booking_id', id);

        if (reviews) {
            for (const review of reviews) {
                events.push({
                    id: `review_${review.created_at}`,
                    type: "review",
                    title: "Review Submitted",
                    description: `Borrower submitted a ${review.aggregate_rating}-star rating.`,
                    timestamp: review.created_at,
                    icon: "Star",
                    color: "yellow"
                });
            }
        }

        // Sort events chronologically (newest first or oldest first, let's do oldest first for a timeline)
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Newest first

        return NextResponse.json({
            booking: {
                id: booking.id,
                status: booking.status,
                total_amount: booking.total_amount,
                start_date: booking.start_date,
            },
            timeline: events
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
