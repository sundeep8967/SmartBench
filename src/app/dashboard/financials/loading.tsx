import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function FinancialsLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <Skeleton className="h-10 w-32 rounded-md" />
            </div>

            {/* Balance Card */}
            <Card className="shadow-lg border-none overflow-hidden relative bg-blue-900/10">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 h-full">
                        <div className="space-y-6">
                            <div>
                                <Skeleton className="h-4 w-32 mb-3 bg-blue-900/20" />
                                <Skeleton className="h-12 w-64 bg-blue-900/20" />
                            </div>
                            <Skeleton className="h-10 w-64 rounded-lg bg-blue-900/20" />
                        </div>
                        <div className="flex items-end">
                            <Skeleton className="h-14 w-48 rounded-lg" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {[1, 2].map((i) => (
                    <Card key={i} className="shadow-sm border border-gray-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-8 w-40" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-12 w-12 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Transactions Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-48" />
                </div>

                <Card className="shadow-sm border border-gray-200 overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-32" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-20 ml-auto" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-20 mx-auto" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-48" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-md" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-5 w-24 ml-auto" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-5 w-24 mx-auto" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                    </div>
                </Card>
            </div>
        </div>
    );
}
