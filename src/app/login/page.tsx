"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function LoginPage() {
    const { signInWithGoogle, loading, user } = useAuth();
    const router = useRouter();

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (user && !loading) {
            router.push("/dashboard/marketplace");
        }
    }, [user, loading, router]);

    // Use the loading state from context or local state as fallback for the button interaction
    const handleLogin = async () => {
        await signInWithGoogle();
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 10
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-900">
            {/* Full Screen Background Image */}
            <div
                className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
            />

            {/* Gradient Overlay for Text Readability - Darker for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-blue-900/40" />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                {/* Left Side - Visual Branding (Floating Text) */}
                <motion.div
                    className="hidden lg:block text-white"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >


                    <div className="overflow-hidden">
                        <motion.h1 variants={itemVariants} className="text-5xl lg:text-6xl font-bold tracking-tight mb-2 leading-tight drop-shadow-lg">
                            Build your workforce,
                        </motion.h1>
                    </div>

                    <div className="overflow-hidden mb-6">
                        <motion.h1 variants={itemVariants} className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight drop-shadow-lg text-blue-400">
                            faster than ever.
                        </motion.h1>
                    </div>

                    <motion.p variants={itemVariants} className="text-gray-200 text-lg lg:text-xl leading-relaxed mb-10 drop-shadow-md max-w-lg">
                        SmartBench connects you with top-tier construction talent instantly.
                        Manage projects, track time, and handle payments all in one place.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex items-center space-x-5 text-sm font-medium text-white">
                        <div className="flex -space-x-4">
                            <img src="/avatars/mike_ross.png" alt="User" className="w-12 h-12 rounded-full border-2 border-gray-900 object-cover shadow-lg" />
                            <img src="/avatars/rachel_zane.png" alt="User" className="w-12 h-12 rounded-full border-2 border-gray-900 object-cover shadow-lg" />
                            <img src="/avatars/harvey_specter.png" alt="User" className="w-12 h-12 rounded-full border-2 border-gray-900 object-cover shadow-lg" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-base">2,000+</span>
                            </div>
                            <span className="text-gray-300">Construction pros trust us</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Side - Login Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl p-8 rounded-2xl ring-1 ring-white/5">
                        <div className="mb-8 text-center">

                            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                            <p className="mt-2 text-sm text-gray-300">
                                Sign in to access your dashboard
                            </p>
                        </div>

                        <div className="space-y-6">
                            <Button
                                variant="ghost"
                                className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-base shadow-lg transition-all flex items-center justify-center gap-3 relative border-0"
                                onClick={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-gray-600 border-t-blue-600 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Sign in with Google
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-xs text-gray-400 mt-6">
                                By signing in, you agree to our <Link href="#" className="underline hover:text-gray-300 text-gray-400">Terms</Link> and <Link href="#" className="underline hover:text-gray-300 text-gray-400">Privacy Policy</Link>.
                            </p>

                            {/* DEV LOGIN FORM */}
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <p className="text-xs text-center text-gray-500 mb-4 font-mono">DEVELOPER ONLY MODE</p>
                                <DevLoginForm />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center lg:hidden">
                        <p className="text-gray-300 text-sm">
                            Trusted by 2,000+ construction pros
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function DevLoginForm() {
    const [localLoading, setLocalLoading] = useState(false);
    const [email, setEmail] = useState("verifier@test.com");
    const [password, setPassword] = useState("password123");
    const router = useRouter();
    const supabase = createClient();

    const handleDevLogin = async () => {
        setLocalLoading(true);
        // Try sign in
        let { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error && error.message.includes("Invalid login credentials")) {
            // Try sign up if login fails (lazy dev trick)
            const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) {
                alert("Dev Login Failed: " + signUpError.message);
                setLocalLoading(false);
                return;
            }
            // Auto login after signup? usually requires confirmation if confirm enabled.
            // If confirm disabled, we are good.
            // Retry login just in case
            // If data.user is returned, we are signed in (if auto-confirm is on)
            if (data.user) {
                router.push("/dashboard/projects");
                return;
            }
        }

        if (error) {
            alert("Login Failed: " + error.message);
        } else {
            router.push("/dashboard/projects");
        }
        setLocalLoading(false);
    };

    return (
        <div className="space-y-3">
            <Input
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
            />
            <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
            />
            <Button
                variant="secondary"
                onClick={handleDevLogin}
                disabled={localLoading}
                className="w-full"
            >
                {localLoading ? "Processing..." : "Dev: Login / Recruit"}
            </Button>
        </div>
    );
}
