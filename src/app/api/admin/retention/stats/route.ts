import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Verify caller is Super Admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];

        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: superAdmin } = await supabaseAdmin
            .from("super_admins")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!superAdmin) {
            return NextResponse.json({ error: "Forbidden - Super Admin required" }, { status: 403 });
        }

        // 2. Calculate thresholds
        const now = new Date();
        const sevenYearsAgo = new Date(now.getTime() - 7 * 365 * 24 * 60 * 60 * 1000).toISOString();
        const sevenYearsMinus30DaysAgo = new Date(now.getTime() - (7 * 365 - 30) * 24 * 60 * 60 * 1000).toISOString();

        // 3. Fetch statistics
        // Bookings (7 years)
        const { count: totalBookings } = await supabaseAdmin.from("bookings").select("*", { count: "exact", head: true });
        const { count: expiredBookings } = await supabaseAdmin.from("bookings").select("*", { count: "exact", head: true }).lt("created_at", sevenYearsAgo);
        const { count: expiringSoonBookings } = await supabaseAdmin.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", sevenYearsAgo).lt("created_at", sevenYearsMinus30DaysAgo);

        // Audit Logs (7 years)
        const { count: totalAuditLogs } = await supabaseAdmin.from("audit_log").select("*", { count: "exact", head: true });
        const { count: expiredAuditLogs } = await supabaseAdmin.from("audit_log").select("*", { count: "exact", head: true }).lt("timestamp", sevenYearsAgo);
        const { count: expiringSoonAuditLogs } = await supabaseAdmin.from("audit_log").select("*", { count: "exact", head: true }).gte("timestamp", sevenYearsAgo).lt("timestamp", sevenYearsMinus30DaysAgo);

        return NextResponse.json({
            bookings: {
                total: totalBookings || 0,
                expired: expiredBookings || 0,
                expiringSoon: expiringSoonBookings || 0,
                retentionPeriod: "7 Years"
            },
            auditLogs: {
                total: totalAuditLogs || 0,
                expired: expiredAuditLogs || 0,
                expiringSoon: expiringSoonAuditLogs || 0,
                retentionPeriod: "7 Years"
            }
        });

    } catch (e: any) {
        console.error("[Data Retention Stats] Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
