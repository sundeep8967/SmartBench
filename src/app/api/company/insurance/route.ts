import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { company_id, insurance_type, expiration_date, document_path, is_self_certified } = body;

        if (!company_id || !insurance_type || !expiration_date || !document_path || is_self_certified === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify User is Admin/Manager of this company
        const { data: membership, error: memberError } = await supabase
            .from("company_members")
            .select("roles, status")
            .eq("user_id", user.id)
            .eq("company_id", company_id)
            .single();

        if (memberError || !membership || membership.status !== 'Active') {
            return NextResponse.json({ error: "Forbidden: Not an active member of this company" }, { status: 403 });
        }

        const roles = membership.roles as string[];
        if (!roles.includes("Admin") && !roles.includes("Manager")) {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        // Transaction-like logic (Atomic would be better, but doing sequentially for now)
        // 1. Deactivate existing active policies of this type
        // Note: Using Service Role or just standard RLS? 
        // If RLS is set up correctly, user can update.
        // But preventing concurrency issues might require a Postgres function or strict RLS.
        // For MVP, we update first.

        await supabase
            .from("insurance_policies")
            .update({ is_active: false })
            .eq("company_id", company_id)
            .eq("insurance_type", insurance_type)
            .eq("is_active", true);

        // 2. Insert new policy
        const { data: newPolicy, error: insertError } = await supabase
            .from("insurance_policies")
            .insert({
                company_id,
                insurance_type,
                expiration_date,
                document_url: document_path,
                is_active: true,
                is_self_certified_by_lender: is_self_certified
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, policy: newPolicy });

    } catch (error: any) {
        console.error("Error saving insurance policy:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
