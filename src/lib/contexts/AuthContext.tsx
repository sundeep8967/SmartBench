"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    hasCompletedOnboarding: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key for localStorage
const ONBOARDING_COMPLETE_KEY = "smartbench_onboarding_complete";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const hasRedirected = useRef(false);

    // Check onboarding status from localStorage
    useEffect(() => {
        const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
        setHasCompletedOnboarding(completed === "true");
    }, []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("AuthContext: Initial session retrieved", session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log(`AuthContext: Auth event ${_event}`, session);
            setUser(session?.user ?? null);

            // Reset on sign out
            if (_event === "SIGNED_OUT") {
                hasRedirected.current = false;
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    // Redirect to onboarding if user is logged in but hasn't completed onboarding
    useEffect(() => {
        if (loading) return;

        // Skip if already on onboarding or login pages
        const isOnboardingPage = pathname?.startsWith("/onboarding");
        const isLoginPage = pathname === "/login";
        const isCallbackPage = pathname?.startsWith("/auth");

        if (isOnboardingPage || isLoginPage || isCallbackPage) return;

        // If user is logged in and hasn't completed onboarding, redirect
        if (user && !hasCompletedOnboarding && !hasRedirected.current) {
            hasRedirected.current = true;
            console.log("AuthContext: User needs to complete onboarding, redirecting...");
            router.push("/onboarding/step-1");
        }
    }, [user, loading, hasCompletedOnboarding, pathname, router]);

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logout = async () => {
        try {
            // Clear onboarding status on logout (for testing purposes)
            // In production, you might want to keep this
            await supabase.auth.signOut();
            router.push("/login");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, hasCompletedOnboarding, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
