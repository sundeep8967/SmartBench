"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.push("/login");
    }, [router]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
                <p className="text-gray-400">Redirecting to login...</p>
            </div>
        </main>
    );
}
