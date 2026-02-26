"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    companyId: string | null;
    loading: boolean;
    hasCompletedOnboarding: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const hasCompletedOnboarding = user?.user_metadata?.is_onboarded === true;
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const fetchCompanyData = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('company_members')
                .select('company_id')
                .eq('user_id', userId)
                .eq('status', 'Active')
                .maybeSingle();

            if (data && !error) {
                setCompanyId(data.company_id);
            } else {
                setCompanyId(null);
            }
        } catch (error) {
            console.error("AuthContext: Error fetching company data", error);
            setCompanyId(null);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("AuthContext: Initial session retrieved", session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchCompanyData(currentUser.id).finally(() => setLoading(false));
            } else {
                setCompanyId(null);
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log(`AuthContext: Auth event ${_event}`, session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                fetchCompanyData(currentUser.id);
            } else {
                setCompanyId(null);
            }

            // Session is handled generically
            if (_event === "SIGNED_OUT") {
                // Keep minimal cleanups if needed
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);



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
        <AuthContext.Provider value={{ user, companyId, loading, hasCompletedOnboarding, signInWithGoogle, logout }}>
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
