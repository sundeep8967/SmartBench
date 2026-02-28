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
            project_description: formData.project_description,
            address: formData.address,
            lat: formData.lat,
            lng: formData.lng,
            timezone: formData.timezone,
            daily_start_time: formData.daily_start_time,
            meeting_location_type: formData.meeting_location_type,
            meeting_instructions: formData.meeting_instructions,
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

export async function deleteProjectAction(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Verify company relation
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id, roles')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) throw new Error("Forbidden");

    // Check Role
    const roles = (member.roles as string[]).map(r => r.toLowerCase());
    if (!roles.includes('admin')) {
        throw new Error("Only admins can delete projects");
    }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('company_id', member.company_id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/projects");
    return { success: true };
}

export async function updateProjectAction(projectId: string, formData: any) {
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

    const roles = (member.roles as string[]).map(r => r.toLowerCase());
    if (!roles.includes('admin') && !roles.includes('manager')) {
        throw new Error("Insufficient permissions");
    }

    const { data, error } = await supabase
        .from('projects')
        .update({
            name: formData.name,
            project_description: formData.project_description,
            address: formData.address,
            lat: formData.lat,
            lng: formData.lng,
            timezone: formData.timezone,
            daily_start_time: formData.daily_start_time,
            meeting_location_type: formData.meeting_location_type,
            meeting_instructions: formData.meeting_instructions,
        })
        .eq('id', projectId)
        .eq('company_id', member.company_id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/projects");
    return data;
}
