"use client";

import { motion } from "framer-motion";

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps?: number;
}

const steps = [
    { number: 1, title: "Company Info" },
    { number: 2, title: "Verification" },
    { number: 3, title: "User Type" },
    { number: 4, title: "Complete" },
];

export function ProgressIndicator({ currentStep, totalSteps = 4 }: ProgressIndicatorProps) {
    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between">
                {steps.slice(0, totalSteps).map((step, index) => {
                    const isCompleted = step.number < currentStep;
                    const isCurrent = step.number === currentStep;
                    const isUpcoming = step.number > currentStep;

                    return (
                        <div key={step.number} className="flex items-center flex-1 last:flex-none">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? 1.1 : 1,
                                        backgroundColor: isCompleted
                                            ? "#10B981"
                                            : isCurrent
                                                ? "#3B82F6"
                                                : "#E5E7EB",
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        text-sm font-semibold border-2
                                        ${isCompleted ? "border-emerald-500 text-white" : ""}
                                        ${isCurrent ? "border-blue-500 text-white shadow-lg shadow-blue-500/30" : ""}
                                        ${isUpcoming ? "border-gray-200 text-gray-400" : ""}
                                    `}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        step.number
                                    )}
                                </motion.div>
                                <span
                                    className={`
                                        mt-2 text-xs font-medium hidden sm:block
                                        ${isCompleted ? "text-emerald-600" : ""}
                                        ${isCurrent ? "text-blue-600" : ""}
                                        ${isUpcoming ? "text-gray-400" : ""}
                                    `}
                                >
                                    {step.title}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < steps.slice(0, totalSteps).length - 1 && (
                                <div className="flex-1 h-0.5 mx-3 bg-gray-200 relative overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: isCompleted ? "100%" : "0%",
                                        }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="absolute inset-y-0 left-0 bg-emerald-500"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
