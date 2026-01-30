"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Download,
    Filter,
    CreditCard,
    Wallet,
    FileText
} from "lucide-react";

const transactions = [
    { id: 1, date: "Nov 14, 2023", description: "Stripe Payout #PY-9822", subtext: "Automated Weekly Payout", type: "Incoming", amount: "+$12,450.00", status: "Processing" },
    { id: 2, date: "Nov 12, 2023", description: "Payout for Booking #BK-0024", subtext: "Labor Costs - Mike Ross", type: "Outgoing", amount: "-$1,800.00", status: "Settled" },
    { id: 3, date: "Nov 07, 2023", description: "Monthly Subscription", subtext: "SmartBench Pro Plan", type: "Outgoing", amount: "-$49.00", status: "Settled" },
    { id: 4, date: "Nov 05, 2023", description: "Deposit from Project A", subtext: "Initial retainer", type: "Incoming", amount: "+$5,000.00", status: "Settled" },
];

export default function FinancialsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">Dashboard → Financials</div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financials & Payments</h1>
                    <p className="text-gray-500">Manage your wallet, payouts, and transaction history.</p>
                </div>
                <Button variant="outline" className="text-gray-700 border-gray-300">
                    <Download size={16} className="mr-2" />
                    Export Data
                </Button>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-md border-0">
                <CardContent className="pt-8 pb-8 px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-200 font-medium uppercase tracking-wider mb-2">Available Balance</p>
                            <div className="flex items-baseline">
                                <span className="text-5xl font-bold tracking-tight">$12,450.00</span>
                                <span className="ml-2 text-blue-200 text-sm">USD</span>
                            </div>
                            <div className="mt-4 flex items-center space-x-2 text-sm text-blue-100 bg-blue-800/50 w-fit px-3 py-1.5 rounded-lg border border-blue-700">
                                <CreditCard size={14} />
                                <span>Next payout scheduled for <span className="font-semibold text-white">Nov 15, 2023</span></span>
                            </div>
                        </div>
                        <div className="mt-6 md:mt-0">
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm h-12 px-6">
                                Withdraw Funds
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Income (This Month)</p>
                                <div className="flex items-baseline space-x-2">
                                    <h3 className="text-2xl font-bold text-gray-900">$4,500.00</h3>
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center">
                                        <ArrowUpRight size={10} className="mr-0.5" /> 12%
                                    </span>
                                </div>
                            </div>
                            <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                <ArrowUpRight size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Expenses (This Month)</p>
                                <div className="flex items-baseline space-x-2">
                                    <h3 className="text-2xl font-bold text-gray-900">$1,800.00</h3>
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center">
                                        <ArrowDownLeft size={10} className="mr-0.5" /> 5%
                                    </span>
                                </div>
                            </div>
                            <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                                <ArrowDownLeft size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions Table */}
            <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardHeader className="border-b border-gray-100 bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-gray-900">Recent Transactions</CardTitle>
                        <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                <Filter size={16} className="mr-2" />
                                Filter
                            </Button>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                View All
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-500">{tx.date}</td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">{tx.description}</p>
                                            <p className="text-xs text-gray-500">{tx.subtext}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.type === "Incoming" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                                            }`}>
                                            {tx.type === "Incoming" ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownLeft size={12} className="mr-1" />}
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${tx.type === "Incoming" ? "text-green-600" : "text-gray-900"
                                        }`}>
                                        {tx.amount}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === "Processing"
                                                ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                                : "bg-green-50 text-green-700 border border-green-100"
                                            }`}>
                                            {tx.status === "Processing" && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>}
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                                            <FileText size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
