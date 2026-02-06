"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";

type UserType = "solopreneur" | "company" | null;

export default function Step3Page() {
    const router = useRouter();
    const { data, updateStepData, setCurrentStep, isStepComplete } = useOnboarding();

    const [selectedType, setSelectedType] = useState<UserType>(null);

    useEffect(() => {
        setCurrentStep(3);
        if (data.step3.userType) {
            setSelectedType(data.step3.userType);
        }
    }, [data.step3.userType, setCurrentStep]);

    useEffect(() => {
        if (!isStepComplete(2)) {
            router.push("/onboarding/step-2");
        }
    }, [isStepComplete, router]);

    const handleSelect = (type: UserType) => {
        setSelectedType(type);
    };

    const handleContinue = () => {
        if (selectedType) {
            updateStepData("step3", { userType: selectedType });
            router.push("/onboarding/step-4");
        }
    };

    const handleBack = () => {
        router.push("/onboarding/step-2");
    };

    const typeOptions = [
        {
            id: "solopreneur" as const,
            title: "Solopreneur",
            subtitle: "I work alone",
            description: "You'll be able to list yourself in the marketplace and manage your own bookings.",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            features: ["Single user account", "All roles in one", "Quick setup"],
        },
        {
            id: "company" as const,
            title: "Company",
            subtitle: "I have a team",
            description: "Manage multiple workers, supervisors, and handle team-wide bookings.",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            features: ["Multiple team members", "Role-based access", "Worker invites"],
        },
    ];

    return (
        <OnboardingCard
            title="How will you use SmartBench?"
            description="Select the option that best describes your business"
            footer={
                <div className="space-y-3">
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedType}
                        className={`w-full h-12 font-semibold text-base transition-all ${selectedType
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
                        ← Back to Verification
                    </button>
                </div>
            }
        >
            <div className="space-y-4 py-2">
                {typeOptions.map((option, index) => (
                    <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSelect(option.id)}
                        className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 ${selectedType === option.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`p-3 rounded-lg ${selectedType === option.id
                                        ? "bg-blue-100 text-blue-600"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                            >
                                {option.icon}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {option.title}
                                        </h3>
                                        <p className="text-sm text-gray-500">{option.subtitle}</p>
                                    </div>

                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedType === option.id
                                                ? "border-blue-500 bg-blue-500"
                                                : "border-gray-300"
                                            }`}
                                    >
                                        {selectedType === option.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-2 h-2 rounded-full bg-white"
                                            />
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                    {option.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {option.features.map((feature) => (
                                        <span
                                            key={feature}
                                            className={`text-xs px-2 py-1 rounded-full ${selectedType === option.id
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-gray-200 text-gray-600"
                                                }`}
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </OnboardingCard>
    );
}
