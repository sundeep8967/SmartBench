"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowUpRight,
    ArrowRight,
    Wallet,
    Calendar,
    Download,
    Loader2,
} from "lucide-react";

interface Transaction {
    id: string;
    date: string;
    description: string;
    subtext: string;
    type: "Incoming" | "Outgoing";
    amount: number;
    status: string;
}

export default function FinancialsPage() {
    const { data, isLoading: loading } = useSWR('/api/financials', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // cache for 60s
    });

    const balance: number = data?.balance || 0;
    const moneyIn: number = data?.moneyIn || 0;
    const moneyOut: number = data?.moneyOut || 0;
    const transactions: Transaction[] = data?.transactions || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">Loading financials...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financials &amp; Payments</h1>
                    <p className="text-gray-500 mt-1">Manage your wallet, payouts, and transaction history.</p>
                </div>
                <Button variant="outline" className="text-gray-700 border-gray-300 bg-white shadow-sm">
                    <Download size={16} className="mr-2" />
                    Export Data
                </Button>
            </div>

            {/* Balance Card */}
            <Card className="!bg-blue-900 !text-white shadow-lg border-none overflow-hidden relative">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 h-full">
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Available Balance</p>
                                <div className="flex items-baseline">
                                    <span className="text-5xl font-extrabold tracking-tight">{formatCurrency(balance)}</span>
                                </div>
                            </div>

                            <div className="inline-flex items-center space-x-2 bg-blue-800 border border-blue-700 rounded-lg px-3 py-2 text-sm text-blue-100">
                                <Calendar size={16} className="text-blue-300" />
                                <span>Balance from confirmed bookings</span>
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
                                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(moneyIn)}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">from confirmed bookings</p>
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
                                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(moneyOut)}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">from confirmed bookings</p>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            No transactions yet. Financial data will appear once bookings are confirmed.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-500 font-medium">
                                                {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-900">{tx.description}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{tx.subtext}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${tx.type === "Incoming" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-extrabold ${tx.type === "Incoming" ? "text-green-600" : "text-gray-900"
                                                }`}>
                                                {tx.type === "Incoming" ? "+" : "-"}{formatCurrency(tx.amount / 100)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className={`h-2 w-2 rounded-full ${tx.status === "Completed" ? "bg-green-500" :
                                                        tx.status === "Active" || tx.status === "Confirmed" ? "bg-blue-500" :
                                                            "bg-yellow-400"
                                                        }`}></div>
                                                    <span className="font-medium text-gray-700">{tx.status}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">
                            {transactions.length === 0 ? "No transactions" : `Showing ${transactions.length} transactions`}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
