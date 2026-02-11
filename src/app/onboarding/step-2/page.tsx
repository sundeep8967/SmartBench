"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";

type VerificationStatus = "idle" | "verifying" | "success" | "error" | "incomplete";

export default function Step2Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data, updateStepData, setCurrentStep, isStepComplete } = useOnboarding();

    const [status, setStatus] = useState<VerificationStatus>("idle");
    const [stripeDetails, setStripeDetails] = useState<{
        details_submitted?: boolean;
        charges_enabled?: boolean;
    }>({});

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

    // Handle return from Stripe onboarding
    useEffect(() => {
        const returnFromStripe = searchParams.get("return_from_stripe");
        if (returnFromStripe === "true" && status !== "success") {
            checkStripeStatus();
        }
    }, [searchParams]);

    const checkStripeStatus = async () => {
        try {
            setStatus("verifying");
            const response = await fetch("/api/stripe/status");
            const result = await response.json();

            setStripeDetails(result);

            if (result.details_submitted) {
                setStatus("success");
                updateStepData("step2", {
                    verified: true,
                    verifiedAt: new Date().toISOString(),
                });
            } else {
                // User returned from Stripe but didn't complete onboarding
                setStatus("incomplete");
            }
        } catch (error) {
            console.error("Error checking Stripe status:", error);
            setStatus("error");
        }
    };

    const handleStartVerification = async () => {
        try {
            setStatus("verifying");

            // Send step-1 company data so the API can create the company record
            const companyData = {
                businessName: data.step1?.businessName || '',
                ein: data.step1?.ein || '',
                address: data.step1 ? {
                    street: data.step1.street || '',
                    city: data.step1.city || '',
                    state: data.step1.state || '',
                    zipCode: data.step1.zipCode || '',
                } : null,
            };

            const response = await fetch("/api/stripe/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(companyData),
            });
            const result = await response.json();

            if (result.url) {
                window.location.href = result.url;
            } else {
                console.error("No URL returned:", result.error);
                setStatus("error");
            }
        } catch (error) {
            console.error("Error starting verification:", error);
            setStatus("error");
        }
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
            description="Verify your business identity through Stripe"
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
                                    You&apos;ll be redirected to Stripe to complete the verification.
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-700 text-xs">
                                    <strong>Secure Verification:</strong> You&apos;ll be redirected to Stripe&apos;s
                                    secure platform to complete your business verification. Your data is handled
                                    directly by Stripe.
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
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Checking Verification Status...
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    Verifying your Stripe account details
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {status === "incomplete" && (
                        <motion.div
                            key="incomplete"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Verification Incomplete
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                                    It looks like you didn&apos;t finish the Stripe onboarding.
                                    Please try again to complete the verification.
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                                <div className="space-y-1 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                        {stripeDetails.details_submitted ? (
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        )}
                                        <span>Details submitted: {stripeDetails.details_submitted ? "Yes" : "No"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {stripeDetails.charges_enabled ? (
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        )}
                                        <span>Charges enabled: {stripeDetails.charges_enabled ? "Yes" : "No"}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleStartVerification}
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25"
                            >
                                <svg className="mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Retry Verification
                            </Button>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Something Went Wrong
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                                    We encountered an error while setting up your verification.
                                    Please try again.
                                </p>
                            </div>

                            <Button
                                onClick={handleStartVerification}
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25"
                            >
                                <svg className="mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </Button>
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
                                    Your business has been verified successfully through Stripe
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </OnboardingCard>
    );
}
