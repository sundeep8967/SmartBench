"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowUpRight,
    ArrowRight,
    Filter,
    Wallet,
    Calendar,
    Download
} from "lucide-react";

// Mock transaction data matched to Financials.png
const transactions = [
    {
        id: "PY-8832",
        date: "Nov 14, 2023",
        description: "Stripe Payout #PY-8832",
        subtext: "Automated Weekly Payout",
        type: "Incoming",
        amount: "+$12,450.00",
        status: "Processing"
    },
    {
        id: "BK-9024",
        date: "Nov 12, 2023",
        description: "Payout for Booking #BK-9024",
        subtext: "Labor Costs - Mike Ross",
        type: "Outgoing",
        amount: "-$1,800.00",
        status: "Settled"
    },
    {
        id: "SUB-001",
        date: "Nov 01, 2023",
        description: "Monthly Subscription",
        subtext: "SmartBench Pro Plan",
        type: "Outgoing",
        amount: "-$49.00",
        status: "Settled"
    },
    {
        id: "PRJ-A",
        date: "Oct 28, 2023",
        description: "Deposit from Project A",
        subtext: "Initial retainer",
        type: "Incoming",
        amount: "+$5,000.00",
        status: "Settled"
    },
];

export default function FinancialsPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <span>Dashboard</span>
                        <span className="text-gray-300">›</span>
                        <span>Financials</span>
                        <span className="text-gray-300">›</span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">Overview</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financials & Payments</h1>
                    <p className="text-gray-500 mt-1">Manage your wallet, payouts, and transaction history.</p>
                </div>
                <Button variant="outline" className="text-gray-700 border-gray-300 bg-white shadow-sm">
                    <Download size={16} className="mr-2" />
                    Export Data
                </Button>
            </div>

            {/* Balance Card */}
            {/* FORCE styling with !important to override ShadCN defaults */}
            <Card className="!bg-blue-900 !text-white shadow-lg border-none overflow-hidden relative">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 h-full">
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Available Balance</p>
                                <div className="flex items-baseline">
                                    <span className="text-5xl font-extrabold tracking-tight">$12,450.00</span>
                                </div>
                            </div>

                            <div className="inline-flex items-center space-x-2 bg-blue-800 border border-blue-700 rounded-lg px-3 py-2 text-sm text-blue-100">
                                <Calendar size={16} className="text-blue-300" />
                                <span>Next payout scheduled for <span className="font-bold text-white">Nov 15, 2023</span></span>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button className="!bg-orange-500 hover:!bg-orange-600 text-white text-base font-semibold shadow-md py-6 px-8 rounded-lg transition-all duration-200 transform hover:scale-[1.02]">
                                <Wallet size={20} className="mr-2.5" />
                                Withdraw Funds
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Money In (Lending)</p>
                                <div className="flex items-baseline space-x-3 mt-2">
                                    <span className="text-3xl font-bold text-gray-900">$4,500.00</span>
                                    <span className="inline-flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        +12%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">vs. last month</p>
                            </div>
                            <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                <ArrowUpRight size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Money Out (Labor Costs)</p>
                                <div className="flex items-baseline space-x-3 mt-2">
                                    <span className="text-3xl font-bold text-gray-900">$1,800.00</span>
                                    <span className="inline-flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        0%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">vs. last month</p>
                            </div>
                            <div className="h-12 w-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                                <ArrowRight size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                    <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                            <Filter size={16} className="mr-2" />
                            Filter
                        </Button>
                        <Button variant="ghost" size="sm" className="text-blue-600 font-medium hover:text-blue-800 hover:bg-blue-50">
                            View All
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm border border-gray-200 overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Description</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Type</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Amount</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-center">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 font-medium">{tx.date}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900">{tx.description}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{tx.subtext}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${tx.type === "Incoming"
                                                ? "bg-blue-50 text-blue-700"
                                                : "bg-gray-100 text-gray-600"
                                                }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-extrabold ${tx.type === "Incoming" ? "text-green-600" : "text-gray-900"
                                            }`}>
                                            {tx.amount}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className={`h-2 w-2 rounded-full ${tx.status === "Processing" ? "bg-yellow-400" : "bg-green-500"
                                                    }`}></div>
                                                <span className="font-medium text-gray-700">{tx.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Button variant="ghost" size="sm" className="h-9 w-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                                                <Download size={22} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">Showing 1 to 4 of 128 transactions</p>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Previous</Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs" >Next</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
