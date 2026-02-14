import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Borrower Company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Fetch Bookings
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            *,
            project:projects(name, address),
            worker:users!bookings_worker_id_fkey(full_name, email),
            work_order:work_orders(role)
        `)
        .eq('borrower_company_id', member.company_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(bookings);
}
