import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/session'

/**
 * Proxy (Next.js middleware equivalent).
 *
 * Responsibility: Session refresh + route guards.
 * Session refresh is delegated to lib/supabase/middleware.ts
 * so it can be independently upgraded (e.g. to getClaims()).
 */
export async function proxy(request: NextRequest) {
    // 1. Refresh session & get authenticated user
    const { user, supabaseResponse } = await updateSession(request)

    // 2. Route classification
    const { pathname } = request.nextUrl
    const isLoginPage = pathname.startsWith('/login')
    const isOnboardingPage = pathname.startsWith('/onboarding')
    const isDashboardPage = pathname.startsWith('/dashboard')
    const isAuthRoute = pathname.startsWith('/auth')
    const isApiRoute = pathname.startsWith('/api')
    const isRootPage = pathname === '/'

    // 3. Route guards

    // Unauthenticated → protected routes → redirect to login
    if (!user && (isDashboardPage || isOnboardingPage)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Authenticated route guards
    if (user) {
        const isOnboarded = user.user_metadata?.is_onboarded === true

        if (!isOnboarded) {
            // Not onboarded → force to onboarding (except auth/api routes)
            if (!isOnboardingPage && !isAuthRoute && !isApiRoute) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding/step-1'
                return NextResponse.redirect(url)
            }
        } else {
            // Onboarded → redirect away from login/onboarding/root to dashboard
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
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Static assets (svg, png, jpg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
