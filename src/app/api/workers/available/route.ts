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
    const { data: availabilityRecords } = await supabase
        .from('worker_availability')
        .select('worker_id, minimum_shift_length_hours')
        .eq('is_active', true)
        .neq('company_id', member.company_id);

    // Build a map: worker_id -> minimum_shift_length_hours
    const availabilityMap = new Map(
        (availabilityRecords || []).map(a => [a.worker_id, a.minimum_shift_length_hours])
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
    let profilesQuery = supabase
        .from('worker_profiles')
        .select(`
            *,
            user:users!inner(full_name, email)
        `)
        .in('user_id', listedWorkerIds)
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
    let filteredWorkers = workers || [];
    if (query) {
        filteredWorkers = filteredWorkers.filter(w => {
            const name = (w.user?.full_name || "").toLowerCase();
            const workerTrade = (w.trade || "").toLowerCase();
            const skills = Array.isArray(w.skills)
                ? (w.skills as string[]).map((s: string) => s.toLowerCase()).join(" ")
                : "";
            return name.includes(query) || workerTrade.includes(query) || skills.includes(query);
        });
    }

    // Exclude the current user from marketplace results
    filteredWorkers = filteredWorkers.filter(w => w.user_id !== user.id);

    // KEY FILTER: exclude workers whose minimum shift length > requested shift hours
    // e.g. if a worker requires 8-hour minimum and the borrower wants 6 hours, exclude that worker
    if (requestedShiftHours !== null) {
        filteredWorkers = filteredWorkers.filter(w => {
            const workerMin = availabilityMap.get(w.user_id);
            // If worker has no minimum set, they accept any shift length
            if (workerMin === null || workerMin === undefined) return true;
            return workerMin <= requestedShiftHours;
        });
    }

    // Apply Project constraints if a project is selected
    if (projectId && projectId !== "All") {
        const { data: project } = await supabase
            .from('projects')
            .select('daily_start_time, lat, lng')
            .eq('id', projectId)
            .single();

        if (project) {
            filteredWorkers = filteredWorkers.filter(w => {
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
                }

                return true;
            });
        }
    }

    // Attach rates and minimum shift length to each worker result
    const workersWithRates = filteredWorkers.map(w => {
        const rate = ratesMap.get(w.user_id);
        return {
            ...w,
            hourly_rate: rate?.hourly_rate || 45.00,
            overtime_rate: rate?.overtime_rate || null,
            minimum_shift_length_hours: availabilityMap.get(w.user_id) ?? null,
        };
    });

    return NextResponse.json({
        workers: workersWithRates,
        work_orders: workOrders || [],
    });
}
