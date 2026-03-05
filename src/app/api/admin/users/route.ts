import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/admin/users
// Needs service role key to access auth.users + public.users
export async function GET(request: NextRequest) {
    const supabaseServer = await createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // To verify admin status via standard client
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

    // Fetch users with their profiles and latest bookings via service_role bypassing RLS
    const { data: users, error } = await supabaseServer
        .from("users")
        .select(`
            *,
            company_members (
                company:companies(name)
            )
        `)
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ users });
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

    const { action, userId, value } = await request.json();

    if (action === "ban") {
        const { error } = await supabaseServer
            .from("users")
            .update({
                is_banned: value.isBanned,
                banned_reason: value.reason || null,
                banned_at: value.isBanned ? new Date().toISOString() : null
            })
            .eq("id", userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Optionally update auth user meta to prevent token refresh
        await supabaseServer.auth.admin.updateUserById(userId, {
            user_metadata: { is_banned: value.isBanned }
        });

    } else if (action === "strike") {
        const { error } = await supabaseServer
            .from("users")
            .update({ strikes: value })
            .eq("id", userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
