"use client";

import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { usePathname } from "next/navigation";

// We can pass current step via props if we use a client component wrapper, 
// or simpler: just hardcode the progress value in each page?
// Actually, layout is shared, so it doesn't know the current page easily in server components without headers hack.
// Best approach for MVP: Each page renders its own "WizardShell" or we accept that Layout is static.
// BUT, if I put the Progress bar in the Layout, it needs to know the step.
// Easier way: The layout provides the shell, but the progress value is controlled by the page?
// Or we just use a Client Component in the layout that reads the pathname.

export default function OnboardingLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Determine progress based on path
    let progress = 0;
    let step = 0;

    if (pathname.includes("step-1")) { progress = 25; step = 1; }
    else if (pathname.includes("step-2")) { progress = 50; step = 2; }
    else if (pathname.includes("step-3")) { progress = 75; step = 3; }
    else if (pathname.includes("step-4")) { progress = 100; step = 4; }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header / Logo */}
                <div className="text-center">
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">
                        Setup your Company
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                        Step {step} of 4
                    </p>
                </div>

                {/* Progress Bar */}
                <Progress value={progress} className="w-full h-2" />

                {/* Content Card */}
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
