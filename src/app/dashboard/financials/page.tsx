"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock transaction data
const transactions = [
    {
        id: 1,
        date: "Nov 14, 2023",
        description: "Stripe Payout #PY-9822",
        subtext: "Automated Weekly Payout",
        type: "Incoming",
        amount: "+$12,450.00",
        status: "Processing",
    },
    {
        id: 2,
        date: "Nov 12, 2023",
        description: "Payout for Booking #BK-0024",
        subtext: "Labor Costs - Mike Ross",
        type: "Outgoing",
        amount: "-$1,800.00",
        status: "Settled",
    },
    {
        id: 3,
        date: "Nov 07, 2023",
        description: "Monthly Subscription",
        subtext: "SmartBench Pro Plan",
        type: "Outgoing",
        amount: "-$49.00",
        status: "Settled",
    },
];

export default function FinancialsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">Dashboard → Financials → Overview</div>
                    <h1 className="text-2xl font-bold text-gray-900">Financials & Payments</h1>
                    <p className="text-gray-500">Manage your wallet, payouts, and transaction history.</p>
                </div>
                <Button variant="outline">📊 Export Data</Button>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-100 uppercase tracking-wider">Available Balance</p>
                            <p className="text-4xl font-bold mt-1">$12,450.00</p>
                            <p className="text-sm text-blue-200 mt-2">
                                💳 Next payout scheduled for Nov 15, 2023
                            </p>
                        </div>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                            Withdraw Funds
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Money In/Out Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Money In (Lending)</p>
                                <p className="text-2xl font-bold text-gray-900">$4,500.00 <span className="text-green-500 text-sm font-normal">+12%</span></p>
                                <p className="text-xs text-gray-400">vs. last week</p>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <span className="text-green-600">↗</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Money Out (Labor Costs)</p>
                                <p className="text-2xl font-bold text-gray-900">$1,800.00 <span className="text-red-500 text-sm font-normal">-5%</span></p>
                                <p className="text-xs text-gray-400">vs. last week</p>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <span className="text-red-600">↙</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent Transactions</CardTitle>
                        <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">🔍 Filter</Button>
                            <Button variant="ghost" size="sm">View All</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="pb-3">Date</th>
                                <th className="pb-3">Description</th>
                                <th className="pb-3">Type</th>
                                <th className="pb-3">Amount</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td className="py-4 text-sm text-gray-500">{tx.date}</td>
                                    <td className="py-4">
                                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                                        <p className="text-xs text-gray-500">{tx.subtext}</p>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${tx.type === "Incoming"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-700"
                                            }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className={`py-4 text-sm font-medium ${tx.amount.startsWith("+") ? "text-green-600" : "text-gray-900"
                                        }`}>
                                        {tx.amount}
                                    </td>
                                    <td className="py-4">
                                        <span className={`text-xs ${tx.status === "Processing" ? "text-yellow-600" : "text-gray-500"
                                            }`}>
                                            {tx.status === "Processing" && "● "}
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <Button variant="ghost" size="sm">📄</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">Showing 3 of 128 transactions</p>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
