import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set({ name, value, ...options })
                    )
                },
            },
        }
    )

    // IMPORTANT: Do NOT run code between createServerClient and getUser()
    // Doing so will cause the server and client to be out of sync
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isLoginPage = request.nextUrl.pathname.startsWith('/login')
    const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
    const isRootPage = request.nextUrl.pathname === '/'

    // Unauthenticated users trying to access protected routes
    if (!user && (isDashboardPage || isOnboardingPage)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Authenticated users
    if (user) {
        const isOnboarded = user.user_metadata?.is_onboarded === true;

        if (!isOnboarded) {
            // Not onboarded: must go to onboarding. Block from dashboard, login, and root.
            if (!isOnboardingPage && !request.nextUrl.pathname.startsWith('/auth')) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding/step-1'
                return NextResponse.redirect(url)
            }
        } else {
            // Onboarded: must go to dashboard if they try to access login, onboarding, or root.
            if (isOnboardingPage || isLoginPage || isRootPage) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
