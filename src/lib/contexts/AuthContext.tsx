"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();
    const hasShownWelcome = useRef(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("AuthContext: Initial session retrieved", session);
            console.log("AuthContext: Visible Cookies:", document.cookie);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log(`AuthContext: Auth event ${_event}`, session);
            setUser(session?.user ?? null);

            // Show welcome toast when user signs in
            if (_event === "SIGNED_IN" && session?.user && !hasShownWelcome.current) {
                const fullName = session.user.user_metadata?.full_name || session.user.email || "User";
                hasShownWelcome.current = true;
                // Use setTimeout to ensure toast shows after render
                setTimeout(() => {
                    showToast(`Welcome back, ${fullName}! 👋`, "success", true);
                }, 100);
            }

            // Reset welcome flag on sign out
            if (_event === "SIGNED_OUT") {
                hasShownWelcome.current = false;
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, showToast]);

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
            await supabase.auth.signOut();
            router.push("/login");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
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
