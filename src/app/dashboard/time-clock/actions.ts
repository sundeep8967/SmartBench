"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface GpsCoords {
    lat: number;
    lng: number;
    accuracy: number;
}

export async function timeClockAction(
    action: "clock_in" | "clock_out" | "start_break" | "end_break",
    projectId?: string,
    timeEntryId?: string,
    gps?: GpsCoords | null,
    photoUrl?: string | null,
    draftData?: {
        clock_in?: string;
        clock_out?: string;
        total_break_minutes?: number;
    }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) throw new Error("No active company");

    let result;

    switch (action) {
        case 'clock_in': {
            if (!photoUrl) throw new Error("A project photo is required to clock in.");

            // Check no existing active shift
            const { data: existing } = await supabase
                .from('time_entries')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'Active')
                .is('clock_out', null)
                .maybeSingle();

            if (existing) throw new Error("Already clocked in");

            const { data, error } = await supabase
                .from('time_entries')
                .insert({
                    user_id: user.id,
                    company_id: member.company_id,
                    project_id: projectId || null,
                    clock_in: new Date().toISOString(),
                    status: 'Active',
                    project_photo_url: photoUrl,
                    ...(gps ? { gps_clock_in: { lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy } } : {}),
                })
                .select('*, project:projects(name)')
                .single();

            if (error) throw new Error(error.message);
            result = data;
            break;
        }


        case 'clock_out': {
            if (!timeEntryId) throw new Error("timeEntryId required");

            const clockOut = draftData?.clock_out ? new Date(draftData.clock_out) : new Date();
            // Auto-approval fires exactly 4 hours after submission
            const autoApprovalAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

            const updatePayload: any = {
                clock_out: clockOut.toISOString(),
                status: 'Pending_Verification',
                auto_approval_at: autoApprovalAt.toISOString(),
                updated_at: new Date().toISOString(),
                ...(gps ? { gps_clock_out: { lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy } } : {}),
            };

            if (draftData?.clock_in) {
                updatePayload.clock_in = new Date(draftData.clock_in).toISOString();
            }
            if (draftData?.total_break_minutes !== undefined) {
                updatePayload.total_break_minutes = draftData.total_break_minutes;
            }

            const { error } = await supabase
                .from('time_entries')
                .update(updatePayload)
                .eq('id', timeEntryId)
                .eq('user_id', user.id);

            if (error) throw new Error(error.message);
            result = null; // Active shift is gone
            break;
        }

        case 'start_break': {
            if (!timeEntryId) throw new Error("timeEntryId required");

            const { data, error } = await supabase
                .from('time_entries')
                .update({ break_start: new Date().toISOString() })
                .eq('id', timeEntryId)
                .eq('user_id', user.id)
                .select('*, project:projects(name)')
                .single();

            if (error) throw new Error(error.message);
            result = data;
            break;
        }

        case 'end_break': {
            if (!timeEntryId) throw new Error("timeEntryId required");

            const { data: entry } = await supabase
                .from('time_entries')
                .select('break_start, total_break_minutes')
                .eq('id', timeEntryId)
                .single();

            if (!entry?.break_start) throw new Error("No active break");

            const breakMinutes = Math.round((Date.now() - new Date(entry.break_start).getTime()) / 60000);

            const { data, error } = await supabase
                .from('time_entries')
                .update({
                    break_start: null,
                    break_end: new Date().toISOString(),
                    total_break_minutes: (entry.total_break_minutes || 0) + breakMinutes,
                })
                .eq('id', timeEntryId)
                .eq('user_id', user.id)
                .select('*, project:projects(name)')
                .single();

            if (error) throw new Error(error.message);
            result = data;
            break;
        }

        default:
            throw new Error("Invalid action");
    }

    // This is the magic: Tell Next.js to instantly re-render the server component for this route
    revalidatePath("/dashboard/time-clock");

    return result;
}

export async function manualTimeEntryAction(
    projectId: string,
    date: string,
    startTime: string,
    endTime: string,
    notes: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) throw new Error("No active company");

    if (!projectId) throw new Error("Project is required");

    // Construct valid Date objects
    // date is "YYYY-MM-DD", startTime is "HH:mm", endTime is "HH:mm"
    const clockIn = new Date(`${date}T${startTime}:00`);
    let clockOut = new Date(`${date}T${endTime}:00`);

    // Handle overnight shifts across midnight
    if (clockOut < clockIn) {
        clockOut = new Date(clockOut.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
    }

    if (isNaN(clockIn.getTime()) || isNaN(clockOut.getTime())) {
        throw new Error("Invalid date or time provided");
    }

    const autoApprovalAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from SUBMISSION

    const { error } = await supabase
        .from('time_entries')
        .insert({
            user_id: user.id,
            company_id: member.company_id,
            project_id: projectId,
            clock_in: clockIn.toISOString(),
            clock_out: clockOut.toISOString(),
            status: 'Pending_Verification',
            notes: `[Manual Entry] ${notes}`,
            auto_approval_at: autoApprovalAt.toISOString(),
        });

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/time-clock");
}
