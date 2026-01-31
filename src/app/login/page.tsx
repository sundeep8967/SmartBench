"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setIsLoading(false);
            router.push("/dashboard/projects");
        }, 1000);
    };

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Visual Branding */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-gray-900">
                {/* Realistic Background Image */}
                <div
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

                {/* Content */}
                <div className="relative z-20 text-white max-w-lg px-12">
                    <div className="mb-8 p-3 bg-white/10 backdrop-blur-md rounded-xl w-fit border border-white/20">
                        <Construction size={48} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight drop-shadow-sm">
                        Build your workforce, <br />
                        <span className="text-blue-400">faster than ever.</span>
                    </h1>
                    <p className="text-gray-200 text-lg leading-relaxed mb-8 drop-shadow-sm">
                        SmartBench connects you with top-tier construction talent instantly.
                        Manage projects, track time, and handle payments all in one place.
                    </p>

                    <div className="flex items-center space-x-4 text-sm font-medium text-white">
                        <div className="flex -space-x-3">
                            <img src="/avatars/mike_ross.png" alt="User" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" />
                            <img src="/avatars/rachel_zane.png" alt="User" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" />
                            <img src="/avatars/harvey_specter.png" alt="User" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" />
                        </div>
                        <p className="text-gray-300">Trusted by 2,000+ construction pros</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                            <Construction className="text-white" size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link href="#" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                className="w-full h-12 border-gray-300 hover:bg-gray-50 hover:text-gray-900 text-gray-700 font-semibold text-base shadow-sm transition-all flex items-center justify-center gap-3 relative"
                                onClick={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
