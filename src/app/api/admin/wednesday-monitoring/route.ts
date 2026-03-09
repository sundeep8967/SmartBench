import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    // Check superadmin permissions
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: roleCheck } = await supabase
            .from("company_members")
            .select("roles")
            .eq("user_id", userData.user.id)
            .contains("roles", "[\"SuperAdmin\"]")
            .maybeSingle();

        if (!roleCheck) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const now = new Date();

        // Get all active long-term bookings
        const { data: activeBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
        id, 
        total_amount, 
        project_id,
        funded_period_end,
        projects:projects(timezone)
      `)
            .eq('status', 'Active')
            .neq('payment_type', 'Full_Upfront');

        if (bookingsError) {
            throw bookingsError;
        }

        // Wednesday Rule: Week starts Mon (00:00) to Sun (23:59)
        // Next week = next Mon-Sun
        const dayOfWeek = now.getUTCDay(); // 0=Sun, 3=Wed
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setUTCHours(0, 0, 0, 0);

        // The Wednesday rule looks at whether the upcoming week is funded
        const targetNextMonday = new Date(monday);
        targetNextMonday.setUTCDate(targetNextMonday.getUTCDate() + 7);

        let totalScheduled = 0;
        let successfulCharges = 0;
        let unpaidBookings = 0;

        // Map of counts by timezone e.g. "America/Chicago" => { active: 10, unpaid: 2 }
        const timezoneBreakdown: Record<string, { active: number; unpaid: number; inWindow: boolean }> = {};

        activeBookings?.forEach(booking => {
            totalScheduled++;

            const projectData = booking.projects as any;
            const tz = (Array.isArray(projectData) ? projectData[0]?.timezone : projectData?.timezone) || 'America/Chicago';
            if (!timezoneBreakdown[tz]) {
                // Evaluate if they are actively IN the Wednesday window (between 10 AM and midnight project time)
                // For simplicity in the monitoring API, we format the current time in that timezone
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    weekday: 'short',
                    hour: 'numeric',
                    hour12: false
                });
                const parts = formatter.formatToParts(now);
                const weekday = parts.find(p => p.type === 'weekday')?.value;
                const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);

                const inWindow = (weekday === 'Wed' && hour >= 10 && hour <= 23);

                timezoneBreakdown[tz] = { active: 0, unpaid: 0, inWindow };
            }

            timezoneBreakdown[tz].active++;

            const fundedEnd = booking.funded_period_end ? new Date(booking.funded_period_end) : new Date(0);

            // If the funded period end is earlier than next Monday, it's unpaid for next week
            if (fundedEnd < targetNextMonday) {
                unpaidBookings++;
                timezoneBreakdown[tz].unpaid++;
            } else {
                successfulCharges++;
            }
        });

        return NextResponse.json({
            metrics: {
                totalScheduled,
                successfulCharges,
                unpaidBookings
            },
            timezones: Object.entries(timezoneBreakdown).map(([tz, stats]) => ({
                timezone: tz,
                ...stats
            }))
        });

    } catch (error: any) {
        console.error("Error fetching Wednesday monitoring stats:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
