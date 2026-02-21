import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validation (basic)
        if (!body.break_policy_type || !body.lunch_policy_type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify User is Admin/Manager 
        // (Assuming createClient handles cookies, and we are fetching membership)
        const { data: member, error: memberError } = await supabase
            .from("company_members")
            .select("company_id, roles, status")
            .eq("user_id", user.id)
            .single();

        if (memberError || !member || member.status !== 'Active') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const roles = member.roles as string[];
        if (!roles.includes("Admin") && !roles.includes("Manager")) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        // Update Company Table
        const { error: updateError } = await supabase
            .from("companies")
            .update({
                break_policy_type: body.break_policy_type,
                break_duration_minutes: body.break_duration_minutes,
                break_required_after_hours: body.break_required_after_hours,
                lunch_policy_type: body.lunch_policy_type,
                lunch_duration_minutes: body.lunch_duration_minutes,
                lunch_required_after_hours: body.lunch_required_after_hours,
                ot_rate_type: body.ot_rate_type,
                ot_rule_daily: body.ot_rule_daily,
                ot_rule_weekly: body.ot_rule_weekly,
                ot_rule_weekend: body.ot_rule_weekend,
                updated_at: new Date().toISOString()
            })
            .eq("id", member.company_id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error saving policies:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
