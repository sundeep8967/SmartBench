"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface OnboardingCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    badge?: {
        text: string;
        variant: "demo" | "info" | "success" | "warning";
    };
}

export function OnboardingCard({ title, description, children, footer, badge }: OnboardingCardProps) {
    const badgeColors = {
        demo: "bg-amber-100 text-amber-700 border-amber-200",
        info: "bg-blue-100 text-blue-700 border-blue-200",
        success: "bg-emerald-100 text-emerald-700 border-emerald-200",
        warning: "bg-orange-100 text-orange-700 border-orange-200",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-xl mx-auto"
        >
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                {/* Badge Banner */}
                {badge && (
                    <div className={`px-4 py-2 text-center text-sm font-medium border-b ${badgeColors[badge.variant]}`}>
                        {badge.text}
                    </div>
                )}

                {/* Header */}
                <div className="px-8 pt-8 pb-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
                    {description && (
                        <p className="mt-2 text-sm text-gray-500">{description}</p>
                    )}
                </div>

                {/* Content */}
                <div className="px-8 pb-6">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="px-8 pb-8">{footer}</div>
                )}
            </div>
        </motion.div>
    );
}
