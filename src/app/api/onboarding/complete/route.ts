import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Also update the native user_metadata so the boolean is baked into the JWT
        const { error: authError } = await supabase.auth.updateUser({
            data: { is_onboarded: true }
        });

        if (authError) {
            console.error('Error updating auth metadata:', authError);
            return NextResponse.json({ error: 'Failed to update auth metadata' }, { status: 500 });
        }

        const { error } = await supabase
            .from('users')
            .update({ is_onboarded: true })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating onboarding status in DB:', error);
            // We don't fail hard because auth metadata succeeded, but we should log it
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error in complete onboarding API:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
