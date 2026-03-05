import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/timesheets/force-clockout
 * 
 * Supervisor/Admin can force clock out a worker who forgot to clock out.
 * Body: { user_id, time_entry_id, actual_clock_out? }
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify the actor has supervisor/admin role
    const { data: member } = await supabase
        .from("company_members")
        .select("company_id, roles")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    const memberRoles: string[] = (member as any).roles || [];
    const allowedRoles = ["Admin", "Manager", "Supervisor"];
    if (!memberRoles.some(r => allowedRoles.includes(r))) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { time_entry_id, actual_clock_out } = body;

    if (!time_entry_id) {
        return NextResponse.json({ error: "time_entry_id required" }, { status: 400 });
    }

    const clockOut = actual_clock_out ? new Date(actual_clock_out) : new Date();
    const autoApprovalAt = new Date(clockOut.getTime() + 4 * 60 * 60 * 1000);

    // Force clock out — must belong to this company
    const { data, error } = await supabase
        .from("time_entries")
        .update({
            clock_out: clockOut.toISOString(),
            status: "Pending_Verification",
            auto_approval_at: autoApprovalAt.toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", time_entry_id)
        .eq("company_id", member.company_id)
        .eq("status", "Active") // Only force-out active shifts
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "No active shift found for that entry ID" }, { status: 404 });

    return NextResponse.json({
        success: true,
        message: `Worker force-clocked out at ${clockOut.toLocaleTimeString()}`,
        time_entry: data,
    });
}
