"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Step2KYB() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleMockVerify = async () => {
        setLoading(true);
        try {
            // For MVP/Dev, we mock the verification success
            const res = await fetch("/api/onboarding/step2", {
                method: "POST",
            });

            if (!res.ok) throw new Error("Verification failed");

            // Proceed to Step 3
            router.push("/onboarding/step-3");
        } catch (error) {
            console.error(error);
            alert("Verification failed.");
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
                {/* Placeholder for Stripe Button */}
                <Button
                    variant="outline"
                    className="w-full max-w-xs bg-[#635BFF] text-white hover:bg-[#635BFF]/90 hover:text-white border-0"
                    onClick={() => alert("Stripe Identity Flow would open here. Click 'Continue' to simulate success.")}
                    type="button"
                >
                    Verify with Stripe Identity
                </Button>

                <p className="text-xs text-muted-foreground">
                    For development, click "Continue" to simulate a successful check.
                </p>
            </div>

            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => router.back()} disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleMockVerify} className="flex-1" disabled={loading}>
                    {loading ? "Verifying..." : "Continue (Simulate Success)"}
                </Button>
            </div>
        </div>
    );
}
