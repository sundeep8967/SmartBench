"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import tzlookup from "tz-lookup";

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

    // MVP geo-restriction: Minnesota only
    const stateInput = (formData.state || "").toLowerCase();
    if (stateInput && stateInput !== "minnesota" && stateInput !== "mn") {
        throw new Error("SmartBench is currently only available in Minnesota.");
    }

    // Auto-derive timezone from project coordinates
    const timezone = (formData.lat && formData.lng)
        ? tzlookup(formData.lat, formData.lng)
        : "America/Chicago"; // fallback for MVP

    const { data, error } = await supabase
        .from('projects')
        .insert({
            company_id: member.company_id,
            name: formData.name,
            project_description: formData.project_description,
            address: formData.address,
            city: formData.city || null,
            state: formData.state || null,
            zip: formData.zip || null,
            lat: formData.lat,
            lng: formData.lng,
            timezone,
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

    // Check Role
    const roles = (member.roles as string[]).map(r => r.toLowerCase());
    if (!roles.includes('admin') && !roles.includes('manager')) {
        throw new Error("Insufficient permissions");
    }

    // MVP geo-restriction: Minnesota only
    const stateInput = (formData.state || "").toLowerCase();
    if (stateInput && stateInput !== "minnesota" && stateInput !== "mn") {
        throw new Error("SmartBench is currently only available in Minnesota.");
    }

    // Auto-derive timezone from project coordinates
    const timezone = (formData.lat && formData.lng)
        ? tzlookup(formData.lat, formData.lng)
        : "America/Chicago"; // fallback for MVP

    const { data, error } = await supabase
        .from('projects')
        .update({
            name: formData.name,
            project_description: formData.project_description,
            address: formData.address,
            city: formData.city || null,
            state: formData.state || null,
            zip: formData.zip || null,
            lat: formData.lat,
            lng: formData.lng,
            timezone,
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

export async function bulkDeleteProjectsAction(projectIds: string[]) {
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
    if (!roles.includes('admin')) {
        throw new Error("Only admins can delete projects");
    }

    const { error } = await supabase
        .from('projects')
        .delete()
        .in('id', projectIds)
        .eq('company_id', member.company_id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/projects");
    return { success: true };
}

export async function bulkImportProjectsAction(projectsData: any[]) {
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

    // Attach company_id to all projects
    const payload = projectsData.map(p => ({
        ...p,
        company_id: member.company_id
    }));

    const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/projects");
    return data;
}
