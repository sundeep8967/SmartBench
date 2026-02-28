import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function TimeClockLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Active Shift Card Skeleton */}
                    <Card>
                        <CardHeader className="pb-4 border-b">
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <Skeleton className="h-10 w-48" />
                                <Skeleton className="h-5 w-64" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t">
                                <div>
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-6 w-32" />
                                </div>
                                <div className="text-right">
                                    <Skeleton className="h-4 w-24 mb-2 ml-auto" />
                                    <Skeleton className="h-6 w-32 ml-auto" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Shifts Table Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-y py-2">
                                    <tr>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-24" /></th>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
                                        <th className="px-6 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {[1, 2, 3, 4].map((i) => (
                                        <tr key={i} className="bg-white">
                                            <td className="px-6 py-4">
                                                <Skeleton className="h-5 w-24 mb-1" />
                                                <Skeleton className="h-4 w-16" />
                                            </td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-6 py-4">
                                                <Skeleton className="h-5 w-16 mb-1" />
                                                <Skeleton className="h-4 w-20" />
                                            </td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="px-6 py-4 text-right font-medium"><Skeleton className="h-5 w-12 ml-auto" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Summary Card Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                            <div className="pt-4 border-t space-y-4">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
