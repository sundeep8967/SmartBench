"use client";

import { AuthProvider } from "@/lib/contexts/AuthContext";
import { OnboardingProvider } from "@/lib/contexts/OnboardingContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import React from "react"; // Added React import for React.ReactNode

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <OnboardingProvider>
                <CartProvider>
                    <TooltipProvider>
                        {children}
                    </TooltipProvider>
                </CartProvider>
            </OnboardingProvider>
        </AuthProvider>
    );
}
