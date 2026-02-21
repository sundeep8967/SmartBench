import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Wallet,
    ClipboardCheck,
    Search,
    Plus,
    UserPlus,
    Lightbulb,
} from "lucide-react";

interface Booking {
    id: string;
    realId: string;
    worker: string;
    avatar: string;
    dates: string;
    status: string;
    project: string | null;
}

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user's company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    let activeBookings = 0;
    let pendingVerifications = 0;
    let balance = 0;
    let recentBookings: Booking[] = [];

    if (member) {
        const companyId = member.company_id;

        // Parallel queries for dashboard stats
        const [bookingsRes, verificationsRes, financialsRes, recentBookingsRes] = await Promise.all([
            // 1. Active bookings count
            supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .eq('borrower_company_id', companyId)
                .in('status', ['Confirmed', 'Active']),

            // 2. Pending verifications count (time entries waiting for review)
            supabase
                .from('time_entries')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('status', 'Pending'),

            // 3. Financial balance from bookings (money in - money out)
            Promise.all([
                // Money in (as lender)
                supabase
                    .from('bookings')
                    .select('total_cost')
                    .eq('lender_company_id', companyId)
                    .in('status', ['Confirmed', 'Active', 'Completed']),
                // Money out (as borrower)
                supabase
                    .from('bookings')
                    .select('total_cost')
                    .eq('borrower_company_id', companyId)
                    .in('status', ['Confirmed', 'Active', 'Completed']),
            ]),

            // 4. Recent bookings (last 5)
            supabase
                .from('bookings')
                .select(`
                    id,
                    status,
                    start_date,
                    end_date,
                    created_at,
                    worker:users!bookings_worker_id_fkey(full_name),
                    project:projects(name)
                `)
                .eq('borrower_company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(5),
        ]);

        // Calculate financials
        const [lenderRes, borrowerRes] = financialsRes;
        const moneyIn = (lenderRes.data || []).reduce((sum, b) => sum + (b.total_cost || 0), 0);
        const moneyOut = (borrowerRes.data || []).reduce((sum, b) => sum + (b.total_cost || 0), 0);
        balance = moneyIn - moneyOut;

        activeBookings = bookingsRes.count || 0;
        pendingVerifications = verificationsRes.count || 0;

        // Format recent bookings
        recentBookings = (recentBookingsRes.data || []).map((b: any, i: number) => {
            const workerName = b.worker?.full_name || 'Unknown Worker';
            const initials = workerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
            const startDate = b.start_date ? new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
            const endDate = b.end_date ? new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
            return {
                id: `#BK-${String(i + 1).padStart(4, '0')}`,
                realId: b.id,
                worker: workerName,
                avatar: initials,
                dates: startDate && endDate ? `${startDate} - ${endDate}` : 'No dates set',
                status: b.status || 'Pending',
                project: b.project?.name || null,
            };
        });
    }

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

    const statusColor = (status: string) => {
        switch (status) {
            case "Active":
            case "Confirmed":
                return "bg-green-50 text-green-700 border border-green-100";
            case "Pending":
                return "bg-orange-50 text-orange-700 border border-orange-100";
            case "Completed":
                return "bg-blue-50 text-blue-700 border border-blue-100";
            default:
                return "bg-gray-50 text-gray-700 border border-gray-100";
        }
    };

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back to your construction management hub.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Active Bookings */}
                        <Card className="shadow-sm border-gray-200">
                            <CardContent className="pt-6">
                                <div className="flex flex-col h-full justify-between">
                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Active Bookings</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{activeBookings}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Verifications */}
                        <Card className="shadow-sm border-gray-200">
                            <CardContent className="pt-6">
                                <div className="flex flex-col h-full justify-between">
                                    <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                                        <ClipboardCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{pendingVerifications}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Bookings Table */}
                    <Card className="shadow-sm border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
                            <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                View All
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Booking ID</th>
                                        <th className="px-6 py-3">Worker</th>
                                        <th className="px-6 py-3">Dates</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                                No bookings yet. Create a project and book workers from the Marketplace.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentBookings.map((booking) => (
                                            <tr key={booking.realId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{booking.id}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                            {booking.avatar}
                                                        </div>
                                                        <span className="text-gray-900 font-medium">{booking.worker}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">{booking.dates}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href="/dashboard/bookings" className="text-gray-400 hover:text-gray-600">
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar (1/3) */}
                <div className="space-y-6">
                    {/* Financial Balance */}
                    <Card className="shadow-sm border-gray-200 bg-white">
                        <CardContent className="pt-6">
                            <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                                <Wallet size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Balance</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(balance)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link href="/dashboard/marketplace">
                                <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white justify-start h-12 text-base font-medium shadow-sm">
                                    <Search size={18} className="mr-3" />
                                    Search Workers
                                </Button>
                            </Link>
                            <Link href="/dashboard/projects">
                                <Button variant="outline" className="w-full justify-start h-12 text-base font-medium text-gray-700 border-gray-300 hover:bg-gray-50">
                                    <Plus size={18} className="mr-3" />
                                    Create Project
                                </Button>
                            </Link>
                            <Link href="/dashboard/roster">
                                <Button variant="outline" className="w-full justify-start h-12 text-base font-medium text-gray-700 border-gray-300 hover:bg-gray-50">
                                    <UserPlus size={18} className="mr-3" />
                                    Add to Roster
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center space-x-2 mb-3">
                            <Lightbulb size={18} className="text-orange-500 fill-orange-500" />
                            <span className="font-bold text-gray-900">Pro Tip</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Need to verify workers quickly? Use the bulk action tool in the Verification tab to process multiple profiles at once.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
