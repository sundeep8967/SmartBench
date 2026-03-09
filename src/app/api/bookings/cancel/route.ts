import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/bookings/cancel
 *
 * Cancellation flow with refund logic (Epic 6.4):
 * - fault = "borrower": 24hr+ notice → full refund; <24hr notice → retain service fee
 * - fault = "lender": 100% full refund (including service fee)
 *
 * Body: { booking_id, fault: "borrower" | "lender", reason?: string }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { booking_id, fault, reason } = body;

        if (!booking_id || !fault) {
            return NextResponse.json({ error: "booking_id and fault required" }, { status: 400 });
        }
        if (!["borrower", "lender"].includes(fault)) {
            return NextResponse.json({ error: "fault must be 'borrower' or 'lender'" }, { status: 400 });
        }

        // Get the booking — cast to any due to stale Supabase generated types
        const { data: rawBooking, error: bookingError } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", booking_id)
            .single();

        if (bookingError || !rawBooking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        const booking = rawBooking as any;

        if (booking.status === "Cancelled") {
            return NextResponse.json({ error: "Booking already cancelled" }, { status: 400 });
        }

        // Determine refund amount based on fault and notice period
        const now = new Date();
        const startDate = new Date(booking.start_date);
        const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const totalAmountCents = Number(booking.total_amount) || 0;
        const serviceFeeAmountCents = Number(booking.service_fee_amount) || 0;

        let refundAmountCents = 0;
        let refundReason = "";

        if (fault === "lender") {
            // Lender cancels or is at fault → 100% refund
            refundAmountCents = totalAmountCents;
            refundReason = "Lender cancellation — full refund issued";
        } else {
            // Borrower cancels:
            // - 24+ hours notice → full refund
            // - <24 hours → retain service fee as penalty
            if (hoursUntilStart >= 24) {
                refundAmountCents = totalAmountCents;
                refundReason = "Borrower cancellation with 24h+ notice — full refund issued";
            } else {
                refundAmountCents = totalAmountCents - serviceFeeAmountCents;
                refundReason = `Borrower cancellation <24h before start — service fee retained ($${(serviceFeeAmountCents / 100).toFixed(2)})`;
            }
        }

        // Issue Stripe refund if there's a payment intent
        let stripeRefundId: string | null = null;
        const paymentIntentId = booking.stripe_payment_intent_id;
        if (paymentIntentId && refundAmountCents > 0) {
            try {
                const refund = await stripe.refunds.create({
                    payment_intent: paymentIntentId,
                    amount: refundAmountCents,
                    reason: "requested_by_customer",
                    metadata: { booking_id, fault, reason: reason || "" },
                });
                stripeRefundId = refund.id;
            } catch (stripeErr: any) {
                console.error("Stripe refund error:", stripeErr);
                console.warn(`Manual refund required for booking ${booking_id}: $${(refundAmountCents / 100).toFixed(2)}`);
            }
        }

        // Update booking status to Cancelled
        const { error: updateError } = await supabase
            .from("bookings")
            .update({
                status: "Cancelled",
                cancelled_at: now.toISOString(),
                cancelled_by: user.id,
                updated_at: now.toISOString(),
            })
            .eq("id", booking_id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            booking_id,
            fault,
            refund_amount_cents: refundAmountCents,
            refund_amount_usd: (refundAmountCents / 100).toFixed(2),
            stripe_refund_id: stripeRefundId,
            reason: refundReason,
            hours_until_start: Math.round(hoursUntilStart),
        });

    } catch (err: any) {
        console.error("Cancellation error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
