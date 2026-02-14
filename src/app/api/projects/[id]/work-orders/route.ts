import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id: projectId } = params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify access to project
    // Fetch user's company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

    // Verify project belongs to company
    const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', member.company_id)
        .single();

    if (!project) return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });

    const { data: workOrders, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(workOrders);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id: projectId } = params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validation
        if (!body.role || !body.quantity || !body.start_date || !body.end_date || !body.start_time || !body.end_time) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: member } = await supabase
            .from('company_members')
            .select('company_id, roles')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Check Role
        const roles = member.roles as string[];
        if (!roles.includes('Admin') && !roles.includes('Manager')) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        // Verify project ownership
        const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('company_id', member.company_id)
            .single();

        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        const { data, error } = await supabase
            .from('work_orders')
            .insert({
                project_id: projectId,
                role: body.role,
                quantity: body.quantity,
                start_date: body.start_date,
                end_date: body.end_date,
                start_time: body.start_time,
                end_time: body.end_time,
                status: 'Draft',
                description: body.description,
                hourly_rate_min: body.hourly_rate_min,
                hourly_rate_max: body.hourly_rate_max
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
