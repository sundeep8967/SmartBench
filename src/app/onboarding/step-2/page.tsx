"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

export default function Step2KYB() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Load Stripe with Sandbox Key
    // Note: We use the sandbox key specifically as requested
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_SANDBOX!);

    const handleVerify = async () => {
        setLoading(true);
        try {
            // 1. Create Verification Session
            const res = await fetch("/api/stripe/identity/create-session", {
                method: "POST",
            });

            if (!res.ok) throw new Error("Failed to create verification session");

            const { clientSecret } = await res.json();

            // 2. Redirect to Stripe Identity Modal
            const stripe = await stripePromise;
            if (!stripe) throw new Error("Stripe failed to load");

            const { error } = await stripe.verifyIdentity(clientSecret);

            if (error) {
                console.error("Stripe Identity Error:", error);
                alert(`Verification failed: ${error.message}`);
            } else {
                // Success - Proceed to Step 3
                // Ideally, we should also call backend to confirm status using webhook
                // But for now, we assume frontend success means we can proceed.
                router.push("/onboarding/step-3");
            }

        } catch (error: any) {
            console.error(error);
            alert("Verification failed. See console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">Verify your Business</h3>
            <p className="text-sm text-gray-500">
                We use Stripe Identity to verify your business information.
                This is required to comply with financial regulations.
            </p>

            <div className="flex flex-col gap-4 items-center py-6">
                <div className="text-center pb-4">
                    <p className="text-sm text-muted-foreground">
                        Click below to verify your identity using Stripe's secure Sandbox environment.
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => router.back()} disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleVerify} className="flex-1" disabled={loading}>
                    {loading ? "Verifying..." : "Verify with Stripe (Sandbox)"}
                </Button>
            </div>
        </div>
    );
}
