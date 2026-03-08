import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Radius of earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase() || "";
    const trade = searchParams.get("trade") || "";
    const projectId = searchParams.get("projectId") || "";
    const shiftHoursParam = searchParams.get("shift_hours");
    const requestedShiftHours = shiftHoursParam ? parseInt(shiftHoursParam) : null;

    // Get user's company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .maybeSingle();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Get all active worker availability listings (these are the workers actually listed on the marketplace)
    // Exclude workers listed by the same company (you can't hire your own workers from the marketplace)
    const { data: availabilityRecords } = await (supabase as any)
        .from('worker_availability')
        .select(`
            worker_id, 
            minimum_shift_length_hours, 
            company_id,
            companies!inner(is_shadow_banned)
        `)
        .eq('is_active', true)
        .eq('companies.is_shadow_banned', false)
        .neq('company_id', member.company_id);

    // Build maps: worker_id -> minimum_shift_length_hours & worker_id -> lender_company_id
    const availabilityMap = new Map<string, { min_shift: number | null; company_id: string }>(
        (availabilityRecords || []).map((a: any) => [a.worker_id, { min_shift: a.minimum_shift_length_hours, company_id: a.company_id }])
    );

    // Only worker IDs that are actively listed
    const listedWorkerIds = Array.from(availabilityMap.keys());

    if (listedWorkerIds.length === 0) {
        const { data: workOrders } = await supabase
            .from('work_orders')
            .select('id, role, project:projects!inner(company_id)')
            .eq('projects.company_id', member.company_id)
            .in('status', ['Open', 'Draft']);
        return NextResponse.json({ workers: [], work_orders: workOrders || [] });
    }

    // Get worker profiles — only listed workers
    let profilesQuery = (supabase as any)
        .from('worker_profiles')
        .select(`
            *,
            user:users!inner(full_name, email, is_shadow_banned)
        `)
        .in('user_id', listedWorkerIds)
        .eq('users.is_shadow_banned', false)
        .limit(50);

    if (trade && trade !== "All") {
        profilesQuery = profilesQuery.ilike('trade', `%${trade}%`);
    }

    const { data: workers, error } = await profilesQuery;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get rates for workers
    const { data: rates } = await supabase
        .from('worker_rates')
        .select('worker_id, hourly_rate, overtime_rate');

    const ratesMap = new Map((rates || []).map(r => [r.worker_id, r]));

    // Get available work orders for this company
    const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, role, project:projects!inner(company_id)')
        .eq('projects.company_id', member.company_id)
        .in('status', ['Open', 'Draft']);

    // Filter by search query (name, trade, skills)
    let filteredWorkers: any[] = workers || [];
    if (query) {
        filteredWorkers = filteredWorkers.filter((w: any) => {
            const name = (w.user?.full_name || "").toLowerCase();
            const workerTrade = (w.trade || "").toLowerCase();
            const skills = Array.isArray(w.skills)
                ? (w.skills as string[]).map((s: string) => s.toLowerCase()).join(" ")
                : "";
            return name.includes(query) || workerTrade.includes(query) || skills.includes(query);
        });
    }

    // Exclude the current user from marketplace results
    filteredWorkers = filteredWorkers.filter((w: any) => w.user_id !== user.id);

    // KEY FILTER: exclude workers whose minimum shift length > requested shift hours
    // e.g. if a worker requires 8-hour minimum and the borrower wants 6 hours, exclude that worker
    if (requestedShiftHours !== null) {
        filteredWorkers = filteredWorkers.filter((w: any) => {
            const workerMin = availabilityMap.get(w.user_id)?.min_shift;
            // If worker has no minimum set, they accept any shift length
            if (workerMin === null || workerMin === undefined) return true;
            return workerMin <= requestedShiftHours;
        });
    }

    const distanceMap = new Map<string, number>();

    // Apply Project constraints if a project is selected
    if (projectId && projectId !== "All") {
        const { data: project } = await supabase
            .from('projects')
            .select('daily_start_time, lat, lng')
            .eq('id', projectId)
            .single();

        if (project) {
            filteredWorkers = filteredWorkers.filter((w: any) => {
                // Time constraint
                if (project.daily_start_time) {
                    const projectTime = project.daily_start_time.slice(0, 5);
                    const earliest = w.earliest_start_time?.slice(0, 5) || "00:00";
                    const latest = w.latest_start_time?.slice(0, 5) || "23:59";

                    if (projectTime < earliest || projectTime > latest) {
                        return false;
                    }
                }

                // Distance constraint
                if (project.lat && project.lng && w.lat && w.lng) {
                    const distance = calculateDistance(project.lat, project.lng, w.lat, w.lng);
                    const workerRadius = w.travel_radius_miles || 50;

                    if (distance > workerRadius) {
                        return false;
                    }
                    distanceMap.set(w.user_id, Math.round(distance));
                }

                return true;
            });
        }
    }

    // Compute On-Time Reliability % per worker
    // Formula (PRD Story 3.1): (clock-ins within 5 min of scheduled start) / total verified shifts * 100
    // Gracefully returns null if time_log table not yet created (Epic 5 pending)
    const workerIds = filteredWorkers.map(w => w.user_id);
    const onTimePctMap = new Map<string, number | null>();

    if (workerIds.length > 0) {
        try {
            const { data: onTimeData } = await (supabase as any).rpc('get_worker_on_time_pct', {
                worker_ids: workerIds
            });
            if (Array.isArray(onTimeData)) {
                for (const row of onTimeData) {
                    onTimePctMap.set(row.worker_id, row.on_time_pct);
                }
            }
        } catch {
            // time_log table not yet created — silently skip (Epic 5 pending)
        }
    }

    // Compute Lender Company Metrics per company (PRD Story 3.1)
    // Fulfillment Score = (1 - lender-cancelled / total confirmed+) * 100
    // "Reliable Partner" badge = fulfillment > 95%
    const lenderCompanyIds = [...new Set(
        filteredWorkers.map((w: any) => availabilityMap.get(w.user_id)?.company_id).filter(Boolean) as string[]
    )];
    const companyMetricsMap = new Map<string, { fulfillment_score: number | null; reliable_partner: boolean }>();

    if (lenderCompanyIds.length > 0) {
        try {
            const { data: companyData } = await (supabase as any).rpc('get_lender_company_metrics', {
                company_ids: lenderCompanyIds
            });
            if (Array.isArray(companyData)) {
                for (const row of companyData) {
                    companyMetricsMap.set(row.company_id, {
                        fulfillment_score: row.fulfillment_score,
                        reliable_partner: row.reliable_partner,
                    });
                }
            }
        } catch {
            // Silently skip if RPC unavailable
        }
    }

    // Fetch Reviews to calculate average_rating and review_count per worker
    const { data: reviewsData } = await (supabase as any)
        .from('worker_reviews')
        .select('worker_id, aggregate_rating')
        .in('worker_id', listedWorkerIds);

    const ratingsMap = new Map<string, { sum: number; count: number }>();
    if (reviewsData && Array.isArray(reviewsData)) {
        for (const row of reviewsData) {
            const current = ratingsMap.get(row.worker_id) || { sum: 0, count: 0 };
            current.sum += Number(row.aggregate_rating);
            current.count += 1;
            ratingsMap.set(row.worker_id, current);
        }
    }

    // Attach rates, minimum shift length, on-time %, company metrics, and ratings to each worker
    const workersWithRates = filteredWorkers.map((w: any) => {
        const rate = ratesMap.get(w.user_id);
        const avail = availabilityMap.get(w.user_id);
        const companyMetrics = companyMetricsMap.get(avail?.company_id || '') || null;
        return {
            ...w,
            hourly_rate: rate?.hourly_rate || 45.00,
            overtime_rate: rate?.overtime_rate || null,
            minimum_shift_length_hours: avail?.min_shift ?? null,
            lender_company_id: avail?.company_id ?? null,
            on_time_pct: onTimePctMap.get(w.user_id) ?? null,
            fulfillment_score: companyMetrics?.fulfillment_score ?? null,
            reliable_partner: companyMetrics?.reliable_partner ?? false,
            distance: distanceMap.get(w.user_id) ?? null,
            average_rating: ratingsMap.get(w.user_id) ? (ratingsMap.get(w.user_id)!.sum / ratingsMap.get(w.user_id)!.count).toFixed(1) : null,
            review_count: ratingsMap.get(w.user_id)?.count || 0,
        };
    });

    return NextResponse.json({
        workers: workersWithRates,
        work_orders: workOrders || [],
    });
}
