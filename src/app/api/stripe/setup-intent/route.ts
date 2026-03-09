import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Get Company
        const { data: member } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .maybeSingle();

        if (!member) return NextResponse.json({ error: "No active company" }, { status: 403 });

        const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', member.company_id)
            .single();

        if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

        let customerId = (company as any).stripe_customer_id;

        // 2. Create Stripe Customer if one doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: (company as any).contact_email || user.email,
                name: company.name,
                metadata: {
                    company_id: member.company_id
                }
            });
            customerId = customer.id;

            // Save back to DB
            await supabase
                .from('companies')
                .update({ stripe_customer_id: customerId } as any)
                .eq('id', member.company_id);
        }

        // 3. Create SetupIntent
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
            usage: 'off_session', // Required for Merchant Initiated Transactions later
        });

        return NextResponse.json({
            clientSecret: setupIntent.client_secret
        });

    } catch (error: any) {
        console.error("SetupIntent creation failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
