import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    // Redirect to dashboard - AuthContext will redirect to onboarding if needed
    const next = requestUrl.searchParams.get("next") ?? "/dashboard";

    if (code) {
        console.log("Auth Callback: Code received, exchanging for session...");
        console.log("Auth Callback: ENV check - URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("Auth Callback: ENV check - KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        console.log("Auth Callback: ENV check - URL value:", process.env.NEXT_PUBLIC_SUPABASE_URL);
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
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            console.error('Auth Callback: Error exchanging code:', error.message, error.status, error);
            console.error('Auth Callback: Available cookies:', cookieStore.getAll().map(c => c.name));
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
            // Don't block login if invite processing fails
        }

        // Context Resolution: Determine where to send the user
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: memberships, error } = await supabase
                    .from('company_members')
                    .select('company_id')
                    .eq('user_id', user.id)
                    .eq('status', 'Active');

                if (!error && memberships) {
                    if (memberships.length === 0) {
                        // Case: No active company -> Onboarding
                        // (Unless they are already heading to onboarding)
                        if (!next.startsWith('/onboarding')) {
                            return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
                        }
                    } else if (memberships.length > 1) {
                        // Case: Multiple active companies -> Select Company
                        return NextResponse.redirect(new URL('/select-company', requestUrl.origin));
                    }
                    // Case: 1 active company -> Proceed to 'next' (default /dashboard)
                    // We rely on the app to pick up the single company context
                }
            }
        } catch (contextError) {
            console.error('Auth Callback: Error resolving context:', contextError);
        }

        console.log("Auth Callback: Session exchanged successfully!");
    } else {
        console.log("Auth Callback: No code found in URL");
        return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
