"use client";

import { OnboardingProvider } from "@/lib/contexts/OnboardingContext";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";

function OnboardingLayoutContent({ children }: { children: React.ReactNode }) {
    const { currentStep } = useOnboarding();

    return (
        <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-100/40 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1">
                {/* Header with Progress */}
                <header className="w-full py-8">
                    <div className="container mx-auto px-4">
                        {/* Logo */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                                Smart<span className="text-blue-600">Bench</span>
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Complete your account setup</p>
                        </div>

                        {/* Progress Indicator */}
                        <ProgressIndicator currentStep={currentStep} />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-start justify-center py-8 px-4">
                    {children}
                </main>

                {/* Footer */}
                <footer className="py-4 text-center">
                    <p className="text-gray-400 text-xs">
                        © 2026 SmartBench. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
}

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OnboardingProvider>
            <OnboardingLayoutContent>{children}</OnboardingLayoutContent>
        </OnboardingProvider>
    );
}
