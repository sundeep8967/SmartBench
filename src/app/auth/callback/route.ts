import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    // The proxy handles routing (onboarding vs dashboard) based on is_onboarded
    const next = requestUrl.searchParams.get("next") ?? "/dashboard";

    if (code) {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignored — proxy will handle cookie refresh
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            console.error('Auth Callback: Error exchanging code:', error.message);
            return NextResponse.redirect(new URL(`/login?error=auth_callback_error&message=${encodeURIComponent(error.message)}`, requestUrl.origin));
        }

        // Check and accept any pending invites
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                const { acceptInvite } = await import('@/lib/services/invitations');
                await acceptInvite(user.id, user.email);
            }
        } catch (inviteError) {
            console.error('Auth Callback: Error processing invites:', inviteError);
        }
    } else {
        return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
    }

    // Redirect to /dashboard — the proxy will handle routing:
    // - If is_onboarded is false → proxy redirects to /onboarding/step-1
    // - If is_onboarded is true → proxy lets dashboard through
    return NextResponse.redirect(new URL(next, requestUrl.origin));
}

