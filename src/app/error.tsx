'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                    <AlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
                <p className="text-sm text-gray-500">
                    An unexpected error occurred. Our team has been notified.
                </p>
                {error.digest && (
                    <p className="text-xs text-gray-400 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
                <Button onClick={reset} className="w-full">
                    Try Again
                </Button>
            </div>
        </div>
    )
}
