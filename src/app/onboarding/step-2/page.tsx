"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";

type VerificationStatus = "idle" | "verifying" | "success" | "error";

export default function Step2Page() {
    const router = useRouter();
    const { data, updateStepData, setCurrentStep, isStepComplete } = useOnboarding();

    const [status, setStatus] = useState<VerificationStatus>("idle");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setCurrentStep(2);
        if (data.step2.verified) {
            setStatus("success");
        }
    }, [data.step2.verified, setCurrentStep]);

    useEffect(() => {
        if (!isStepComplete(1)) {
            router.push("/onboarding/step-1");
        }
    }, [isStepComplete, router]);

    const handleStartVerification = () => {
        setStatus("verifying");
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + Math.random() * 15;
            });
        }, 300);

        setTimeout(() => {
            clearInterval(progressInterval);
            setProgress(100);
            setStatus("success");
            updateStepData("step2", {
                verified: true,
                verifiedAt: new Date().toISOString(),
            });
        }, 3000);
    };

    const handleContinue = () => {
        router.push("/onboarding/step-3");
    };

    const handleBack = () => {
        router.push("/onboarding/step-1");
    };

    return (
        <OnboardingCard
            title="Business Verification"
            description="Verify your business identity"
            badge={{
                text: "🧪 DEMO MODE - This is a simulated verification",
                variant: "demo",
            }}
            footer={
                <div className="space-y-3">
                    <Button
                        onClick={handleContinue}
                        disabled={status !== "success"}
                        className={`w-full h-12 font-semibold text-base transition-all ${status === "success"
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Continue
                        <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Button>
                    <button
                        onClick={handleBack}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← Back to Company Info
                    </button>
                </div>
            }
        >
            <div className="py-4">
                <AnimatePresence mode="wait">
                    {status === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Know Your Business (KYB)
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                                    We need to verify your business identity to ensure platform security.
                                    In production, this will redirect to Stripe Identity.
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-amber-700 text-xs">
                                    <strong>Demo Mode:</strong> Click below to simulate a successful verification.
                                    No actual verification will occur.
                                </p>
                            </div>

                            <Button
                                onClick={handleStartVerification}
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25"
                            >
                                <svg className="mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Verification
                            </Button>
                        </motion.div>
                    )}

                    {status === "verifying" && (
                        <motion.div
                            key="verifying"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center space-y-6 py-8"
                        >
                            <div className="w-20 h-20 mx-auto relative">
                                <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                                <div
                                    className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"
                                    style={{ animationDuration: "1s" }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-blue-600">
                                        {Math.min(Math.round(progress), 100)}%
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Verifying Business...
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    Simulating KYB verification process
                                </p>
                            </div>

                            <div className="w-full max-w-xs mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 py-4"
                        >
                            <motion.div
                                className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                                <motion.svg
                                    className="w-10 h-10 text-emerald-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </motion.svg>
                            </motion.div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Verification Complete!
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    Your business has been verified successfully
                                </p>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-emerald-700 text-sm font-medium">Business Verified</span>
                                </div>
                                <p className="text-gray-600 text-xs">
                                    {data.step1?.businessName || "Your Business"} • EIN: {data.step1?.ein || "XX-XXXXXXX"}
                                </p>
                            </div>

                            <p className="text-xs text-gray-400">
                                Demo verification - No actual data was submitted
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </OnboardingCard>
    );
}
