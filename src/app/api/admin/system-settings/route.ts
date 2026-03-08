import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { searchParams } = new URL(request.url);
    const keyMatch = searchParams.get('key');

    let query = supabase.from('system_settings').select('key, value, updated_at, updated_by');
    if (keyMatch) {
        query = query.eq('key', keyMatch);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If a specific key is requested, return just that object or null
    if (keyMatch) {
        if (!data || data.length === 0) {
            return NextResponse.json({ value: null }, { status: 200 });
        }
        return NextResponse.json(data[0], { status: 200 });
    }

    return NextResponse.json({ data }, { status: 200 });
}

export async function PUT(request: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: any) {
                    cookieStore.delete(name);
                },
            },
        }
    );

    try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { key, value } = await request.json();

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_by: userData.user.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' })
            .select()
            .single();

        if (error) {
            console.error("Error saving system setting:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Log the change for audit
        await supabase.from('audit_log').insert({
            user_id: userData.user.id,
            action_type: 'System_Setting_Updated',
            target_entity: 'system_settings',
            target_id: null,
            metadata: { key, new_value: value }
        });

        return NextResponse.json(data);
    } catch (err: any) {
        console.error("System settings PUT error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
