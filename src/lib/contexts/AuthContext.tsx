"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    companyId: string | null;
    isSuperAdmin: boolean;
    loading: boolean;
    hasCompletedOnboarding: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const hasCompletedOnboarding = user?.user_metadata?.is_onboarded === true;
    const router = useRouter();
    const pathname = usePathname();

    // Memoize the client so it doesn't change on every render
    const [supabase] = useState(() => createClient());

    const fetchCompanyData = async (userId: string, userEmail?: string) => {
        try {
            const { data, error } = await supabase
                .from('company_members')
                .select('company_id, roles')
                .eq('user_id', userId)
                .eq('status', 'Active')
                .maybeSingle();

            if (data && !error) {
                setCompanyId(data.company_id);
                const roles: string[] = (data as any).roles || [];
                const hasAdminRole = roles.some(r => ["SuperAdmin", "super_admin"].includes(r));
                const isDevAdmin = userEmail?.endsWith("@smartbench.com") || false;
                setIsSuperAdmin(hasAdminRole || isDevAdmin);
            } else {
                setCompanyId(null);
                const isDevAdmin = userEmail?.endsWith("@smartbench.com") || false;
                setIsSuperAdmin(isDevAdmin);
            }
        } catch (error) {
            console.error("AuthContext: Error fetching company data", error);
            setCompanyId(null);
            setIsSuperAdmin(false);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("AuthContext: Initial session retrieved", session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchCompanyData(currentUser.id, currentUser.email).finally(() => setLoading(false));
            } else {
                setCompanyId(null);
                setIsSuperAdmin(false);
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
                fetchCompanyData(currentUser.id, currentUser.email);
            } else {
                setCompanyId(null);
                setIsSuperAdmin(false);
            }

            // Session is handled generically
            if (_event === "SIGNED_OUT") {
                // Keep minimal cleanups if needed
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []); // Empty dependency array forces this to only run once on mount!


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
        <AuthContext.Provider value={{ user, companyId, isSuperAdmin, loading, hasCompletedOnboarding, signInWithGoogle, logout }}>
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
