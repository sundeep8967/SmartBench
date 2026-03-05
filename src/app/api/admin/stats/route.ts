import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/stats
 * Super Admin only — returns global platform statistics
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only Super Admins (role contains 'SuperAdmin' or 'super_admin')
    const { data: memberData } = await supabase
        .from("company_members")
        .select("roles")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .maybeSingle();

    const roles: string[] = (memberData as any)?.roles || [];
    const isSuperAdmin = roles.some(r => ["SuperAdmin", "super_admin"].includes(r));
    // For dev: also allow if the user's email has the platform domain
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isDevAdmin = authUser?.email?.endsWith("@smartbench.com") || false;

    if (!isSuperAdmin && !isDevAdmin) {
        return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
    }

    // Use service role client for full data access
    const adminDb = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [
        { count: totalUsers },
        { count: totalCompanies },
        { count: totalBookings },
        { count: activeBookings },
        { count: totalTimeEntries },
        { data: recentBookings },
        { data: recentUsers },
    ] = await Promise.all([
        adminDb.from("users").select("*", { count: "exact", head: true }),
        adminDb.from("companies").select("*", { count: "exact", head: true }),
        adminDb.from("bookings").select("*", { count: "exact", head: true }),
        adminDb.from("bookings").select("*", { count: "exact", head: true }).eq("status", "Active"),
        adminDb.from("time_entries").select("*", { count: "exact", head: true }),
        adminDb.from("bookings").select("id, status, total_amount, created_at").order("created_at", { ascending: false }).limit(5),
        adminDb.from("users").select("id, full_name, email, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    // Revenue from confirmed/completed bookings
    const { data: revenueData } = await adminDb
        .from("bookings")
        .select("service_fee_amount, total_amount, status")
        .in("status", ["Confirmed", "Completed", "Active"]);

    const totalRevenue = (revenueData || []).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    const totalServiceFees = (revenueData || []).reduce((sum, b) => sum + (Number(b.service_fee_amount) || 0), 0);

    // Payout stats
    const { data: payoutData } = await adminDb
        .from("time_entries")
        .select("payout_amount, payout_released")
        .eq("payout_released", true);

    const totalPayoutsReleased = (payoutData || []).reduce((sum, e) => sum + (Number(e.payout_amount) || 0), 0);

    return NextResponse.json({
        summary: {
            totalUsers: totalUsers || 0,
            totalCompanies: totalCompanies || 0,
            totalBookings: totalBookings || 0,
            activeBookings: activeBookings || 0,
            totalTimeEntries: totalTimeEntries || 0,
            totalRevenueCents: totalRevenue,
            totalServiceFeesCents: totalServiceFees,
            totalPayoutsReleasedCents: totalPayoutsReleased,
        },
        recentBookings: recentBookings || [],
        recentUsers: recentUsers || [],
    });
}
