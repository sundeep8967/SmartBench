import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
            *,
            work_order:work_orders(*),
            worker_profile:worker_profiles(*),
            worker:users!cart_items_worker_id_fkey(full_name)
        `)
        .eq('borrower_company_id', member.company_id)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(cartItems);
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { work_order_id, worker_id, hourly_rate, start_date, end_date } = body;

    // Get Company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Validate inputs
    if (!work_order_id || !worker_id || !start_date || !end_date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert
    const { data, error } = await supabase
        .from('cart_items')
        .insert({
            borrower_company_id: member.company_id,
            work_order_id,
            worker_id,
            hourly_rate,
            start_date,
            end_date
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            return NextResponse.json({ error: "Worker is already in cart for this work order" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
