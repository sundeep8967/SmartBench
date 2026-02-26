import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase() || "";
    const trade = searchParams.get("trade") || "";
    const projectId = searchParams.get("projectId") || "";

    // Get user's company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .maybeSingle();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Get all worker profiles with user info
    let profilesQuery = supabase
        .from('worker_profiles')
        .select(`
            *,
            user:users!inner(full_name, email)
        `)
        .limit(50);

    if (trade && trade !== "All") {
        profilesQuery = profilesQuery.ilike('trade', `%${trade}%`);
    }

    const { data: workers, error } = await profilesQuery;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get rates for this company's workers
    const { data: rates } = await supabase
        .from('worker_rates')
        .select('worker_id, hourly_rate, overtime_rate')
        .eq('company_id', member.company_id);

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
                ? w.skills.map((s: string) => s.toLowerCase()).join(" ")
                : "";
            return name.includes(query) || workerTrade.includes(query) || skills.includes(query);
        });
    }

    // Exclude the current user from marketplace results
    filteredWorkers = filteredWorkers.filter(w => w.user_id !== user.id);

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
                    const projectTime = project.daily_start_time.slice(0, 5); // "HH:MM"
                    const earliest = w.earliest_start_time?.slice(0, 5) || "00:00";
                    const latest = w.latest_start_time?.slice(0, 5) || "23:59";

                    if (projectTime < earliest || projectTime > latest) {
                        return false;
                    }
                }

                // TODO: Distance constraint requires Worker Lat/Lng which are derived from Zip Code
                // For now, filtering strictly by time if provided. (Geolocation of Zip codes to follow)

                return true;
            });
        }
    }

    // Attach rates
    const workersWithRates = filteredWorkers.map(w => {
        const rate = ratesMap.get(w.user_id);
        return {
            ...w,
            hourly_rate: rate?.hourly_rate || 45.00,
            overtime_rate: rate?.overtime_rate || null,
        };
    });

    return NextResponse.json({
        workers: workersWithRates,
        work_orders: workOrders || [],
    });
}
