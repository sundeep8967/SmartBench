import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function BookingsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-32 rounded-md" />
                    <Skeleton className="h-10 w-36 rounded-md" />
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 flex space-x-8">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-6 w-32 mb-2" />
            </div>

            {/* Unified Filter Bar */}
            <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-12 mt-6">
                <div className="flex items-center flex-1 px-4">
                    <Skeleton className="h-4 w-4 mr-3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="w-px bg-gray-200 self-stretch" />
                <div className="flex items-center px-4">
                    <Skeleton className="h-4 w-28" />
                </div>
                <div className="w-px bg-gray-200 self-stretch" />
                <div className="flex items-center px-4">
                    <Skeleton className="h-4 w-28" />
                </div>
                <div className="w-px bg-gray-200 self-stretch" />
                <div className="flex items-center px-3 space-x-2">
                    <Skeleton className="h-6 w-6 rounded-md" />
                    <Skeleton className="h-6 w-6 rounded-md" />
                </div>
            </div>

            {/* Table View Layout */}
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-1/4"><Skeleton className="h-4 w-16" /></th>
                                <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                                <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                                <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                                <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                                <th className="px-6 py-4"><Skeleton className="h-4 w-8 ml-auto" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="bg-white">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
