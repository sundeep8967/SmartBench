import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/dashboard/marketplace";

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
        console.log("Auth Callback: Session exchanged successfully!");
    } else {
        console.log("Auth Callback: No code found in URL");
        return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
