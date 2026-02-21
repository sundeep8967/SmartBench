import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('users')
            .update({ is_onboarded: true })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating onboarding status:', error);
            return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error in complete onboarding API:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
