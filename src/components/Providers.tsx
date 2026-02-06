"use client";

import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
    );
}
