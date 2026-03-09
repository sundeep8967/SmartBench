import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function isSuperAdmin(supabase: any, userId: string): Promise<boolean> {
    const { data: member } = await supabase
        .from('company_members')
        .select('roles')
        .eq('user_id', userId)
        .limit(1)
        .single();

    if (!member) return false;
    const roles = Array.isArray(member.roles) ? member.roles : [];
    return roles.includes('SuperAdmin');
}

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await isSuperAdmin(supabase, session.user.id);
    if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const service = searchParams.get("service");

    let query = supabase
        .from('system_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (service) {
        query = query.eq('service', service);
    }

    const { data: logs, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs });
}

export async function PATCH(req: NextRequest) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await isSuperAdmin(supabase, session.user.id);
    if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, resolved } = body;

        if (!id || typeof resolved !== 'boolean') {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { error } = await supabase
            .from('system_logs' as any)
            .update({ resolved })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
