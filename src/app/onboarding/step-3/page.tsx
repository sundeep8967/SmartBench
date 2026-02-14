"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, CheckCircle2 } from "lucide-react";

export default function Step3Type() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selection, setSelection] = useState<"solopreneur" | "company" | null>(null);

    const handleContinue = async () => {
        if (!selection) return;
        setLoading(true);
        try {
            const res = await fetch("/api/onboarding/step3", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: selection }),
            });

            if (!res.ok) throw new Error("Failed to save selection");

            // Redirect based on selection
            if (selection === "solopreneur") {
                // Solopreneur -> Profile Setup
                router.push("/onboarding/step-4?mode=profile");
            } else {
                // Company -> Invite Crew
                router.push("/onboarding/step-4?mode=invite");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving selection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center md:text-left">
                <h3 className="text-lg font-medium text-gray-900">How do you work?</h3>
                <p className="text-sm text-gray-500">
                    Select the option that best describes your business.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Solopreneur Option */}
                <Card
                    className={`cursor-pointer transition-all border-2 relative ${selection === "solopreneur" ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"}`}
                    onClick={() => setSelection("solopreneur")}
                >
                    {selection === "solopreneur" && (
                        <div className="absolute top-3 right-3 text-blue-500">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    )}
                    <CardHeader>
                        <User className={`w-8 h-8 mb-2 ${selection === "solopreneur" ? "text-blue-500" : "text-gray-400"}`} />
                        <CardTitle className="text-base">Solopreneur</CardTitle>
                        <CardDescription>
                            I work alone. I manage my own bookings and perform the work myself.
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Company Option */}
                <Card
                    className={`cursor-pointer transition-all border-2 relative ${selection === "company" ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"}`}
                    onClick={() => setSelection("company")}
                >
                    {selection === "company" && (
                        <div className="absolute top-3 right-3 text-blue-500">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    )}
                    <CardHeader>
                        <Users className={`w-8 h-8 mb-2 ${selection === "company" ? "text-blue-500" : "text-gray-400"}`} />
                        <CardTitle className="text-base">Company with Crew</CardTitle>
                        <CardDescription>
                            I manage a team of employees or subcontractors. I dispatch work to others.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Button
                onClick={handleContinue}
                className="w-full"
                disabled={loading || !selection}
            >
                {loading ? "Saving..." : "Continue"}
            </Button>
        </div>
    );
}
