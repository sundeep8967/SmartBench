
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { mobile_number, trade, skills, tools, zip_code, travel_radius } = body;

        // 1. Update User Record (Mobile Number)
        // Check if mobile changed?
        if (mobile_number) {
            const { error: userError } = await supabase
                .from('users')
                .update({ mobile_number })
                .eq('id', user.id);

            if (userError) throw userError;
        }

        // 2. Upsert Worker Profile
        const { error: profileError } = await supabase
            .from('worker_profiles')
            .upsert({
                user_id: user.id,
                trade,
                skills, // JSONB array
                tools_equipment: tools,
                home_zip_code: zip_code,
                max_travel_distance_miles: travel_radius,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // 3. Update User State to 'Profile_Complete' if logic allows
        // (Assuming we want to mark them as ready)
        // Check current state first?
        await supabase
            .from('users')
            .update({ user_state: 'Profile_Complete' })
            .eq('id', user.id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
