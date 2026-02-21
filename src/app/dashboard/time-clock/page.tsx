import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimeClockClient from "./TimeClockClient";

export default async function TimeClockPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) {
        return (
            <div className="flex items-center justify-center py-16">
                <p className="text-gray-500">You must be affiliated with an active company to track time.</p>
            </div>
        );
    }

    // Parallel Server Fetching
    const [activeShiftRes, recentShiftsRes, projectsRes] = await Promise.all([
        // Get active shift (clocked in, not yet clocked out)
        supabase
            .from('time_entries')
            .select('*, project:projects(name)')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .is('clock_out', null)
            .order('clock_in', { ascending: false })
            .limit(1)
            .maybeSingle(),

        // Get recent completed shifts (last 7 days)
        supabase
            .from('time_entries')
            .select('*, project:projects(name)')
            .eq('user_id', user.id)
            .not('clock_out', 'is', null)
            .gte('clock_in', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('clock_in', { ascending: false })
            .limit(10),

        // Get available projects for clock-in
        supabase
            .from('projects')
            .select('id, name')
            .eq('company_id', member.company_id)
            .eq('status', 'Active')
    ]);

    return (
        <TimeClockClient
            initialActiveShift={activeShiftRes.data || null}
            recentShifts={recentShiftsRes.data || []}
            projects={projectsRes.data || []}
        />
    );
}
