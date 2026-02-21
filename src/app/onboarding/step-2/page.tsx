"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type StripeStatus = "idle" | "redirecting" | "checking" | "complete" | "incomplete" | "error";

export default function Step2KYB() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<StripeStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // Check if returning from Stripe
    const returnFromStripe = searchParams.get("return_from_stripe") === "true";

    useEffect(() => {
        if (returnFromStripe) {
            checkStripeStatus();
        }
    }, [returnFromStripe]);

    const checkStripeStatus = async () => {
        setStatus("checking");
        try {
            const res = await fetch("/api/stripe/status");
            if (!res.ok) throw new Error("Failed to check status");

            const data = await res.json();

            if (data.details_submitted) {
                setStatus("complete");
            } else {
                setStatus("incomplete");
            }
        } catch (error: any) {
            console.error("Stripe status check error:", error);
            setStatus("incomplete");
        }
    };

    const handleSetupStripe = async () => {
        setStatus("redirecting");
        setErrorMessage("");
        try {
            // Get stored company info from Step 1 (saved in localStorage by OnboardingContext)
            const savedOnboarding = localStorage.getItem("smartbench_onboarding");
            let companyInfo = {};
            if (savedOnboarding) {
                const parsed = JSON.parse(savedOnboarding);
                const step1 = parsed?.data?.step1;
                if (step1) {
                    companyInfo = {
                        businessName: step1.businessName,
                        ein: step1.ein,
                        address: `${step1.street || ""}, ${step1.city || ""}, ${step1.state || ""} ${step1.zipCode || ""}`.trim(),
                    };
                }
            }

            const res = await fetch("/api/stripe/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(companyInfo),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create Stripe account");
            }

            const { url } = await res.json();

            // Redirect to Stripe hosted onboarding
            window.location.href = url;
        } catch (error: any) {
            console.error("Stripe Connect error:", error);
            setErrorMessage(error.message || "Something went wrong. Please try again.");
            setStatus("error");
        }
    };

    const handleContinue = () => {
        router.push("/onboarding/step-3");
    };

    return (
        <div className="space-y-6">
            <div className="text-center md:text-left">
                <h3 className="text-lg font-medium text-gray-900">Set Up Payments</h3>
                <p className="text-sm text-gray-500">
                    Connect your Stripe account to send and receive payments on SmartBench.
                    This is required for all financial transactions.
                </p>
            </div>

            {/* Status Display */}
            <div className="border rounded-lg p-6 text-center space-y-4">
                {status === "idle" && (
                    <>
                        <div className="h-12 w-12 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <ExternalLink size={24} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Stripe Connect Onboarding</p>
                            <p className="text-sm text-gray-500 mt-1">
                                You&apos;ll be redirected to Stripe to securely verify your business
                                and set up bank account details for payouts.
                            </p>
                        </div>
                    </>
                )}

                {status === "redirecting" && (
                    <>
                        <Loader2 className="h-10 w-10 mx-auto animate-spin text-blue-600" />
                        <p className="text-sm text-gray-500">Preparing your Stripe account...</p>
                    </>
                )}

                {status === "checking" && (
                    <>
                        <Loader2 className="h-10 w-10 mx-auto animate-spin text-blue-600" />
                        <p className="text-sm text-gray-500">Checking your account status...</p>
                    </>
                )}

                {status === "complete" && (
                    <>
                        <div className="h-12 w-12 mx-auto bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="font-medium text-green-700">Stripe Account Connected!</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Your payment account is set up. You can proceed to the next step.
                            </p>
                        </div>
                    </>
                )}

                {status === "incomplete" && (
                    <>
                        <div className="h-12 w-12 mx-auto bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="font-medium text-orange-700">Setup Incomplete</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Your Stripe account setup isn&apos;t complete yet. Please click below to
                                continue where you left off.
                            </p>
                        </div>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="h-12 w-12 mx-auto bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="font-medium text-red-700">Something went wrong</p>
                            <p className="text-sm text-gray-500 mt-1">{errorMessage}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => router.back()} disabled={status === "redirecting"}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                {status === "complete" ? (
                    <Button onClick={handleContinue} className="flex-1">
                        Continue to Next Step
                    </Button>
                ) : (
                    <Button
                        onClick={handleSetupStripe}
                        className="flex-1"
                        disabled={status === "redirecting" || status === "checking"}
                    >
                        {status === "redirecting" ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Redirecting...
                            </>
                        ) : status === "incomplete" ? (
                            "Continue Stripe Setup"
                        ) : status === "error" ? (
                            "Try Again"
                        ) : (
                            "Set Up with Stripe"
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
