import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

/**
 * Refreshes the Supabase auth session by validating the JWT
 * and returns the authenticated user.
 *
 * Uses getUser() which makes a network call to Supabase Auth —
 * this is slightly slower than getClaims() but guarantees we always
 * see the latest user metadata (e.g., is_onboarded after onboarding).
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient<Database>(
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
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set({ name, value, ...options })
                    )
                },
            },
        }
    )

    // IMPORTANT: Do NOT run code between createServerClient and getUser().
    const {
        data: { user },
    } = await supabase.auth.getUser()

    return { user, supabaseResponse }
}
