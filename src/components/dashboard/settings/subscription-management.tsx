'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, CreditCard, Calendar, Zap, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SubscriptionData {
    status: string;
    plan: string | null;
    periodEnd: string | null;
    trialEndsAt: string | null;
    isActive: boolean;
    daysUntilExpiry: number | null;
}

export function SubscriptionManagement() {
    const [subData, setSubData] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/stripe/status');
                if (res.ok) {
                    const data = await res.json();
                    setSubData({
                        status: data.subscription_status || 'trial',
                        plan: data.subscription_plan || null,
                        periodEnd: data.subscription_current_period_end || null,
                        trialEndsAt: data.trial_ends_at || null,
                        isActive: data.subscription_status === 'active' || data.subscription_status === 'trial',
                        daysUntilExpiry: data.days_until_expiry || null,
                    });
                }
            } catch { /* silent */ }
            setLoading(false);
        };
        fetchStatus();
    }, []);

    const handleSubscribe = async (plan: 'monthly' | 'annual') => {
        setCheckoutLoading(plan);
        try {
            const res = await fetch('/api/stripe/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();

            if (data.alreadyActive) {
                toast({ title: 'Already Subscribed', description: 'You already have an active subscription.' });
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to create checkout session');
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setCheckoutLoading(null);
        }
    };

    const handleManagePortal = async () => {
        setPortalLoading(true);
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else throw new Error(data.error || 'Failed to open billing portal');
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setPortalLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string }> = {
            active: { label: '✓ Active', className: 'bg-green-50 text-green-700 border-green-200' },
            trial: { label: '⏳ Free Trial', className: 'bg-blue-50 text-blue-700 border-blue-200' },
            past_due: { label: '⚠ Past Due', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            canceled: { label: '✕ Canceled', className: 'bg-red-50 text-red-700 border-red-200' },
            none: { label: 'No Subscription', className: 'bg-gray-100 text-gray-600 border-gray-200' },
        };
        const c = config[status] || config.none;
        return <Badge className={`text-xs border font-medium ${c.className}`}>{c.label}</Badge>;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500 text-sm">Loading subscription...</span>
            </div>
        );
    }

    const isActiveSub = subData?.status === 'active';
    const expiresDateStr = isActiveSub ? formatDate(subData?.periodEnd || null) : formatDate(subData?.trialEndsAt || null);
    const showExpiryWarning = subData?.daysUntilExpiry !== null && (subData?.daysUntilExpiry ?? 0) <= 7 && (subData?.daysUntilExpiry ?? 0) >= 0;

    return (
        <div className="space-y-6">
            {/* Current Status Card */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-gray-900">Subscription Status</CardTitle>
                            <p className="text-sm text-gray-500 mt-0.5">Manage your SmartBench platform subscription</p>
                        </div>
                        {subData && getStatusBadge(subData.status)}
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {showExpiryWarning && (
                        <div className="mb-5 flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertTriangle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-yellow-800">
                                {isActiveSub
                                    ? `Your subscription renews in ${subData?.daysUntilExpiry} day${subData?.daysUntilExpiry !== 1 ? 's' : ''} on ${expiresDateStr}.`
                                    : `Your free trial expires in ${subData?.daysUntilExpiry} day${subData?.daysUntilExpiry !== 1 ? 's' : ''} on ${expiresDateStr}. Subscribe to keep booking workers.`
                                }
                            </p>
                        </div>
                    )}

                    {isActiveSub ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                    <p className="text-xs text-green-600 font-medium uppercase mb-1">Plan</p>
                                    <p className="font-bold text-gray-900 capitalize">{subData?.plan || 'Active'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {subData?.plan === 'monthly' ? '$30 / month' : subData?.plan === 'annual' ? '$300 / year' : '—'}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Next Renewal</p>
                                    <p className="font-bold text-gray-900">{expiresDateStr}</p>
                                    <p className="text-xs text-gray-500 mt-1">Auto-renews via Stripe</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <CheckCircle size={14} className="text-green-500" />
                                <span className="text-sm text-gray-700">Worker bookings unlocked</span>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleManagePortal}
                                disabled={portalLoading}
                                className="w-full border-gray-300"
                            >
                                {portalLoading
                                    ? <><Loader2 size={14} className="mr-2 animate-spin" /> Opening Portal...</>
                                    : <><ExternalLink size={14} className="mr-2" /> Manage Billing & Cancel</>
                                }
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {subData?.status === 'trial' && (
                                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <Zap size={14} className="text-blue-600 shrink-0" />
                                    <p className="text-sm text-blue-800">
                                        Free trial active — expires <strong>{expiresDateStr}</strong>. Subscribe to continue after trial ends.
                                    </p>
                                </div>
                            )}
                            {subData?.status === 'past_due' && (
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <AlertTriangle size={14} className="text-yellow-600 shrink-0" />
                                    <p className="text-sm text-yellow-800">Payment failed. Update your payment method to restore booking access.</p>
                                </div>
                            )}
                            {subData?.status === 'canceled' && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <AlertTriangle size={14} className="text-red-600 shrink-0" />
                                    <p className="text-sm text-red-800">Subscription canceled. New bookings are blocked. Resubscribe to continue.</p>
                                </div>
                            )}

                            {(subData?.status === 'past_due') && (
                                <Button variant="outline" onClick={handleManagePortal} disabled={portalLoading} className="w-full">
                                    {portalLoading ? 'Opening...' : 'Update Payment Method'}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Plans Card — show when not active OR on trials to encourage upgrade */}
            {!isActiveSub && (
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                        <CardTitle className="text-base font-bold text-gray-900">Choose a Plan</CardTitle>
                        <p className="text-sm text-gray-500">Booking workers requires an active subscription.</p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Monthly */}
                            <div className="relative p-5 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard size={16} className="text-gray-500" />
                                    <span className="font-semibold text-gray-900">Monthly</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">$30 <span className="text-base font-normal text-gray-500">/ month</span></p>
                                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-500" /> Unlimited worker bookings</li>
                                    <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-500" /> Cancel anytime</li>
                                    <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-500" /> Auto-renewal</li>
                                </ul>
                                <Button
                                    className="w-full mt-5 bg-blue-900 hover:bg-blue-800 text-white"
                                    disabled={!!checkoutLoading}
                                    onClick={() => handleSubscribe('monthly')}
                                >
                                    {checkoutLoading === 'monthly'
                                        ? <><Loader2 size={14} className="mr-2 animate-spin" /> Redirecting...</>
                                        : 'Subscribe Monthly'
                                    }
                                </Button>
                            </div>

                            {/* Annual */}
                            <div className="relative p-5 rounded-xl border-2 border-blue-600 bg-blue-50/40">
                                <div className="absolute top-3 right-3">
                                    <Badge className="bg-blue-600 text-white text-xs">Save $60/yr</Badge>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar size={16} className="text-blue-600" />
                                    <span className="font-semibold text-gray-900">Annual</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">$300 <span className="text-base font-normal text-gray-500">/ year</span></p>
                                <p className="text-xs text-blue-600 mt-0.5">$25/month — best value</p>
                                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-500" /> Everything in Monthly</li>
                                    <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-500" /> 2 months free</li>
                                    <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-500" /> Priority support</li>
                                </ul>
                                <Button
                                    className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={!!checkoutLoading}
                                    onClick={() => handleSubscribe('annual')}
                                >
                                    {checkoutLoading === 'annual'
                                        ? <><Loader2 size={14} className="mr-2 animate-spin" /> Redirecting...</>
                                        : 'Subscribe Annually'
                                    }
                                </Button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 text-center mt-4">
                            Secure payments powered by Stripe. Cancel anytime from the billing portal.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
