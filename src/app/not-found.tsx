import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <FileQuestion size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Page Not Found</h2>
                <p className="text-sm text-gray-500">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Button asChild className="w-full">
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
