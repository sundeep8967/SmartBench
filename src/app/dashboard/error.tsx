'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Dashboard error:', error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                    <AlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
                <p className="text-sm text-gray-500">
                    There was a problem loading this page. Please try again.
                </p>
                <div className="flex gap-3">
                    <Button onClick={reset} variant="outline" className="flex-1">
                        <RefreshCw size={16} className="mr-2" />
                        Retry
                    </Button>
                    <Button asChild className="flex-1">
                        <Link href="/dashboard">Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
