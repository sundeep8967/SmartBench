import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendShiftReminderEmail, sendVerifyTimesheetEmail } from "@/lib/services/mail";
import { sendShiftReminderSMS, sendVerifyTimesheetSMS } from "@/lib/services/sms";

/**
 * GET /api/cron/notifications
 *
 * Epic 5.7 — Full notification ladder, runs every 30 minutes.
 * Pre-shift:
 *   T-16h → shift reminder email/SMS to worker (day before)
 *   T-1h  → urgent shift reminder email/SMS to worker (morning of)
 *
 * Post-shift (timesheets):
 *   T+1h  → "please verify" email/SMS to supervisor
 *   T+3h  → "URGENT: auto-approves in 1h" email/SMS to supervisor
 *
 * Protected by VERCEL_CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const results = { preShift16h: 0, preShift1h: 0, postShift1h: 0, postShift3h: 0 };

    // ─── PRE-SHIFT: T-16h reminders ─────────────────────────────────────────
    // Fetch bookings whose start_date is ~15-17 hours from now
    const t16hStart = new Date(now.getTime() + 15 * 60 * 60 * 1000);
    const t16hEnd = new Date(now.getTime() + 17 * 60 * 60 * 1000);

    const { data: upcoming16h } = await adminDb
        .from("bookings")
        .select(`
            id, start_date,
            worker:users!bookings_worker_id_fkey(id, full_name, email, phone_number),
            project:projects(name, address)
        `)
        .eq("status", "Confirmed")
        .gte("start_date", t16hStart.toISOString().split("T")[0])
        .lte("start_date", t16hEnd.toISOString().split("T")[0])
        .not("worker", "is", null);

    for (const booking of (upcoming16h || []) as any[]) {
        if (!booking.worker?.email && !booking.worker?.phone_number) continue;

        const workerName = booking.worker.full_name || "Worker";
        const projectName = booking.project?.name || "Your project";
        const address = booking.project?.address;
        const startDateString = new Date(booking.start_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

        if (booking.worker.email) {
            await sendShiftReminderEmail({
                workerEmail: booking.worker.email,
                workerName,
                projectName,
                startDate: startDateString,
                address,
                hoursUntilShift: 16,
            });
        }

        if (booking.worker.phone_number) {
            await sendShiftReminderSMS({
                workerPhone: booking.worker.phone_number,
                workerName,
                projectName,
                startDate: startDateString,
                hoursUntilShift: 16,
            });
        }
        results.preShift16h++;
    }

    // ─── PRE-SHIFT: T-1h reminders ──────────────────────────────────────────
    const t1hStart = new Date(now.getTime() + 45 * 60 * 1000);   // 45min from now
    const t1hEnd = new Date(now.getTime() + 75 * 60 * 1000);     // 75min from now

    const { data: upcoming1h } = await adminDb
        .from("bookings")
        .select(`
            id, start_date,
            worker:users!bookings_worker_id_fkey(id, full_name, email, phone_number),
            project:projects(name, address)
        `)
        .eq("status", "Confirmed")
        .gte("start_date", t1hStart.toISOString())
        .lte("start_date", t1hEnd.toISOString())
        .not("worker", "is", null);

    for (const booking of (upcoming1h || []) as any[]) {
        if (!booking.worker?.email && !booking.worker?.phone_number) continue;

        const workerName = booking.worker.full_name || "Worker";
        const projectName = booking.project?.name || "Your project";
        const address = booking.project?.address;
        const startDateString = new Date(booking.start_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

        if (booking.worker.email) {
            await sendShiftReminderEmail({
                workerEmail: booking.worker.email,
                workerName,
                projectName,
                startDate: startDateString,
                address,
                hoursUntilShift: 1,
            });
        }

        if (booking.worker.phone_number) {
            await sendShiftReminderSMS({
                workerPhone: booking.worker.phone_number,
                workerName,
                projectName,
                startDate: startDateString,
                hoursUntilShift: 1,
            });
        }
        results.preShift1h++;
    }

    // ─── POST-SHIFT T+1h: "Please verify" to supervisor ─────────────────────
    const t1hAgo = new Date(now.getTime() - 45 * 60 * 1000);
    const t1hAgoStart = new Date(now.getTime() - 75 * 60 * 1000);

    const { data: pendingT1h } = await adminDb
        .from("time_entries")
        .select(`
            id, clock_in, clock_out, company_id,
            worker:users!time_entries_worker_id_fkey(full_name),
            project:projects(name)
        `)
        .eq("status", "Pending_Verification")
        .gte("clock_out", t1hAgoStart.toISOString())
        .lte("clock_out", t1hAgo.toISOString())
        .not("clock_out", "is", null);

    for (const entry of (pendingT1h || []) as any[]) {
        // Get a supervisor/admin email/phone for this company
        const { data: supervisor } = await adminDb
            .from("company_members")
            .select("user_id, users(full_name, email, phone_number)")
            .eq("company_id", entry.company_id)
            .eq("status", "Active")
            .contains("roles", ["Supervisor"])
            .limit(1)
            .maybeSingle();

        const sup = supervisor as any;
        if (!sup?.users?.email && !sup?.users?.phone_number) continue;

        const supervisorName = sup.users.full_name || "Supervisor";
        const workerName = entry.worker?.full_name || "Worker";
        const projectName = entry.project?.name || "Project";

        if (sup.users.email) {
            await sendVerifyTimesheetEmail({
                supervisorEmail: sup.users.email,
                supervisorName,
                workerName,
                projectName,
                clockIn: new Date(entry.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                clockOut: new Date(entry.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                hoursAfterShift: 1,
            });
        }

        if (sup.users.phone_number) {
            await sendVerifyTimesheetSMS({
                supervisorPhone: sup.users.phone_number,
                supervisorName,
                workerName,
                projectName,
                hoursAfterShift: 1,
            });
        }
        results.postShift1h++;
    }

    // ─── POST-SHIFT T+3h: "URGENT: auto-approves in 1h" ────────────────────
    const t3hAgo = new Date(now.getTime() - 2.75 * 60 * 60 * 1000);
    const t3hAgoStart = new Date(now.getTime() - 3.25 * 60 * 60 * 1000);

    const { data: pendingT3h } = await adminDb
        .from("time_entries")
        .select(`
            id, clock_in, clock_out, company_id,
            worker:users!time_entries_worker_id_fkey(full_name),
            project:projects(name)
        `)
        .eq("status", "Pending_Verification")
        .gte("clock_out", t3hAgoStart.toISOString())
        .lte("clock_out", t3hAgo.toISOString())
        .not("clock_out", "is", null);

    for (const entry of (pendingT3h || []) as any[]) {
        const { data: supervisor } = await adminDb
            .from("company_members")
            .select("user_id, users(full_name, email, phone_number)")
            .eq("company_id", entry.company_id)
            .eq("status", "Active")
            .contains("roles", ["Supervisor"])
            .limit(1)
            .maybeSingle();

        const sup = supervisor as any;
        if (!sup?.users?.email && !sup?.users?.phone_number) continue;

        const supervisorName = sup.users.full_name || "Supervisor";
        const workerName = entry.worker?.full_name || "Worker";
        const projectName = entry.project?.name || "Project";

        if (sup.users.email) {
            await sendVerifyTimesheetEmail({
                supervisorEmail: sup.users.email,
                supervisorName,
                workerName,
                projectName,
                clockIn: new Date(entry.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                clockOut: new Date(entry.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                hoursAfterShift: 3,
            });
        }

        if (sup.users.phone_number) {
            await sendVerifyTimesheetSMS({
                supervisorPhone: sup.users.phone_number,
                supervisorName,
                workerName,
                projectName,
                hoursAfterShift: 3,
            });
        }
        results.postShift3h++;
    }

    await adminDb.from('system_logs').insert({
        level: 'info',
        service: 'cron_notifications',
        message: `Notifications cron completed. Pre-16h: ${results.preShift16h}, Pre-1h: ${results.preShift1h}, Post-1h: ${results.postShift1h}, Post-3h: ${results.postShift3h}.`
    });

    console.log("[Notifications Cron]", results);
    return NextResponse.json({ success: true, ...results, timestamp: now.toISOString() });
}
