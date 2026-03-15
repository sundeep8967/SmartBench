"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function StripeSetupAlert() {
    const [status, setStatus] = useState<"loading" | "needs_setup" | "needs_details" | "pending_verification" | "onboarded">("loading");
    const [isConnecting, setIsConnecting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [companyName, setCompanyName] = useState("");

    const fetchStripeStatus = async () => {
        try {
            const res = await fetch("/api/stripe/status");
            if (res.ok) {
                const data = await res.json();
                setIsAdmin(data.is_admin);
                setCompanyName(data.company_name);

                if (data.is_fully_onboarded) {
                    setStatus("onboarded");
                } else if (!data.has_account) {
                    setStatus("needs_setup");
                } else if (data.needs_action) {
                    setStatus("needs_details");
                } else {
                    setStatus("pending_verification");
                }
            } else {
                setStatus("needs_setup");
            }
        } catch (err) {
            console.error("Failed to check Stripe status:", err);
            setStatus("needs_setup");
        }
    };

    useEffect(() => {
        fetchStripeStatus();

        // Listen for custom refresh event
        window.addEventListener("smartbench:stripe_status_refresh", fetchStripeStatus);
        return () => window.removeEventListener("smartbench:stripe_status_refresh", fetchStripeStatus);
    }, []);

    const handleConnectStripe = async () => {
        setIsConnecting(true);
        try {
            const res = await fetch("/api/stripe/connect", { method: "POST" });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Failed to connect to Stripe");
            }
        } catch (err: any) {
            console.error("Stripe connection error:", err);
            alert(err.message || "Failed to connect to Stripe. Please try again.");
            setIsConnecting(false);
        }
    };

    if (status === "onboarded" || !isAdmin || status === "loading") return null;

    const config = {
        needs_setup: {
            title: "Action Required: Setup Stripe Payments",
            description: "You need to set up your payout method to be able to list or hire a worker. It only takes a few minutes.",
            buttonText: "Setup Stripe",
            color: "yellow"
        },
        needs_details: {
            title: "Action Required: Complete Stripe Setup",
            description: `Stripe needs more information for your account to enable payouts.`,
            buttonText: "Complete Setup",
            color: "orange"
        },
        pending_verification: {
            title: "Stripe Verification in Progress",
            description: "Your details have been submitted. Stripe is currently verifying your account. This usually takes a few minutes.",
            buttonText: "Refresh Status",
            color: "blue"
        }
    }[status as "needs_setup" | "needs_details" | "pending_verification"];

    if (!config) return null;

    const bgClass = config.color === "yellow" ? "bg-yellow-50 border-yellow-200" :
        config.color === "orange" ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200";
    const iconBgClass = config.color === "yellow" ? "bg-yellow-100 text-yellow-600" :
        config.color === "orange" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600";
    const titleClass = config.color === "yellow" ? "text-yellow-800" :
        config.color === "orange" ? "text-orange-800" : "text-blue-800";
    const descClass = config.color === "yellow" ? "text-yellow-700" :
        config.color === "orange" ? "text-orange-700" : "text-blue-700";
    const btnClass = config.color === "yellow" ? "bg-yellow-600 hover:bg-yellow-700" :
        config.color === "orange" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700";

    return (
        <Card className={`shadow-sm mb-6 ${bgClass}`}>
            <CardContent className="p-4 flex items-start sm:items-center flex-col sm:flex-row gap-4">
                <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${iconBgClass}`}>
                    <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                    <h3 className={`font-semibold ${titleClass}`}>{config.title}</h3>
                    <p className={`text-sm mt-1 ${descClass}`}>
                        {config.description}
                    </p>
                </div>
                {status === "pending_verification" ? (
                    <button
                        onClick={() => window.location.reload()}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 text-white ${btnClass}`}
                    >
                        {config.buttonText}
                    </button>
                ) : (
                    <button
                        onClick={handleConnectStripe}
                        disabled={isConnecting}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 text-white ${btnClass}`}
                    >
                        {isConnecting ? "Opening..." : config.buttonText}
                        {!isConnecting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
