import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Good Morning, John</h2>
                    <p className="text-gray-500">Here's what's happening with your bench today.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline">Invite Worker</Button>
                    <Button>Find Workers</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bench Size</CardTitle>
                        <span className="text-2xl">👥</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-gray-500">+2 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                        <span className="text-2xl">📅</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                        <p className="text-xs text-green-500">1 starting today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <span className="text-2xl">⏳</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-gray-500">Requires action</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
                        <span className="text-2xl">💰</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$4,250</div>
                        <p className="text-xs text-green-500">+12% from last week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                        JS
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">James Smith clocked in</p>
                                        <p className="text-xs text-gray-500">Project Alpha • 8:00 AM</p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-gray-500">Just now</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Status */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Bench Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                    <span className="text-sm">Available</span>
                                </div>
                                <span className="text-sm font-bold">5</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                                    <span className="text-sm">On Assignment</span>
                                </div>
                                <span className="text-sm font-bold">4</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                                    <span className="text-sm">Unavailable</span>
                                </div>
                                <span className="text-sm font-bold">3</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Button variant="outline" className="w-full">View Full Roster</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
