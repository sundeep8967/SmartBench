import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    const companyId = member.company_id;

    // Parallel queries for dashboard stats
    const [bookingsRes, verificationsRes, financialsRes, recentBookingsRes] = await Promise.all([
        // 1. Active bookings count
        supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('borrower_company_id', companyId)
            .in('status', ['Confirmed', 'Active']),

        // 2. Pending verifications count (time entries waiting for review)
        supabase
            .from('time_entries')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'Pending'),

        // 3. Financial balance from bookings (money in - money out)
        Promise.all([
            // Money in (as lender)
            supabase
                .from('bookings')
                .select('total_cost')
                .eq('lender_company_id', companyId)
                .in('status', ['Confirmed', 'Active', 'Completed']),
            // Money out (as borrower)
            supabase
                .from('bookings')
                .select('total_cost')
                .eq('borrower_company_id', companyId)
                .in('status', ['Confirmed', 'Active', 'Completed']),
        ]),

        // 4. Recent bookings (last 5)
        supabase
            .from('bookings')
            .select(`
                id,
                status,
                start_date,
                end_date,
                created_at,
                worker:users!bookings_worker_id_fkey(full_name),
                project:projects(name)
            `)
            .eq('borrower_company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(5),
    ]);

    // Calculate financials
    const [lenderRes, borrowerRes] = financialsRes;
    const moneyIn = (lenderRes.data || []).reduce((sum, b) => sum + (b.total_cost || 0), 0);
    const moneyOut = (borrowerRes.data || []).reduce((sum, b) => sum + (b.total_cost || 0), 0);
    const balance = moneyIn - moneyOut;

    // Format recent bookings
    const recentBookings = (recentBookingsRes.data || []).map((b: any, i: number) => {
        const workerName = b.worker?.full_name || 'Unknown Worker';
        const initials = workerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        const startDate = b.start_date ? new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const endDate = b.end_date ? new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        return {
            id: `#BK-${String(i + 1).padStart(4, '0')}`,
            realId: b.id,
            worker: workerName,
            avatar: initials,
            dates: startDate && endDate ? `${startDate} - ${endDate}` : 'No dates set',
            status: b.status || 'Pending',
            project: b.project?.name || null,
        };
    });

    return NextResponse.json({
        activeBookings: bookingsRes.count || 0,
        pendingVerifications: verificationsRes.count || 0,
        balance,
        recentBookings,
    });
}
