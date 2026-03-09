import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const weeks = parseInt(url.searchParams.get('weeks') || '12');

        const { data: member } = await supabase
            .from('company_members')
            .select('company_id, roles')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        if (!member) return NextResponse.json({ error: 'No company' }, { status: 403 });

        const companyId = member.company_id;
        const roles = (member.roles as string[]) || [];
        const isAdmin = roles.some((r: string) => ['Admin', 'SuperAdmin'].includes(r));

        // Date range for charts
        const since = new Date();
        since.setDate(since.getDate() - weeks * 7);
        const sinceISO = since.toISOString();

        // 1. Get pre-computed KPIs & Charts via Postgres RPC
        const kpisRes = await supabase.rpc('get_company_analytics_kpis', {
            p_company_id: companyId,
            p_weeks: weeks
        });

        // 2. Get pre-computed Top Workers via Postgres RPC
        const topWorkersRes = await supabase.rpc('get_company_top_workers', {
            p_company_id: companyId,
            p_weeks: weeks
        });

        // 3. Insurance expiring soon (keep original query, it's lightweight)
        const insuranceRes = await supabase.from('insurance_policies')
            .select('insurance_type, expiration_date')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .lte('expiration_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .gte('expiration_date', new Date().toISOString().split('T')[0]);

        // 4. Upcoming shifts (keep original, it's just limit 10)
        const upcomingShiftsRes = await supabase.from('bookings')
            .select('id, start_date, end_date, status, worker:users!bookings_worker_id_fkey(full_name)')
            .or(`lender_company_id.eq.${companyId},borrower_company_id.eq.${companyId}`)
            .in('status', ['Confirmed', 'Active'])
            .gte('start_date', new Date().toISOString().split('T')[0])
            .lte('start_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('start_date')
            .limit(10);

        // 5. Recent bookings for table (keep original, it's just limit 8)
        const recentBookingsRes = await supabase.from('bookings')
            .select('id, status, start_date, end_date, total_amount, worker_payout_amount, lender_company_id, borrower_company_id, worker:users!bookings_worker_id_fkey(full_name), project:projects(name)')
            .or(`lender_company_id.eq.${companyId},borrower_company_id.eq.${companyId}`)
            .order('created_at', { ascending: false })
            .limit(8);

        if (kpisRes.error) throw new Error(`KPI RPC Error: ${kpisRes.error.message}`);
        if (topWorkersRes.error) throw new Error(`Top Workers Error: ${topWorkersRes.error.message}`);

        const { kpis, chartData } = kpisRes.data as { kpis: any, chartData: any[] };
        const topWorkers = topWorkersRes.data || [];

        // Hide revenue/spend for non-admins
        if (!isAdmin) {
            kpis.totalRevenue = null;
            kpis.totalSpend = null;
            kpis.totalServiceFees = null;
        } else {
            kpis.totalRevenue = parseFloat((kpis.totalRevenue || 0).toFixed(2));
            kpis.totalSpend = parseFloat((kpis.totalSpend || 0).toFixed(2));
            kpis.totalServiceFees = parseFloat((kpis.totalServiceFees || 0).toFixed(2));
        }

        // Round total hours
        kpis.totalHours = parseFloat((kpis.totalHours || 0).toFixed(1));

        // === Alerts ===
        const alerts = [];
        if (kpis.pendingVerifications > 0) {
            alerts.push({ type: 'warning', message: `${kpis.pendingVerifications} timesheet${kpis.pendingVerifications > 1 ? 's' : ''} pending verification`, action: '/dashboard/timesheets', actionLabel: 'Review' });
        }
        for (const ins of insuranceRes.data || []) {
            const daysLeft = Math.ceil((new Date(ins.expiration_date).getTime() - Date.now()) / 86400000);
            alerts.push({ type: daysLeft <= 7 ? 'critical' : 'warning', message: `${ins.insurance_type} insurance expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, action: '/dashboard/insurance', actionLabel: 'Update' });
        }
        for (const shift of upcomingShiftsRes.data || [] as any[]) {
            alerts.push({ type: 'info', message: `Upcoming shift: ${(shift.worker as any)?.full_name || 'Worker'} on ${new Date(shift.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`, action: '/dashboard/bookings', actionLabel: 'View' });
        }

        return NextResponse.json({
            kpis,
            chartData,
            topWorkers,
            alerts: alerts.slice(0, 10),
            recentBookings: (recentBookingsRes.data || []).map((b: any) => ({
                id: b.id,
                status: b.status,
                startDate: b.start_date,
                endDate: b.end_date,
                totalAmount: (b.total_amount || 0) / 100,
                workerName: b.worker?.full_name || 'Unknown',
                projectName: b.project?.name || null,
                isLender: b.lender_company_id === companyId,
            })),
            isAdmin,
        });

    } catch (err: any) {
        console.error('[analytics/company]', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
