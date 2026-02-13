"use client";

import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>{children}</AuthProvider>
    );
}
