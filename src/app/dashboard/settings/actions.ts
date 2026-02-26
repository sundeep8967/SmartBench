"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateWorkerProfileAction(formData: {
    travel_radius_miles: number;
    earliest_start_time: string;
    latest_start_time: string;
    home_zip_code: string;
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
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/settings");
    return { success: true };
}
