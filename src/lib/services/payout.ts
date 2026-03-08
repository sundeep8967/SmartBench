import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { calculateServiceFee } from './billing';
import { generateAndSendLienWaiver } from './lien-waiver';

/**
 * Triggered when a timesheet is approved (manually or via auto-approval).
 * Calculates the worker payout and sends a Stripe Transfer to the lender's
 * Stripe Connected Account.
 */
export async function releasePayoutForTimeEntry(timeEntryId: string): Promise<{
    success: boolean;
    transferId?: string;
    payoutAmountCents?: number;
    error?: string;
}> {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 1. Fetch the time entry with booking and company info
        const { data: entry, error: entryError } = await supabaseAdmin
            .from('time_entries')
            .select(`
        *,
        booking:bookings(
          id,
          worker_payout_amount,
          total_amount,
          service_fee_amount,
          stripe_payment_intent_id,
          lender_company_id
        )
      `)
            .eq('id', timeEntryId)
            .single();

        if (entryError || !entry) {
            return { success: false, error: `Time entry not found: ${entryError?.message}` };
        }

        // 2. Skip if already paid out
        if (entry.payout_released) {
            return { success: true, transferId: entry.stripe_transfer_id, payoutAmountCents: entry.payout_amount };
        }

        // 3. Calculate payout for THIS specific shift (hours worked × rate)
        if (!entry.clock_out) {
            return { success: false, error: 'Time entry has no clock_out — cannot calculate payout' };
        }

        const clockInMs = new Date(entry.clock_in).getTime();
        const clockOutMs = new Date(entry.clock_out).getTime();
        const totalMinutes = Math.max(0, Math.round((clockOutMs - clockInMs) / 60000) - (entry.total_break_minutes || 0));
        const hoursWorked = totalMinutes / 60;

        // Get the booking's worker_payout_amount as a rate per booking
        // If we have per-booking total, use it; otherwise calculate from hours
        const booking = (entry.booking as any);
        if (!booking) {
            return { success: false, error: 'No booking linked to this time entry' };
        }

        // Calculate per-shift payout from total booking payout proportionally
        // For now: use the service fee calculation on the actual hours
        // We need the hourly rate — fetch from worker_profiles
        const { data: workerProfile } = await supabaseAdmin
            .from('worker_profiles')
            .select('hourly_rate')
            .eq('user_id', entry.user_id)
            .maybeSingle();

        const hourlyRate = workerProfile?.hourly_rate || 0;
        if (!hourlyRate) {
            return { success: false, error: 'Worker hourly rate not found — cannot calculate payout' };
        }

        // Labor cost in cents for this shift
        const laborCostCents = Math.round(hoursWorked * hourlyRate * 100);
        // Payout to lender = labor cost (the 30% service fee goes to platform, not deducted from lender)
        // Platform charged borrower: labor + 30% service fee
        // Lender receives: labor cost only
        const payoutCents = laborCostCents;

        if (payoutCents <= 0) {
            return { success: false, error: 'Calculated payout is zero — skipping transfer' };
        }

        // 4. Get the lender company's Stripe Connected Account
        const { data: lenderCompany, error: companyError } = await supabaseAdmin
            .from('companies')
            .select('stripe_account_id, name')
            .eq('id', booking.lender_company_id)
            .single();

        if (companyError || !lenderCompany?.stripe_account_id) {
            return { success: false, error: `Lender has no Stripe Connected Account: ${companyError?.message}` };
        }

        const stripeAccountId = lenderCompany.stripe_account_id;

        // 5. Create Stripe Transfer to lender's connected account
        let transferId: string;
        try {
            const transfer = await stripe.transfers.create({
                amount: payoutCents,
                currency: 'usd',
                destination: stripeAccountId,
                description: `Payout for time entry ${timeEntryId}`,
                metadata: {
                    time_entry_id: timeEntryId,
                    booking_id: booking.id,
                    hours_worked: hoursWorked.toFixed(2),
                },
            });
            transferId = transfer.id;
        } catch (stripeErr: any) {
            console.error('Stripe transfer failed:', stripeErr);
            return { success: false, error: `Stripe transfer failed: ${stripeErr.message}` };
        }

        // 6. Mark the time entry as paid out
        await supabaseAdmin
            .from('time_entries')
            .update({
                payout_released: true,
                payout_amount: payoutCents,
                stripe_transfer_id: transferId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', timeEntryId);

        console.log(`✅ Payout released: $${(payoutCents / 100).toFixed(2)} to ${lenderCompany.name} (${stripeAccountId}) — Transfer: ${transferId}`);

        // 7. Generate and send Partial Lien Waiver (story 6.8) asynchronously
        const { data: borrowerInfo } = await supabaseAdmin
            .from('companies')
            .select('name')
            .eq('id', booking.borrower_company_id)
            .single();

        const { data: workerUser } = await supabaseAdmin
            .from('users')
            .select('full_name')
            .eq('id', entry.user_id)
            .single();

        // Fire-and-forget: do not await to avoid delaying the response
        generateAndSendLienWaiver({
            timeEntryId,
            bookingId: booking.id,
            transferId,
            payoutAmountCents: payoutCents,
            lenderCompanyName: lenderCompany.name,
            borrowerCompanyId: booking.borrower_company_id,
            borrowerCompanyName: borrowerInfo?.name || 'Borrower Company',
            workerName: workerUser?.full_name || 'Worker',
            shiftDate: entry.clock_in,
            clockIn: entry.clock_in,
            clockOut: entry.clock_out!,
            hoursWorked,
        });

        return { success: true, transferId, payoutAmountCents: payoutCents };

    } catch (err: any) {
        console.error('releasePayoutForTimeEntry error:', err);
        return { success: false, error: err.message };
    }
}
