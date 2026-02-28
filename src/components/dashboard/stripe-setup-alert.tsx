"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function StripeSetupAlert() {
    const [status, setStatus] = useState<"loading" | "needs_setup" | "onboarded">("loading");

    useEffect(() => {
        const checkStripeStatus = async () => {
            try {
                const res = await fetch("/api/stripe/status");
                if (res.ok) {
                    const data = await res.json();
                    if (data.is_fully_onboarded) {
                        setStatus("onboarded");
                    } else {
                        setStatus("needs_setup");
                    }
                } else {
                    setStatus("needs_setup");
                }
            } catch (err) {
                console.error("Failed to check Stripe status:", err);
                setStatus("needs_setup");
            }
        };

        checkStripeStatus();
    }, []);

    if (status !== "needs_setup") return null;

    return (
        <Card className="shadow-sm border-yellow-200 bg-yellow-50 mb-6">
            <CardContent className="p-4 flex items-start sm:items-center flex-col sm:flex-row gap-4">
                <div className="h-10 w-10 shrink-0 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                    <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800">Action Required: Complete Stripe Setup</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                        You need to set up your payout method to be able to list or hire a worker. It only takes a few minutes.
                    </p>
                </div>
                <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-yellow-600 text-white hover:bg-yellow-700 h-9 px-4 py-2 shrink-0"
                >
                    Setup Stripe
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </CardContent>
        </Card>
    );
}
