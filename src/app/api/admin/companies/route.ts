import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/admin/companies
export async function GET(request: NextRequest) {
    const supabaseServer = await createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { createClient: createLocalClient } = await import("@/lib/supabase/server");
    const supabase = await createLocalClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: companyMember } = await supabase
        .from('company_members')
        .select('roles')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .contains('roles', ['SuperAdmin'])
        .maybeSingle();

    if (!companyMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: companies, error } = await supabaseServer
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ companies });
}

export async function PATCH(request: NextRequest) {
    const supabaseServer = await createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { createClient: createLocalClient } = await import("@/lib/supabase/server");
    const supabase = await createLocalClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: companyMember } = await supabase
        .from('company_members')
        .select('roles')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .contains('roles', ['SuperAdmin'])
        .maybeSingle();

    if (!companyMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, companyId, value } = await request.json();

    if (action === "ban") {
        const { error } = await supabaseServer
            .from("companies")
            .update({
                is_banned: value.isBanned,
                banned_reason: value.reason || null,
                banned_at: value.isBanned ? new Date().toISOString() : null
            })
            .eq("id", companyId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (action === "strike") {
        const { error } = await supabaseServer
            .from("companies")
            .update({ strikes: value })
            .eq("id", companyId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
