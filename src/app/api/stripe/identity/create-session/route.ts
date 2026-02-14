import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create Identity Verification Session
        const verificationSession = await stripe.identity.verificationSessions.create({
            type: 'document',
            metadata: {
                user_id: user.id,
            },
            options: {
                document: {
                    allowed_types: ['driving_license', 'passport', 'id_card'],
                    require_live_capture: true,
                },
            },
        });

        return NextResponse.json({
            clientSecret: verificationSession.client_secret,
        });

    } catch (error: any) {
        console.error("Stripe Identity Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
