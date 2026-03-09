import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/withdraw — Trigger a Stripe Express payout to the lender's bank
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Get the user's company and Stripe account
        const { data: member } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .maybeSingle();

        if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

        const { data: company } = await supabase
            .from('companies')
            .select('stripe_account_id, name')
            .eq('id', member.company_id)
            .single();

        if (!company?.stripe_account_id) {
            return NextResponse.json(
                { error: "No Stripe account connected. Please complete Stripe onboarding first." },
                { status: 400 }
            );
        }

        // Get the amount and currency from request body
        const body = await req.json().catch(() => ({}));
        const { amount } = body; // Optional: specific amount in cents; if not provided, withdraws all available

        // Check the connected account's available balance
        const balance = await stripe.balance.retrieve(
            undefined as any,
            { stripeAccount: company.stripe_account_id }
        );

        const availableUSD = balance.available.find(b => b.currency === 'usd');
        const availableAmountCents = availableUSD?.amount || 0;

        if (availableAmountCents <= 0) {
            return NextResponse.json(
                { error: "No available balance to withdraw." },
                { status: 400 }
            );
        }

        const withdrawAmountCents = amount ? Math.min(amount, availableAmountCents) : availableAmountCents;

        // Create an instant payout to the bank account on file
        const payout = await stripe.payouts.create(
            {
                amount: withdrawAmountCents,
                currency: 'usd',
                description: `SmartBench withdrawal for ${company.name}`,
                metadata: {
                    company_id: member.company_id,
                },
            },
            { stripeAccount: company.stripe_account_id }
        );

        return NextResponse.json({
            success: true,
            payout_id: payout.id,
            amount_cents: payout.amount,
            estimated_arrival: payout.arrival_date,
            status: payout.status,
        });

    } catch (err: any) {
        console.error("Withdraw error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET /api/stripe/withdraw — Get available balance for the lender
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: member } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .maybeSingle();

        if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

        const { data: company } = await supabase
            .from('companies')
            .select('stripe_account_id')
            .eq('id', member.company_id)
            .single();

        if (!company?.stripe_account_id) {
            return NextResponse.json({ available_cents: 0, pending_cents: 0, has_stripe: false });
        }

        const balance = await stripe.balance.retrieve(
            undefined as any,
            { stripeAccount: company.stripe_account_id }
        );

        const availUSD = balance.available.find(b => b.currency === 'usd');
        const pendingUSD = balance.pending.find(b => b.currency === 'usd');

        return NextResponse.json({
            available_cents: availUSD?.amount || 0,
            pending_cents: pendingUSD?.amount || 0,
            has_stripe: true,
        });

    } catch (err: any) {
        console.error("Balance fetch error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
