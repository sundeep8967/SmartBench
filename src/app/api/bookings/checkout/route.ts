
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateServiceFee } from "@/lib/services/billing";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get Borrower Company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    try {
        // 2. Fetch Cart Items
        const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select(`
                *,
                work_order:work_orders(project_id, quantity),
                worker_profile:worker_profiles(user_id)
            `)
            .eq('borrower_company_id', member.company_id);

        if (cartError) throw cartError;
        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        // 3. Process each item into a booking
        const bookingsToInsert = [];
        const workOrdersToUpdate = [];

        // We need to fetch lender_company_id for each worker
        // For MVP, we assume the worker IS their own company or we fetch their company membership
        // Let's first fetch the worker's company membership
        const workerIds = cartItems.map(item => item.worker_id);
        const { data: workerMemberships } = await supabase
            .from('company_members')
            .select('user_id, company_id')
            .in('user_id', workerIds)
            .eq('status', 'Active'); // Assuming they have one active company

        const workerCompanyMap = new Map();
        workerMemberships?.forEach(m => workerCompanyMap.set(m.user_id, m.company_id));



        for (const item of cartItems) {
            // Get lender company ID (Worker's company)
            const lenderCompanyId = workerCompanyMap.get(item.worker_id);
            if (!lenderCompanyId) {
                // Skip or handle error. For now, we log and skip to avoid crashing the whole checkout.
                console.warn(`Worker ${item.worker_id} has no active company. Skipping.`);
                continue;
            }

            // Calculate Amounts
            // Simplified logic: Assume 8 hours per day between start and end date (inclusive)
            const start = new Date(item.start_date);
            const end = new Date(item.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const estimatedHours = diffDays * 8;

            // Total Amount in Cents (hourly_rate is in dollars in DB? need to verify. Assuming dollars based on UI)
            // If DB stores rate in dollars, convert to cents: rate * 100 * hours
            const totalAmountCents = Math.round(item.hourly_rate * 100 * estimatedHours);

            const fees = calculateServiceFee(totalAmountCents);

            // Construct Booking Object
            // We use 'any' to bypass strict TS checks for now as we are doing a rapid implementation
            // and the DB schema is the source of truth.
            const booking: any = {
                project_id: item.work_order?.project_id, // Accessing joined data
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
                work_order_id: item.work_order_id,
                // created_at and updated_at are usually handled by DB default, but we can set them
            };

            bookingsToInsert.push(booking);
        }

        if (bookingsToInsert.length === 0) {
            return NextResponse.json({ error: "No valid bookings could be created (e.g. workers missing companies)" }, { status: 400 });
        }

        // 4. Insert Bookings
        const { error: insertError } = await supabase
            .from('bookings')
            .insert(bookingsToInsert);

        if (insertError) throw insertError;

        // 5. Clear Cart
        const { error: clearError } = await supabase
            .from('cart_items')
            .delete()
            .eq('borrower_company_id', member.company_id);

        if (clearError) {
            console.error("Failed to clear cart after booking:", clearError);
            // We don't fail the request because booking was successful
        }

        return NextResponse.json({ success: true, count: bookingsToInsert.length });

    } catch (error: any) {
        console.error("Checkout error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
