"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateWorkerProfileAction(formData: {
    travel_radius_miles: number;
    earliest_start_time: string;
    latest_start_time: string;
    home_zip_code: string;
    home_city?: string;
    home_state?: string;
    home_timezone?: string;
    lat?: number;
    lng?: number;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('worker_profiles')
        .upsert({
            user_id: user.id,
            travel_radius_miles: formData.travel_radius_miles,
            earliest_start_time: formData.earliest_start_time,
            latest_start_time: formData.latest_start_time,
            home_zip_code: formData.home_zip_code,
            home_city: formData.home_city || null,
            home_state: formData.home_state || null,
            home_timezone: formData.home_timezone || null,
            lat: formData.lat || null,
            lng: formData.lng || null,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function updateCompanyProfileAction(companyId: string, data: {
    minimum_shift_length_hours: number;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Verify company member
    const { data: member } = await supabase
        .from('company_members')
        .select('roles')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .eq('status', 'Active')
        .single();

    if (!member) throw new Error("Forbidden");

    const roles = (member.roles as string[]).map(r => r.toLowerCase());
    if (!roles.includes('admin') && !roles.includes('manager')) {
        throw new Error("Insufficient permissions");
    }

    const { error } = await supabase
        .from('companies')
        .update({
            minimum_shift_length_hours: data.minimum_shift_length_hours
        })
        .eq('id', companyId);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/settings");
    return { success: true };
}
