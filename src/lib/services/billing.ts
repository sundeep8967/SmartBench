import Dinero from 'dinero.js';

export const SERVICE_FEE_PERCENTAGE = 0.30; // 30%

interface FeeCalculationResult {
    serviceFee: number; // in cents
    workerPayout: number; // in cents
    totalAmount: number; // in cents
}

/**
 * Calculates the service fee and worker payout based on the total booking amount.
 * Using Dinero.js to avoid floating point errors.
 * 
 * @param totalAmountCents The total amount charged to the borrower (in cents)
 * @param currency The currency code (default 'USD')
 */
export function calculateServiceFee(totalAmountCents: number, currency = 'USD'): FeeCalculationResult {
    // Cast currency to any to avoid strict enum checks from @types/dinero.js
    const total = Dinero({ amount: totalAmountCents, currency: currency as any });

    // Calculate Service Fee (30% of Total)
    // rounded using default half-even rounding (Banker's rounding)
    const serviceFee = total.percentage(SERVICE_FEE_PERCENTAGE * 100);

    // Worker Payout = Total - Service Fee
    const workerPayout = total.subtract(serviceFee);

    return {
        serviceFee: serviceFee.getAmount(),
        workerPayout: workerPayout.getAmount(),
        totalAmount: totalAmountCents // return ensures we have the original inputs confirmed
    };
}
