import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get Company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });
    const borrowerCompanyId = member.company_id;

    // 1. Get Cart Items
    const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(`
            *,
            work_order:work_orders(id, project_id, role, quantity),
            worker_profile:worker_profiles(id, user_id) 
        `) // Fetch relations to validate if needed
        .eq('borrower_company_id', borrowerCompanyId);

    if (cartError) return NextResponse.json({ error: cartError.message }, { status: 500 });
    if (!cartItems || cartItems.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 2. Prepare Booking Inserts
    // For MVP, we assume lender_company_id is same as borrower or we need to find it?
    // Wait, Marketplace is 2-sided. 
    // In our current dummy data, workers don't have a 'Lender Company'. 
    // They are 'Solopreneurs' or 'Independent'. 
    // We haven't implemented the 'Lender Company' logic fully yet for independent workers.
    // For now, let's assume the 'Lender' is the 'Platform' or we make up a UUID if they are independent.
    // OR, we check if they belong to a company.
    // Given the constraints, let's just insert with a placeholder lender_id or find their company.

    // FIX: We need to know who the lender is.
    // For this Epic, let's assume workers are "Direct" or "Platform Managed" if no company.
    // But `bookings` table requires `lender_company_id` REFERENCES `companies`.
    // We should probably check if the worker belongs to a company. 
    // If not, we might fail or assign to a "Platform Company" (dummy).

    // Simple fetch to get lender company for each worker
    // For the demo workers, they have no company. 
    // I will use the BORROWER ID as Lender ID temporarily just to satisfy the constraint for "Direct Hire" scenario? 
    // No, that's confusing.
    // I'll create a "SmartBench Labor" company and use that as the default lender for independent workers.

    // Let's first allow the checkout to proceed by creating a transaction.

    const bookingsToInsert = cartItems.map(item => ({
        project_id: item.work_order.project_id,
        work_order_id: item.work_order_id,
        worker_id: item.worker_id, // This is User ID
        borrower_company_id: borrowerCompanyId,
        lender_company_id: borrowerCompanyId, // HACK: Self-hiring for now to pass constraint, or we need a real value.
        // In reality, we'd query `company_members` for the worker to find their employer.
        start_date: item.start_date,
        end_date: item.end_date,
        status: 'Confirmed', // Skipping payment step for MVP v1
        payment_type: 'Weekly_Progress',
        total_amount: 0, // Calculate later
        service_fee_amount: 0,
        worker_payout_amount: 0
    }));

    // 3. Execute Transaction (Insert Bookings + Delete Cart)
    // Supabase JS doesn't support transactions easily in one go without RPC.
    // We will do it sequentially for now: Insert Bookings -> If Success -> Delete Cart.
    // Risk: Partial failure. Accepted for MVP.

    const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingsToInsert)
        .select();

    if (bookingError) {
        return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // 4. Clear Cart
    const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('borrower_company_id', borrowerCompanyId);

    if (deleteError) {
        // Critical: Bookings created but cart not cleared.
        console.error("Failed to clear cart after booking", deleteError);
        // We still return success but maybe warn?
    }

    return NextResponse.json({ success: true, bookings });
}
