import { NextRequest, NextResponse } from 'next/server';
import { constructEvent, stripe } from '@/lib/stripe-webhook';
import { createClient } from '@/lib/supabase/server';
import { sendVerificationSuccessEmail, sendVerificationFailedEmail } from '@/lib/services/mail';

async function logSystemEvent(supabase: any, level: 'info' | 'warning' | 'error' | 'critical', service: string, message: string, metadata?: any) {
    try {
        await supabase.from('system_logs').insert({ level, service, message, metadata: metadata || null });
    } catch (e) {
        console.error('Failed to write system log:', e);
    }
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        console.error('Webhook Error: Missing signature or secret');
        return NextResponse.json({ error: 'Webhook Error: Missing signature or secret' }, { status: 400 });
    }

    let event;

    try {
        event = await constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        const supabase = await createClient();
        await logSystemEvent(supabase, 'critical', 'stripe_webhook', `Signature verification failed: ${err.message}`, { error: err.message, body_preview: body.substring(0, 100) });
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = await createClient();

    // Handle the event
    if (event.type === 'identity.verification_session.verified') {
        const session = event.data.object;
        console.log(`Verification completed for session: ${session.id}`);
        await logSystemEvent(supabase, 'info', 'stripe_webhook', `identity.verification_session.verified for ${session.id}`);

        // 1. Get User/Company via metadata or by querying the session
        // Best practice: Store user_id or company_id in metadata when creating the session
        // For now, let's assume we can find the company by stripe_verification_session_id if we stored it
        // OR we can retrieve the session from Stripe to get metadata if not present in the event

        const userId = session.metadata?.user_id;

        if (userId) {
            // Update Company KYB Status
            const { error: updateError } = await supabase
                .from('companies')
                .update({ kyb_status: 'verified' })
                .eq('owner_id', userId); // Assuming owner initiated it

            if (updateError) {
                console.error('Failed to update company status:', updateError);
                await logSystemEvent(supabase, 'error', 'stripe_webhook', 'Failed to update company KYB status', { error: updateError, session_id: session.id });
            } else {
                // Send Email
                const { data: user } = await supabase.from('users').select('email, full_name').eq('id', userId).single();
                if (user?.email) {
                    await sendVerificationSuccessEmail(user.email, user.full_name || 'User');
                }
            }
        }
    } else if (event.type === 'identity.verification_session.requires_input') {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        console.log(`Verification requires input for session: ${session.id}`);
        await logSystemEvent(supabase, 'warning', 'stripe_webhook', `identity.verification_session.requires_input for ${session.id}`);

        if (userId) {
            const { data: user } = await supabase.from('users').select('email, full_name').eq('id', userId).single();
            if (user?.email) {
                await sendVerificationFailedEmail(user.email, user.full_name || 'User', "The documents provided were not sufficient. Please retry with clearer photos.");
            }
        }
    }

    return NextResponse.json({ received: true });
}
