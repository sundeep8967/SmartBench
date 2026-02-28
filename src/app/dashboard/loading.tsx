export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 w-full animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded-md"></div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
            </div>

            {/* Grid Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col h-[296px] w-full rounded-xl border border-gray-100 bg-white p-6 shadow-sm justify-between">
                        <div className="space-y-3">
                            <div className="h-5 w-3/4 bg-gray-200 rounded-md"></div>
                            <div className="h-4 w-1/2 bg-gray-100 rounded-md"></div>
                        </div>
                        <div className="space-y-2 mt-6">
                            <div className="h-4 w-full bg-gray-100 rounded-md"></div>
                            <div className="h-4 w-full bg-gray-100 rounded-md"></div>
                            <div className="h-4 w-2/3 bg-gray-100 rounded-md"></div>
                        </div>
                        <div className="h-10 w-full bg-gray-200 rounded-md mt-auto"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
