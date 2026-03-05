"use client";

import { useState } from "react";
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
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
    const { toast } = useToast();
    const [withdrawing, setWithdrawing] = useState(false);

    const { data, isLoading: loading } = useSWR('/api/financials', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    // Real-time Stripe balance from connected account
    const { data: stripeBalance, isLoading: balanceLoading, mutate: mutateBalance } = useSWR(
        '/api/stripe/withdraw',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30000 }
    );

    const moneyIn: number = data?.moneyIn || 0;
    const moneyOut: number = data?.moneyOut || 0;
    const transactions: Transaction[] = data?.transactions || [];

    const availableCents: number = stripeBalance?.available_cents || 0;
    const pendingCents: number = stripeBalance?.pending_cents || 0;
    const hasStripe: boolean = stripeBalance?.has_stripe || false;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

    const handleWithdraw = async () => {
        if (availableCents <= 0) {
            toast({ title: "No funds available", description: "Your available balance is $0.00.", variant: "destructive" });
            return;
        }
        if (!hasStripe) {
            toast({ title: "Stripe not connected", description: "Please complete Stripe onboarding in Settings → Banking & Payouts.", variant: "destructive" });
            return;
        }

        setWithdrawing(true);
        try {
            const res = await fetch("/api/stripe/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}), // withdraw all available
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Withdrawal failed");

            const arrivalDate = result.estimated_arrival
                ? new Date(result.estimated_arrival * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "1-2 business days";

            toast({
                title: `✅ Withdrawal Initiated — ${formatCurrency(result.amount_cents / 100)}`,
                description: `Funds will arrive by ${arrivalDate}. Transfer ID: ${result.payout_id}`,
            });
            await mutateBalance();
        } catch (err: any) {
            toast({ title: "Withdrawal Failed", description: err.message, variant: "destructive" });
        }
        setWithdrawing(false);
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financials & Payments</h1>
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
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">
                                    Stripe Available Balance
                                </p>
                                <div className="flex items-baseline gap-3">
                                    {balanceLoading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-300" />
                                    ) : (
                                        <span className="text-5xl font-extrabold tracking-tight">
                                            {formatCurrency(availableCents / 100)}
                                        </span>
                                    )}
                                </div>
                                {pendingCents > 0 && (
                                    <p className="text-sm text-blue-300 mt-1 flex items-center gap-1.5">
                                        <Clock size={13} /> {formatCurrency(pendingCents / 100)} pending (in transit)
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {hasStripe ? (
                                    <span className="inline-flex items-center text-xs font-medium text-green-300 bg-green-900/30 px-2.5 py-1 rounded-full border border-green-700/40">
                                        <CheckCircle size={11} className="mr-1.5" /> Stripe Connected
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-xs font-medium text-yellow-300 bg-yellow-900/30 px-2.5 py-1 rounded-full border border-yellow-700/40">
                                        <AlertCircle size={11} className="mr-1.5" /> Stripe Not Connected
                                    </span>
                                )}
                                <span className="inline-flex items-center text-xs text-blue-200 bg-blue-800 border border-blue-700 rounded-lg px-2.5 py-1">
                                    <Calendar size={12} className="mr-1.5 text-blue-300" /> From verified timesheets
                                </span>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button
                                className="!bg-orange-500 hover:!bg-orange-600 text-white text-base font-semibold shadow-md py-6 px-8 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
                                onClick={handleWithdraw}
                                disabled={withdrawing || availableCents <= 0 || !hasStripe}
                            >
                                {withdrawing ? (
                                    <><Loader2 size={20} className="mr-2.5 animate-spin" /> Processing...</>
                                ) : (
                                    <><Wallet size={20} className="mr-2.5" /> Withdraw Funds</>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
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

                {pendingCents > 0 && (
                    <Card className="shadow-sm border border-orange-100 bg-orange-50 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-700">Pending Payout</p>
                                    <div className="flex items-baseline space-x-3 mt-2">
                                        <span className="text-3xl font-bold text-orange-800">{formatCurrency(pendingCents / 100)}</span>
                                    </div>
                                    <p className="text-xs text-orange-500 mt-1">arriving in 1-2 business days</p>
                                </div>
                                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                                    <Clock size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${tx.type === "Incoming" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-extrabold ${tx.type === "Incoming" ? "text-green-600" : "text-gray-900"}`}>
                                                {tx.type === "Incoming" ? "+" : "-"}{formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className={`h-2 w-2 rounded-full ${tx.status === "Completed" ? "bg-green-500" :
                                                        tx.status === "Active" || tx.status === "Confirmed" ? "bg-blue-500" :
                                                            "bg-yellow-400"
                                                        }`} />
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
