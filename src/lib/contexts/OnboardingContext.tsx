"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

export interface CompanyInfo {
    ein: string;
    businessName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface OnboardingData {
    step1: CompanyInfo | null;
    step2: {
        verified: boolean;
        verifiedAt: string | null;
    };
    step3: {
        userType: "solopreneur" | "company" | null;
    };
    step4: {
        // Solopreneur fields
        trade?: string;
        skills?: string[];
        experienceLevel?: string;
        // Company fields
        companyDescription?: string;
        website?: string;
    };
}

interface OnboardingContextType {
    currentStep: number;
    data: OnboardingData;
    setCurrentStep: (step: number) => void;
    updateStepData: <K extends keyof OnboardingData>(step: K, data: Partial<OnboardingData[K]>) => void;
    nextStep: () => void;
    prevStep: () => void;
    isStepComplete: (step: number) => boolean;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

const defaultData: OnboardingData = {
    step1: null,
    step2: { verified: false, verifiedAt: null },
    step3: { userType: null },
    step4: {},
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const BASE_STORAGE_KEY = "smartbench_onboarding";

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<OnboardingData>(defaultData);
    const [isLoaded, setIsLoaded] = useState(false);

    const STORAGE_KEY = user ? `${BASE_STORAGE_KEY}_${user.id}` : BASE_STORAGE_KEY;

    // Load from localStorage on mount (per-user)
    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setData(parsed.data || defaultData);
                    setCurrentStep(parsed.currentStep || 1);
                } catch {
                    console.error("Failed to parse onboarding data");
                }
            }
        }
        setIsLoaded(true);
    }, [user, STORAGE_KEY]);

    // Save to localStorage on changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep, data }));
        }
    }, [currentStep, data, isLoaded]);

    const updateStepData = <K extends keyof OnboardingData>(
        step: K,
        newData: Partial<OnboardingData[K]>
    ) => {
        setData((prev) => ({
            ...prev,
            [step]: { ...prev[step], ...newData } as OnboardingData[K],
        }));
    };

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const isStepComplete = (step: number): boolean => {
        switch (step) {
            case 1:
                return data.step1 !== null;
            case 2:
                return data.step2.verified;
            case 3:
                return data.step3.userType !== null;
            case 4:
                return Object.keys(data.step4).length > 0;
            default:
                return false;
        }
    };

    const completeOnboarding = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    const resetOnboarding = () => {
        setData(defaultData);
        setCurrentStep(1);
        localStorage.removeItem(STORAGE_KEY);
    };

    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <OnboardingContext.Provider
            value={{
                currentStep,
                data,
                setCurrentStep,
                updateStepData,
                nextStep,
                prevStep,
                isStepComplete,
                completeOnboarding,
                resetOnboarding,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider");
    }
    return context;
}
