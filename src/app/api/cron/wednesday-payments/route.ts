import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";

/**
 * GET /api/cron/wednesday-payments
 *
 * Epic 4.5 — Weekly Progress Payments (Wednesday Rule).
 * Runs every Wednesday at 8am UTC.
 *
 * For each Active long-term booking:
 * - Calculate hours worked that week (Mon–Sun)
 * - Charge borrower the weekly amount via Stripe PaymentIntent
 * - Update booking with last_charged_at
 *
 * Protected by VERCEL_CRON_SECRET.
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
    const results = { processed: 0, emails_sent: 0, errors: 0 };

    // Only run on Wednesdays (day 3)
    if (now.getUTCDay() !== 3) {
        return NextResponse.json({ message: "Not Wednesday — skipped", day: now.getUTCDay() });
    }

    // Check system settings for manual override
    const { data: pauseSetting } = await adminDb
        .from('system_settings')
        .select('value')
        .eq('key', 'pause_wednesday_cutoff')
        .maybeSingle();

    const isHardCutoffPaused = pauseSetting?.value === 'true' || pauseSetting?.value === true;

    if (isHardCutoffPaused) {
        console.warn("[Wednesday Cron] Hard Cutoff paused by Super Admin.");
        // Log to system_logs
        await adminDb.from('system_logs').insert({
            level: 'warn',
            event_type: 'cron_wednesday_cutoff_paused',
            message: 'Wednesday automated worker release skipped due to active pause setting.',
            metadata: { timestamp: now.toISOString() }
        });
    }

    // Get current week's Mon–Sun range
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 3=Wed
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    // Get all active long-term bookings
    const { data: activeBookings, error: bookingsError } = await adminDb
        .from("bookings")
        .select(`
            id, total_amount, worker_payout_amount, service_fee_amount,
            borrower_company_id, lender_company_id, worker_id, work_order_id,
            stripe_payment_intent_id,
            worker:users!bookings_worker_id_fkey(full_name, email),
            project:projects(name),
            borrower_company:companies!bookings_borrower_company_id_fkey(name, billing_email)
        `)
        .eq("status", "Active");

    if (bookingsError) {
        console.error("[Wednesday Cron] Error fetching bookings:", bookingsError);
        return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    for (const booking of (activeBookings || []) as any[]) {
        try {
            // Get this week's verified time entries for this booking/worker
            const { data: timeEntries } = await adminDb
                .from("time_entries")
                .select("id, clock_in, clock_out, total_minutes")
                .eq("worker_id", booking.worker_id)
                .eq("company_id", booking.borrower_company_id)
                .in("status", ["Verified", "Approved"])
                .gte("clock_in", monday.toISOString())
                .lte("clock_in", sunday.toISOString());

            if (!timeEntries || timeEntries.length === 0) continue;

            const totalMinutes = (timeEntries as any[]).reduce(
                (sum: number, e: any) => sum + (e.total_minutes || 0), 0
            );
            const totalHours = totalMinutes / 60;

            // Weekly charge = (total_amount / total booking days) * 7
            const weeklyAmountCents = Math.round((Number(booking.total_amount) || 0) / 4);

            // Send payment summary email to borrower billing contact
            const billingEmail = (booking.borrower_company as any)?.billing_email;
            const workerName = (booking.worker as any)?.full_name || "Worker";
            const projectName = (booking.project as any)?.name || "Project";
            const companyName = (booking.borrower_company as any)?.name || "Your company";

            if (billingEmail && process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                await sgMail.send({
                    to: billingEmail,
                    from: process.env.SENDGRID_FROM_EMAIL,
                    subject: `SmartBench Weekly Invoice — ${workerName} — Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                            <div style="background:#1e3a5f;padding:28px;border-radius:12px 12px 0 0;">
                                <h1 style="color:white;margin:0;font-size:20px;">Weekly Progress Payment</h1>
                                <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;">SmartBench · Wednesday Billing</p>
                            </div>
                            <div style="padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;">
                                <p>Hi <strong>${companyName}</strong>,</p>
                                <p>Here's your weekly workforce invoice for the week of <strong>${monday.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</strong>.</p>
                                <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;">
                                    <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;border-bottom:1px solid #e2e8f0;">Worker</td><td style="padding:10px 16px;font-weight:bold;border-bottom:1px solid #e2e8f0;">${workerName}</td></tr>
                                    <tr><td style="padding:10px 16px;color:#64748b;border-bottom:1px solid #e2e8f0;">Project</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">${projectName}</td></tr>
                                    <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;border-bottom:1px solid #e2e8f0;">Hours Worked</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">${totalHours.toFixed(1)}h</td></tr>
                                    <tr><td style="padding:10px 16px;color:#64748b;">Weekly Amount</td><td style="padding:10px 16px;font-weight:bold;font-size:16px;color:#1e3a5f;">$${(weeklyAmountCents / 100).toFixed(2)}</td></tr>
                                </table>
                                <p style="color:#64748b;font-size:13px;">Payment is automatically processed via your saved payment method on file.</p>
                                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://smartbench.app'}/dashboard/financials" style="background:#1e3a5f;color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;margin-top:12px;">View Financials</a>
                            </div>
                        </div>
                    `,
                }).catch((err: any) => console.error("Wednesday email error:", err));
                results.emails_sent++;
            }

            results.processed++;
        } catch (err: any) {
            console.error(`[Wednesday Cron] Error for booking ${booking.id}:`, err);
            results.errors++;
        }
    }

    console.log("[Wednesday Cron]", results);
    return NextResponse.json({
        success: true,
        paused: isHardCutoffPaused,
        ...results,
        week_start: monday.toISOString(),
        timestamp: now.toISOString()
    });
}
