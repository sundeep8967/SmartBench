"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TRADES = [
    "Electrician",
    "Plumber",
    "Carpenter",
    "HVAC Technician",
    "Mason",
    "Roofer",
    "Painter",
    "Welder",
    "Heavy Equipment Operator",
    "General Laborer",
];

const EXPERIENCE_LEVELS = [
    { value: "entry", label: "Entry Level", description: "0-2 years" },
    { value: "intermediate", label: "Intermediate", description: "3-5 years" },
    { value: "experienced", label: "Experienced", description: "6-10 years" },
    { value: "expert", label: "Expert", description: "10+ years" },
];

type ViewState = "form" | "completing" | "success";

export default function Step4Page() {
    const router = useRouter();
    const { data, updateStepData, setCurrentStep, isStepComplete, completeOnboarding } = useOnboarding();

    const [viewState, setViewState] = useState<ViewState>("form");
    const isSolopreneur = data.step3.userType === "solopreneur";

    const [trade, setTrade] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [companyDescription, setCompanyDescription] = useState("");
    const [website, setWebsite] = useState("");

    useEffect(() => {
        setCurrentStep(4);
        if (data.step4) {
            if (data.step4.trade) setTrade(data.step4.trade);
            if (data.step4.experienceLevel) setExperienceLevel(data.step4.experienceLevel);
            if (data.step4.companyDescription) setCompanyDescription(data.step4.companyDescription);
            if (data.step4.website) setWebsite(data.step4.website);
        }
    }, [data.step4, setCurrentStep]);

    useEffect(() => {
        if (!isStepComplete(3)) {
            router.push("/onboarding/step-3");
        }
    }, [isStepComplete, router]);

    const handleComplete = () => {
        if (isSolopreneur) {
            updateStepData("step4", { trade, experienceLevel });
        } else {
            updateStepData("step4", { companyDescription, website });
        }

        setViewState("completing");

        setTimeout(() => {
            setViewState("success");
            completeOnboarding();
        }, 2000);
    };

    const handleGoToDashboard = () => {
        router.push("/dashboard/marketplace");
    };

    const handleBack = () => {
        router.push("/onboarding/step-3");
    };

    const isFormValid = () => {
        if (isSolopreneur) {
            return trade && experienceLevel;
        }
        return true;
    };

    return (
        <AnimatePresence mode="wait">
            {viewState === "form" && (
                <OnboardingCard
                    key="form"
                    title={isSolopreneur ? "Your Profile" : "Company Details"}
                    description={
                        isSolopreneur
                            ? "Tell us about your trade and experience"
                            : "Add optional details about your company"
                    }
                    footer={
                        <div className="space-y-3">
                            <Button
                                onClick={handleComplete}
                                disabled={!isFormValid()}
                                className={`w-full h-12 font-semibold text-base transition-all ${isFormValid()
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                Complete Setup
                                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </Button>
                            <button
                                onClick={handleBack}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                ← Back to User Type
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-5 py-2">
                        {isSolopreneur ? (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Label className="text-gray-700 mb-2 block">
                                        Primary Trade <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        value={trade}
                                        onChange={(e) => setTrade(e.target.value)}
                                        className="w-full h-12 px-3 rounded-md bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
                                    >
                                        <option value="">Select your trade</option>
                                        {TRADES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Label className="text-gray-700 mb-3 block">
                                        Experience Level <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {EXPERIENCE_LEVELS.map((level) => (
                                            <button
                                                key={level.value}
                                                onClick={() => setExperienceLevel(level.value)}
                                                className={`p-3 rounded-lg border-2 text-left transition-all ${experienceLevel === level.value
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                                    }`}
                                            >
                                                <span className="block text-sm font-medium text-gray-800">
                                                    {level.label}
                                                </span>
                                                <span className="block text-xs text-gray-500 mt-0.5">
                                                    {level.description}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Label htmlFor="description" className="text-gray-700 mb-2 block">
                                        Company Description <span className="text-gray-400">(optional)</span>
                                    </Label>
                                    <textarea
                                        id="description"
                                        value={companyDescription}
                                        onChange={(e) => setCompanyDescription(e.target.value)}
                                        placeholder="Tell potential clients about your company..."
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none resize-none"
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Label htmlFor="website" className="text-gray-700 mb-2 block">
                                        Website <span className="text-gray-400">(optional)</span>
                                    </Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        placeholder="https://www.yourcompany.com"
                                        className="h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                                >
                                    <p className="text-blue-700 text-sm">
                                        <strong>Next step:</strong> After setup, you can invite team members from your dashboard.
                                    </p>
                                </motion.div>
                            </>
                        )}
                    </div>
                </OnboardingCard>
            )}

            {viewState === "completing" && (
                <motion.div
                    key="completing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full max-w-xl mx-auto text-center py-20"
                >
                    <div className="w-24 h-24 mx-auto relative mb-8">
                        <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
                        <div
                            className="absolute inset-0 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin"
                            style={{ animationDuration: "0.8s" }}
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Setting up your account...</h2>
                    <p className="text-gray-500">This will only take a moment</p>
                </motion.div>
            )}

            {viewState === "success" && (
                <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-xl mx-auto"
                >
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                            className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6"
                        >
                            <motion.svg
                                className="w-12 h-12 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </motion.svg>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                You&apos;re all set! 🎉
                            </h2>
                            <p className="text-gray-500 mb-8">
                                Your account has been set up successfully. Welcome to SmartBench!
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Account Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Company</span>
                                        <span className="text-gray-800 font-medium">{data.step1?.businessName || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Account Type</span>
                                        <span className="text-gray-800 font-medium capitalize">{data.step3.userType || "—"}</span>
                                    </div>
                                    {isSolopreneur && trade && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Trade</span>
                                            <span className="text-gray-800 font-medium">{trade}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleGoToDashboard}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25"
                            >
                                Go to Dashboard
                                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
