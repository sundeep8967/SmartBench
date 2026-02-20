import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) {
        return NextResponse.json({ error: "No active company found" }, { status: 403 });
    }

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', member.company_id)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validation
        if (!body.name || !body.address || !body.timezone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: member } = await supabase
            .from('company_members')
            .select('company_id, roles')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Check Role (Optional: Only Admins/Managers can create projects?)
        const roles = (member.roles as string[]).map(r => r.toLowerCase());
        if (!roles.includes('admin') && !roles.includes('manager')) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('projects')
            .insert({
                company_id: member.company_id,
                name: body.name,
                description: body.description,
                address: body.address,
                timezone: body.timezone,
                start_date: body.start_date,
                end_date: body.end_date,
                status: 'Active'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
