import { createClient } from '@/lib/supabase/server';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'none';

export interface CompanySubscription {
    companyId: string;
    status: SubscriptionStatus;
    plan: 'monthly' | 'annual' | null;
    periodEnd: string | null;
    trialEndsAt: string | null;
    isActive: boolean; // true if trial or active
    daysUntilExpiry: number | null;
}

/**
 * Gets the subscription status for the current authenticated user's company.
 * Returns null if no company membership is found.
 */
export async function getCompanySubscription(): Promise<CompanySubscription | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await (supabase
        .from('company_members')
        .select(`
            company_id,
            companies (
                id,
                subscription_status,
                subscription_plan,
                subscription_current_period_end,
                trial_ends_at
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single() as any);

    if (!member) return null;

    const company = Array.isArray(member.companies) ? member.companies[0] : member.companies as any;
    if (!company) return null;

    const status = (company.subscription_status || 'trial') as SubscriptionStatus;
    const now = new Date();

    // Check if trial is still valid
    const trialActive = status === 'trial' && company.trial_ends_at
        ? new Date(company.trial_ends_at) > now
        : false;

    const isActive = status === 'active' || trialActive;

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    const expiryTimestamp = status === 'trial' ? company.trial_ends_at : company.subscription_current_period_end;
    if (expiryTimestamp) {
        const expiry = new Date(expiryTimestamp);
        daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
        companyId: member.company_id,
        status,
        plan: company.subscription_plan || null,
        periodEnd: company.subscription_current_period_end || null,
        trialEndsAt: company.trial_ends_at || null,
        isActive,
        daysUntilExpiry,
    };
}

/**
 * Validates if a company can create new bookings.
 * Throws an error if the subscription blocks booking.
 */
export async function assertCanBook(companyId: string): Promise<void> {
    const supabase = await createClient();

    const { data: company } = await (supabase
        .from('companies')
        .select('subscription_status, subscription_current_period_end, trial_ends_at')
        .eq('id', companyId)
        .single() as any);

    if (!company) throw new Error('Company not found');

    const status = company.subscription_status as SubscriptionStatus;
    const now = new Date();

    // Trial still valid
    if (status === 'trial' && company.trial_ends_at) {
        if (new Date(company.trial_ends_at) > now) return; // OK
        throw new Error('Your free trial has expired. Please subscribe to continue booking workers.');
    }

    // Active paid subscription
    if (status === 'active') return;

    // Expired or canceled
    const errorMessages: Record<string, string> = {
        past_due: 'Your subscription payment failed. Please update your payment method to continue booking workers.',
        canceled: 'Your subscription has been canceled. Please resubscribe to continue booking workers.',
        none: 'An active subscription ($30/month or $300/year) is required to book workers.',
        trial: 'Your free trial has expired. Please subscribe to continue booking workers.',
    };

    throw new Error(errorMessages[status] || 'Active subscription required to book workers.');
}
