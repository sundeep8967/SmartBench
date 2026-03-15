
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateServiceFee } from "@/lib/services/billing";
import { assertCanBook } from "@/lib/services/subscription";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { paymentMethodId, bookingType = 'Short-Term', projectId } = body;

    if (!paymentMethodId) {
        return NextResponse.json({ error: "paymentMethodId is required" }, { status: 400 });
    }

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get Borrower Company & OT Terms
    const { data: member } = await supabase
        .from('company_members')
        .select(`
            company_id,
            company:companies(
                ot_rate_type,
                ot_rule_daily,
                ot_rule_weekend,
                ot_rule_weekly
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .maybeSingle();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // SUBSCRIPTION GATE — Block booking if subscription expired/canceled
    try {
        await assertCanBook(member.company_id);
    } catch (subErr: any) {
        return NextResponse.json({ error: subErr.message, code: 'SUBSCRIPTION_REQUIRED' }, { status: 402 });
    }

    try {
        // 2. Fetch Cart Items
        const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select(`
                *,
                worker_profile:worker_profiles(user_id)
            `)
            .eq('borrower_company_id', member.company_id);

        if (cartError) throw cartError;
        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        // 3. Process each item into a booking
        const bookingsToInsert = [];
        let totalCartAmountCents = 0;

        const workerIds = cartItems.map(item => item.worker_id);
        const { data: workerMemberships } = await supabase
            .from('company_members')
            .select('user_id, company_id')
            .in('user_id', workerIds)
            .eq('status', 'Active');

        const workerCompanyMap = new Map();
        workerMemberships?.forEach(m => workerCompanyMap.set(m.user_id, m.company_id));

        // Fetch Insurance Policies for all Lender Companies
        const lenderCompanyIds = Array.from(new Set(workerMemberships?.map(m => m.company_id) || []));
        const { data: insurancePolicies } = await supabase
            .from('insurance_policies')
            .select('*')
            .in('company_id', lenderCompanyIds)
            .eq('status', 'Active');

        // Find the maximum end date across all cart items connected to these lenders
        let maxEndDate = new Date();
        for (const item of cartItems) {
            const itemEnd = new Date(item.end_date);
            if (itemEnd > maxEndDate) {
                maxEndDate = itemEnd;
            }
        }

        // 3-Day Gate: Insurance must be valid for the entire booking + 3 calendar days safety buffer
        const requiredValidUntil = new Date(maxEndDate);
        requiredValidUntil.setDate(requiredValidUntil.getDate() + 3);

        // Validate Insurance
        for (const lenderId of lenderCompanyIds) {
            const policies = insurancePolicies?.filter(p => p.company_id === lenderId) || [];
            const hasGL = policies.some(p => p.insurance_type === 'General Liability' && new Date(p.expiration_date) > requiredValidUntil);
            const hasWC = policies.some(p => p.insurance_type === 'Workers Compensation' && new Date(p.expiration_date) > requiredValidUntil);

            if (!hasGL || !hasWC) {
                return NextResponse.json({
                    error: `One or more workers belong to a company that lacks active GL or WC insurance policies valid through ${requiredValidUntil.toLocaleDateString()}. Booking blocked.`
                }, { status: 400 });
            }
        }

        for (const item of cartItems) {
            const lenderCompanyId = workerCompanyMap.get(item.worker_id);
            if (!lenderCompanyId) continue;

            const start = new Date(item.start_date);
            const end = new Date(item.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const estimatedHours = diffDays * 8;

            const totalAmountCents = Math.round(item.hourly_rate * 100 * estimatedHours);
            const fees = calculateServiceFee(totalAmountCents);

            totalCartAmountCents += fees.totalAmount;

            const otTermsSnapshot = {
                ot_rate_type: (member as any).company?.ot_rate_type || '1.5x',
                ot_rule_daily: (member as any).company?.ot_rule_daily || false,
                ot_rule_weekend: (member as any).company?.ot_rule_weekend || false,
                ot_rule_weekly: (member as any).company?.ot_rule_weekly !== false, // default true
            };

            const booking: any = {
                project_id: item.project_id || projectId,
                worker_id: item.worker_id,
                borrower_company_id: member.company_id,
                lender_company_id: lenderCompanyId,
                start_date: item.start_date,
                end_date: item.end_date,
                status: 'Confirmed',
                payment_type: 'Credit Card',
                currency_code: 'USD',
                total_amount: fees.totalAmount,
                service_fee_amount: fees.serviceFee,
                worker_payout_amount: fees.workerPayout,
                booking_type: bookingType,
                ot_terms_snapshot: otTermsSnapshot,
            };

            bookingsToInsert.push(booking);
        }

        if (bookingsToInsert.length === 0) {
            return NextResponse.json({ error: "No valid bookings could be created." }, { status: 400 });
        }

        // 4. Get Borrower's Stripe Customer ID
        const { data: companyData } = await (supabase
            .from('companies')
            .select('stripe_customer_id')
            .eq('id', member.company_id)
            .single() as any);

        if (!companyData?.stripe_customer_id) {
            return NextResponse.json({ error: "Borrower company lacks a Stripe setup." }, { status: 400 });
        }

        // 5. Create PaymentIntent to hold funds in Escrow
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCartAmountCents,
            currency: 'usd',
            customer: companyData.stripe_customer_id,
            payment_method: paymentMethodId,
            confirm: true,
            capture_method: 'manual', // Hold Escrow
            description: `SmartBench Escrow for ${bookingsToInsert.length} booking(s)`,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings`, // Unused since off_session
            off_session: true, // We have the card on file and user is present but elements auth was via SetupIntent earlier or directly. Wait, if we use setupintent, off_session is true. If they just entered it, confirm: true might require redirect unless off_session. We'll use off_session: true to force MIT flow. 
        });

        // 6. Append payment intent to all bookings
        bookingsToInsert.forEach(b => {
            b.stripe_payment_intent_id = paymentIntent.id;
        });

        // 7. Insert Bookings
        const { error: insertError } = await supabase
            .from('bookings')
            .insert(bookingsToInsert);

        if (insertError) throw insertError;

        // 8. Clear Cart
        const { error: clearError } = await supabase
            .from('cart_items')
            .delete()
            .eq('borrower_company_id', member.company_id);

        if (clearError) {
            console.error("Failed to clear cart after booking:", clearError);
        }

        return NextResponse.json({ success: true, count: bookingsToInsert.length });

    } catch (error: any) {
        console.error("Checkout error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
