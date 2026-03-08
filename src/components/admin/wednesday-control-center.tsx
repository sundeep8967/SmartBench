"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Activity, Loader2, PauseCircle, PlayCircle, ShieldAlert } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function WednesdayControlCenter() {
    const { data: metricsData, error: metricsError, mutate: mutateMetrics } = useSWR('/api/admin/wednesday-monitoring', fetcher, {
        refreshInterval: 15000 // Refresh every 15s to monitor the situation
    });

    const { data: settingsData, error: settingsError, mutate: mutateSettings } = useSWR('/api/admin/system-settings?key=pause_wednesday_cutoff', fetcher);

    const [isUpdating, setIsUpdating] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const isPaused = settingsData?.value === 'true' || settingsData?.value === true;
    const metrics = metricsData?.metrics || { totalScheduled: 0, successfulCharges: 0, unpaidBookings: 0 };
    const timezones = metricsData?.timezones || [];

    const handleTogglePause = async () => {
        setIsUpdating(true);
        try {
            const newValue = !isPaused;

            const res = await fetch('/api/admin/system-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'pause_wednesday_cutoff', value: newValue.toString() })
            });

            if (!res.ok) throw new Error('Failed to update setting');

            await mutateSettings();
            setShowConfirmDialog(false);
        } catch (error) {
            console.error(error);
            alert("Failed to toggle setting. Check console.");
        } finally {
            setIsUpdating(false);
        }
    };

    const criticalUnpaidThreshold = 10; // Trigger alert if more than 10 unpaid active bookings
    const isCritical = metrics.unpaidBookings > criticalUnpaidThreshold;

    if (metricsError || settingsError) {
        return (
            <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <h3 className="font-semibold flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Failed to load Wednesday Control Center
                </h3>
                <p className="text-sm">Please refresh the page or check your connection.</p>
            </div>
        );
    }

    if (!metricsData || !settingsData) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center">
                        <Activity className="w-6 h-6 mr-2 text-blue-600" />
                        Wednesday Traffic Control Center
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Monitor weekly progress payments and manage automated worker release hard cutoffs.
                    </p>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg border ${isPaused ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <div className="text-sm">
                        <div className="font-medium text-slate-900">Hard Cutoff Status</div>
                        <div className={`text-xs ${isPaused ? 'text-amber-700 font-semibold' : 'text-emerald-600'}`}>
                            {isPaused ? 'PAUSED (MANUAL OVERRIDE)' : 'ACTIVE (AUTOMATED)'}
                        </div>
                    </div>
                    <button
                        onClick={() => isPaused ? handleTogglePause() : setShowConfirmDialog(true)}
                        disabled={isUpdating}
                        className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center transition-colors ${isPaused
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isPaused ? <PlayCircle className="w-4 h-4 mr-2" /> : <PauseCircle className="w-4 h-4 mr-2" />}
                        {isPaused ? 'Resume Automation' : 'Pause Cutoff'}
                    </button>
                </div>
            </div>

            {isCritical && !isPaused && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                    <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-red-800">High Unpaid Booking Volume Detected</h4>
                        <p className="text-sm text-red-700 mt-1">
                            There are {metrics.unpaidBookings} active bookings that have not been funded for next week. If the Stripe gateway is experiencing an outage, consider pausing the Hard Cutoff to prevent automated worker releases tonight at 11:59PM.
                        </p>
                    </div>
                </div>
            )}

            {isPaused && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-amber-800">Automated Worker Release is PAUSED</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            The 11:59PM Wednesday hard cutoff is currently suspended. Unpaid bookings will remain Active and workers will not be automatically released. Remember to resume automation once the gateway outage or failure is resolved.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium mb-1">Total Scheduled (Active)</div>
                    <div className="text-3xl font-bold text-slate-900">{metrics.totalScheduled}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium mb-1 flex items-center">
                        Successful Charges
                    </div>
                    <div className="text-3xl font-bold text-emerald-600">{metrics.successfulCharges}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium mb-1">Unpaid for Next Week</div>
                    <div className={`text-3xl font-bold ${metrics.unpaidBookings > 0 ? 'text-red-600' : 'text-slate-900'}`}>{metrics.unpaidBookings}</div>
                </div>
            </div>

            {/* Timezone breakdown */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex justify-between items-center">
                    <h3 className="font-medium text-slate-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-slate-500" />
                        Project Timezone Breakdown
                    </h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {timezones.length === 0 ? (
                        <div className="p-5 text-center text-slate-500 text-sm">No active long-term bookings found.</div>
                    ) : (
                        timezones.map((tz: any) => (
                            <div key={tz.timezone} className="px-5 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${tz.inWindow ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`} />
                                    <div>
                                        <div className="font-medium text-slate-900">{tz.timezone}</div>
                                        <div className="text-xs text-slate-500 flex items-center">
                                            {tz.inWindow ? (
                                                <span className="text-amber-600 font-medium">Inside 10AM-11:59PM Window</span>
                                            ) : (
                                                <span>Outside active window</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex text-sm">
                                    <div className="px-4 text-center">
                                        <div className="text-slate-500 text-xs">Active</div>
                                        <div className="font-semibold text-slate-900">{tz.active}</div>
                                    </div>
                                    <div className="px-4 text-center border-l border-slate-200">
                                        <div className="text-slate-500 text-xs">Unpaid</div>
                                        <div className={`font-semibold ${tz.unpaid > 0 ? 'text-red-600' : 'text-slate-900'}`}>{tz.unpaid}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <ShieldAlert className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Pause Hard Cutoff?</h3>
                        </div>

                        <p className="text-sm text-slate-600 mb-6">
                            You are about to pause the automated worker release sequence.
                            <br /><br />
                            Normally, workers on bookings with unpaid progression payments are automatically released at 11:59PM on Wednesday in their local project timezone.
                            <br /><br />
                            <strong>Only do this if:</strong>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Stripe is experiencing a known outage</li>
                                <li>There is a critical platform-wide bug preventing payments</li>
                            </ul>
                        </p>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="px-4 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                disabled={isUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTogglePause}
                                disabled={isUpdating}
                                className="px-4 py-2 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center"
                            >
                                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Confirm Pause
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
