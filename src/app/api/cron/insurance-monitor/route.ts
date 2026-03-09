import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase admin client to bypass RLS for cron jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
    // 1. Verify cron secret (only Vercel cron should trigger this)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log("[Insurance Cron] Starting Daily Insurance Monitor");

        // --- HARD STOP (EXPIRING TODAY OR ALREADY EXPIRED) ---
        // Find active policies that expire today or earlier
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: expiredPolicies, error: expiredError } = await supabaseAdmin
            .from('insurance_policies')
            .select('id, company_id, insurance_type, expiration_date')
            .eq('is_active', true)
            .lte('expiration_date', today.toISOString());

        if (expiredError) throw expiredError;

        if (expiredPolicies && expiredPolicies.length > 0) {
            console.log(`[Insurance Cron] Found ${expiredPolicies.length} expired policies.`);
            const expiredPolicyIds = expiredPolicies.map(p => p.id);
            const expiredCompanyIds = [...new Set(expiredPolicies.map(p => p.company_id))];

            // 1. Deactivate the expired policies
            await supabaseAdmin
                .from('insurance_policies')
                .update({ is_active: false })
                .in('id', expiredPolicyIds);

            // 2. Find any active bookings for these companies (where they are the lender)
            const { data: affectedBookings, error: bookingError } = await supabaseAdmin
                .from('bookings')
                .select('id, project_id, borrower_company_id, lender_company_id, worker_id, status')
                .in('lender_company_id', expiredCompanyIds)
                .in('status', ['Confirmed', 'Active', 'Payment_Paused_Dispute']);

            if (bookingError) throw bookingError;

            if (affectedBookings && affectedBookings.length > 0) {
                const bookingIds = affectedBookings.map(b => b.id);

                // 3. Update status = Suspended_Insurance
                await supabaseAdmin
                    .from('bookings')
                    .update({ status: 'Suspended_Insurance' })
                    .in('id', bookingIds);

                // 4. Create Critical Notifications via DB Trigger (or insert directly here)
                for (const booking of affectedBookings) {
                    await supabaseAdmin.from('notifications').insert([
                        {
                            user_id: booking.worker_id,
                            type: 'ACTION_REQUIRED',
                            title: 'CRITICAL: Insurance Expired',
                            message: 'Insurance Invalid. Work must stop immediately. Please clock out.',
                            reference_id: booking.id,
                            reference_type: 'Booking',
                            is_read: false
                        }
                    ]);
                }
                console.log(`[Insurance Cron] Suspended ${bookingIds.length} bookings due to hard stop.`);
            }
        }

        // --- WARNINGS (14 DAYS and 7 DAYS) ---
        // Find policies expiring in exactly 14 days
        const target14Days = new Date(today);
        target14Days.setDate(target14Days.getDate() + 14);
        const { data: warning14Policies } = await supabaseAdmin
            .from('insurance_policies')
            .select('id, company_id, insurance_type, expiration_date')
            .eq('is_active', true)
            .eq('expiration_date', target14Days.toISOString().split('T')[0]);

        // Find policies expiring in exactly 7 days
        const target7Days = new Date(today);
        target7Days.setDate(target7Days.getDate() + 7);
        const { data: warning7Policies } = await supabaseAdmin
            .from('insurance_policies')
            .select('id, company_id, insurance_type, expiration_date')
            .eq('is_active', true)
            .eq('expiration_date', target7Days.toISOString().split('T')[0]);

        // Process 14 Day Warnings
        if (warning14Policies && warning14Policies.length > 0) {
            console.log(`[Insurance Cron] Found ${warning14Policies.length} policies expiring in 14 days.`);
            // In a real app, send actual emails via SendGrid/Resend here
            // For MVP: Insert in-app notifications to Admins of the affected companies
        }

        // Process 7 Day Warnings
        if (warning7Policies && warning7Policies.length > 0) {
            console.log(`[Insurance Cron] Found ${warning7Policies.length} policies expiring in 7 days.`);
            // For MVP: Insert in-app notifications
        }

        await supabaseAdmin.from('system_logs').insert({
            level: 'info',
            service: 'cron_insurance',
            message: `Insurance monitor completed. Suspended ${expiredPolicies ? expiredPolicies.length : 0} policies.`
        });
        return NextResponse.json({ success: true, message: "Insurance monitor completed." });

    } catch (error: any) {
        console.error("[Insurance Cron] Error:", error);
        await supabaseAdmin.from('system_logs').insert({
            level: 'error',
            service: 'cron_insurance',
            message: `Insurance monitor failed: ${error.message}`,
            metadata: { error: error.stack }
        });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
