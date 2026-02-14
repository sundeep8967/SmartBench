import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Mock implementation for MVP until we have real availability logic
    // In a real app, this would filter by skills, dates, location, etc.

    // 1. Get all worker profiles
    const { data: workers, error } = await supabase
        .from('worker_profiles')
        .select(`
            *,
            user:users!inner(full_name, email, mobile_number)
        `)
        .limit(20);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Attach mock rates (since we might not have rate cards per company yet)
    // In Epic 4 implementation plan, we said we'd use 'worker_rates' table but for MVP we might just use a base rate.
    const workersWithRates = workers.map(w => ({
        ...w,
        hourly_rate: 45.00, // Standard rate for MVP
        distance_miles: Math.floor(Math.random() * 30) + 1 // Mock distance
    }));

    return NextResponse.json(workersWithRates);
}
