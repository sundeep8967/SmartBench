import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .maybeSingle();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Get bookings as borrower (money out — labor costs)
    const { data: borrowerBookings } = await supabase
        .from('bookings')
        .select(`
            id, status, total_amount, service_fee_amount, worker_payout_amount,
            start_date, end_date, created_at,
            worker:users!bookings_worker_id_fkey(full_name),
            project:projects(name)
        `)
        .eq('borrower_company_id', member.company_id)
        .order('created_at', { ascending: false })
        .limit(20);

    // Get bookings as lender (money in — lending revenue)
    const { data: lenderBookings } = await supabase
        .from('bookings')
        .select(`
            id, status, total_amount, service_fee_amount, worker_payout_amount,
            start_date, end_date, created_at,
            worker:users!bookings_worker_id_fkey(full_name),
            project:projects(name)
        `)
        .eq('lender_company_id', member.company_id)
        .order('created_at', { ascending: false })
        .limit(20);

    // Calculate summary metrics
    const moneyIn = (lenderBookings || [])
        .filter(b => b.status === 'Confirmed' || b.status === 'Active' || b.status === 'Completed')
        .reduce((sum, b) => sum + (Number(b.worker_payout_amount) || 0), 0);

    const moneyOut = (borrowerBookings || [])
        .filter(b => b.status === 'Confirmed' || b.status === 'Active' || b.status === 'Completed')
        .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

    // Build transactions list (combine both directions)
    const transactions = [
        ...(lenderBookings || []).map(b => ({
            id: b.id,
            date: b.created_at,
            description: `Lending Revenue — ${(b.worker as any)?.full_name || 'Worker'}`,
            subtext: (b.project as any)?.name || 'Project',
            type: 'Incoming' as const,
            amount: (Number(b.worker_payout_amount) || 0) / 100,
            status: b.status,
        })),
        ...(borrowerBookings || []).map(b => ({
            id: b.id,
            date: b.created_at,
            description: `Labor Cost — ${(b.worker as any)?.full_name || 'Worker'}`,
            subtext: (b.project as any)?.name || 'Project',
            type: 'Outgoing' as const,
            amount: (Number(b.total_amount) || 0) / 100,
            status: b.status,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
        balance: (moneyIn - moneyOut) / 100, // amounts stored in cents
        moneyIn: moneyIn / 100,
        moneyOut: moneyOut / 100,
        transactions,
    });
}
