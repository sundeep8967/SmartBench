"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function Step1Page() {
    const router = useRouter();
    const { data, updateStepData, setCurrentStep } = useOnboarding();

    const [ein, setEin] = useState(data.step1?.ein || "");
    const [businessName, setBusinessName] = useState(data.step1?.businessName || "");
    const [street, setStreet] = useState(data.step1?.street || "");
    const [city, setCity] = useState(data.step1?.city || "");
    const [state, setState] = useState(data.step1?.state || "");
    const [zipCode, setZipCode] = useState(data.step1?.zipCode || "");

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setCurrentStep(1);
    }, [setCurrentStep]);

    // EIN auto-formatting
    const handleEinChange = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        let formatted = cleaned;
        if (cleaned.length >= 2) {
            formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 9)}`;
        }
        setEin(formatted);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!ein || ein.replace(/-/g, "").length !== 9) {
            newErrors.ein = "Please enter a valid 9-digit EIN";
        }
        if (!businessName.trim()) {
            newErrors.businessName = "Business name is required";
        }
        if (!street.trim()) {
            newErrors.street = "Street address is required";
        }
        if (!city.trim()) {
            newErrors.city = "City is required";
        }
        if (!state) {
            newErrors.state = "State is required";
        }
        if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
            newErrors.zipCode = "Please enter a valid ZIP code";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (validateForm()) {
            updateStepData("step1", {
                ein,
                businessName,
                street,
                city,
                state,
                zipCode,
            });
            router.push("/onboarding/step-2");
        }
    };

    return (
        <OnboardingCard
            title="Company Information"
            description="Tell us about your business"
            footer={
                <Button
                    onClick={handleContinue}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25"
                >
                    Continue
                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Button>
            }
        >
            <div className="space-y-5">
                {/* EIN */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Label htmlFor="ein" className="text-gray-700 mb-2 block">
                        EIN (Employer Identification Number) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="ein"
                        value={ein}
                        onChange={(e) => handleEinChange(e.target.value)}
                        placeholder="XX-XXXXXXX"
                        maxLength={10}
                        className={`h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 ${errors.ein ? "border-red-400" : ""}`}
                    />
                    {errors.ein && <p className="text-red-500 text-xs mt-1">{errors.ein}</p>}
                </motion.div>

                {/* Business Name */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Label htmlFor="businessName" className="text-gray-700 mb-2 block">
                        Business Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Your company name"
                        className={`h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 ${errors.businessName ? "border-red-400" : ""}`}
                    />
                    {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                </motion.div>

                {/* Street Address */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Label htmlFor="street" className="text-gray-700 mb-2 block">
                        Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="street"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="123 Main Street"
                        className={`h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 ${errors.street ? "border-red-400" : ""}`}
                    />
                    {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                </motion.div>

                {/* City, State, ZIP */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-3 gap-4"
                >
                    <div className="col-span-1">
                        <Label htmlFor="city" className="text-gray-700 mb-2 block">
                            City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            className={`h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 ${errors.city ? "border-red-400" : ""}`}
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>

                    <div>
                        <Label htmlFor="state" className="text-gray-700 mb-2 block">
                            State <span className="text-red-500">*</span>
                        </Label>
                        <select
                            id="state"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className={`w-full h-12 px-3 rounded-md bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none ${errors.state ? "border-red-400" : ""}`}
                        >
                            <option value="">--</option>
                            {US_STATES.map((st) => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>

                    <div>
                        <Label htmlFor="zipCode" className="text-gray-700 mb-2 block">
                            ZIP <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="zipCode"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            placeholder="12345"
                            maxLength={10}
                            className={`h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 ${errors.zipCode ? "border-red-400" : ""}`}
                        />
                        {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                    </div>
                </motion.div>
            </div>
        </OnboardingCard>
    );
}
