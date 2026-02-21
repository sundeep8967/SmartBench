"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProjectAction(formData: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id, roles')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) throw new Error("Forbidden");

    // Check Role
    const roles = (member.roles as string[]).map(r => r.toLowerCase());
    if (!roles.includes('admin') && !roles.includes('manager')) {
        throw new Error("Insufficient permissions");
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({
            company_id: member.company_id,
            name: formData.name,
            description: formData.description,
            address: formData.address,
            timezone: formData.timezone,
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: 'Active'
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/projects");
    return data;
}

export async function createWorkOrderAction(projectId: string, formData: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Verify company relation
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) throw new Error("Forbidden");

    // Verify Project belongs to Company
    const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', member.company_id)
        .single();

    if (!project) throw new Error("Project not found");

    const { data, error } = await supabase
        .from('work_orders')
        .insert({
            project_id: projectId,
            ...formData,
            status: 'Open'
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/projects/${projectId}`);
    return data;
}
