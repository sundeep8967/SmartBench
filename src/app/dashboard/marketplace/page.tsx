"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { fetcher } from "@/lib/swr-fetcher";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, BadgeCheck, Loader2, Users, Bookmark, Clock, Play, Edit2, Trash2, Save, Shield, MapPin, Star } from "lucide-react";
import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ViewReviewsDialog } from "@/components/workers/view-reviews-dialog";
import { DatePicker } from "@/components/ui/date-picker";

type SavedSearch = {
    id: string;
    name: string;
    search_criteria: any;
    alert_preference: string;
    timezone: string;
    is_active: boolean;
    last_checked_at: string | null;
    created_at: string;
};

interface WorkerData {
    id: string;
    user_id: string;
    trade: string | null;
    skills: string[] | null;
    home_zip_code: string | null;
    photo_url: string | null;
    hourly_rate: number;
    on_time_pct: number | null;
    fulfillment_score: number | null;
    reliable_partner: boolean;
    user: { full_name: string; email: string } | null;
    distance?: number | null;
    average_rating?: string | null;
    review_count?: number;
}


export default function MarketplacePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [selectedTrade, setSelectedTrade] = useState("All");
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const { refreshCart, cartItems } = useCart();
    const { user, companyId } = useAuth();
    const [activeTab, setActiveTab] = useState<"search" | "saved">("search");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("All");
    const [reviewTarget, setReviewTarget] = useState<WorkerData | null>(null);

    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newSearchName, setNewSearchName] = useState("");
    const [alertPref, setAlertPref] = useState("daily");
    const [isSaving, setIsSaving] = useState(false);
    const [shiftHours, setShiftHours] = useState("Any");

    // Booking Date Selection State
    const [workerToBook, setWorkerToBook] = useState<WorkerData | null>(null);
    const [bookingStartDate, setBookingStartDate] = useState<Date>(new Date());
    const [bookingEndDate, setBookingEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));


    // Build SWR key from search params
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set("q", debouncedSearchTerm);
    if (selectedTrade !== "All") params.set("trade", selectedTrade);
    if (selectedProjectId !== "All") params.set("projectId", selectedProjectId);
    if (shiftHours !== "Any") params.set("shift_hours", shiftHours);
    const swrKey = `/api/workers/available?${params.toString()}`;

    const { data: searchData, isLoading: loading } = useSWR(swrKey, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 30000, // cache for 30s
    });

    // Fetch Saved Searches
    const { data: savedSearchesData, mutate: mutateSavedSearches } = useSWR(
        companyId ? `/api/marketplace/saved-searches?companyId=${companyId}` : null,
        fetcher
    );
    const savedSearches: SavedSearch[] = savedSearchesData || [];

    const { data: projectsData } = useSWR(
        companyId ? `/api/projects/list?companyId=${companyId}` : null,
        fetcher
    );
    const companyProjects = projectsData || [];

    const workers: WorkerData[] = searchData?.workers || [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // SWR auto-refetches when searchTerm/selectedTrade change the key
    };

    const handleAddToCartClick = (worker: WorkerData) => {
        setWorkerToBook(worker);
        setBookingStartDate(new Date());
        setBookingEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    };

    const confirmAddToCart = async () => {
        if (!workerToBook || !bookingStartDate || !bookingEndDate) return;
        setAddingToCart(workerToBook.user_id);
        try {
            const payload = {
                worker_id: workerToBook.user_id,
                hourly_rate: workerToBook.hourly_rate,
                start_date: bookingStartDate.toISOString(),
                end_date: bookingEndDate.toISOString(),
            };

            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to add to cart");
            }

            await refreshCart();

            toast({
                title: "Added to cart",
                description: `${workerToBook.user?.full_name} has been added to your cart.`,
                variant: "success",
            });
            setWorkerToBook(null);
        } catch (f) {
            toast({
                title: "Error",
                description: f instanceof Error ? f.message : "Could not add to cart",
                variant: "destructive",
            });
        } finally {
            setAddingToCart(null);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSaveSearch = async () => {
        if (!newSearchName.trim()) {
            toast({ title: "Name required", description: "Please enter a name for your saved search.", variant: "destructive" });
            return;
        }

        if (!companyId) {
            toast({ title: "Error", description: "Company context not loaded.", variant: "destructive" });
            return;
        }

        setIsSaving(true);

        try {
            const criteria = {
                trade: selectedTrade !== "All" ? selectedTrade : null,
                searchTerm: searchTerm || null
            };

            const payload = {
                borrower_company_id: companyId,
                name: newSearchName,
                search_criteria: criteria,
                alert_preference: alertPref === "daily" ? "Daily_Digest" : "Instant"
            };

            const response = await fetch('/api/marketplace/saved-searches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save search');
            }

            await mutateSavedSearches();
            setIsSaveModalOpen(false);
            setNewSearchName("");

            toast({
                title: "Search Saved",
                description: "Your search criteria has been saved. You will receive alerts based on your preferences.",
                variant: "success",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Could not save search",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const trades = ["All", "Electrician", "Plumber", "HVAC Technician", "General Contractor", "Project Manager", "Carpenter"];

    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketplace</h1>
                <p className="text-gray-500">Find and hire top-rated construction professionals, or run your saved queries.</p>
            </div>

            {/* View Reviews Dialog */}
            {reviewTarget && (
                <ViewReviewsDialog
                    open={!!reviewTarget}
                    onOpenChange={(open) => !open && setReviewTarget(null)}
                    workerId={reviewTarget.user_id}
                    workerName={reviewTarget.user?.full_name || "Unknown Worker"}
                />
            )}


            {/* Tabs */}
            <div className="flex border-b border-gray-200 gap-6">
                <button
                    onClick={() => setActiveTab("search")}
                    className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "search" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                    Find Professionals
                </button>
                <button
                    onClick={() => setActiveTab("saved")}
                    className={`pb-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === "saved" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                    <Bookmark size={16} />
                    Saved Searches
                </button>
            </div>

            {activeTab === "search" ? (
                <>
                    {/* Search & Filters */}
                    <Card className="p-4 shadow-sm border-gray-200">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, trade, or skill..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                                <select
                                    value={selectedTrade}
                                    onChange={(e) => setSelectedTrade(e.target.value)}
                                    className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {trades.map((t) => (
                                        <option key={t} value={t}>{t === "All" ? "All Trades" : t}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="All">Filter by Project constraints...</option>
                                    {companyProjects.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={shiftHours}
                                    onChange={(e) => setShiftHours(e.target.value)}
                                    className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="Any">Any Shift Length</option>
                                    <option value="2">2 Hours</option>
                                    <option value="3">3 Hours</option>
                                    <option value="4">4 Hours</option>
                                    <option value="5">5 Hours</option>
                                    <option value="6">6 Hours</option>
                                    <option value="7">7 Hours</option>
                                    <option value="8">8 Hours</option>
                                </select>

                                <div className="flex space-x-2">
                                    <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white flex-1 h-auto py-2.5">
                                        Search
                                    </Button>

                                    <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 h-auto py-2.5 px-3 flex items-center gap-2">
                                                <Save size={18} />
                                                <span>Save Search</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Save Search Criteria</DialogTitle>
                                                <DialogDescription>
                                                    Save these filters to quickly run the search later and receive automated alerts for new matching workers.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="search-name">Search Name *</Label>
                                                    <Input
                                                        id="search-name"
                                                        placeholder="e.g., Austin Electricians"
                                                        value={newSearchName}
                                                        onChange={(e) => setNewSearchName(e.target.value)}
                                                    />
                                                </div>

                                                <div className="grid gap-2 pt-2">
                                                    <Label className="text-sm font-semibold text-gray-900 border-b pb-1">Alert Preferences</Label>
                                                    <RadioGroup value={alertPref} onValueChange={setAlertPref} className="gap-0">
                                                        <div className="flex items-center space-x-2 py-2">
                                                            <RadioGroupItem value="instant" id="alert-instant" />
                                                            <Label htmlFor="alert-instant" className="font-normal cursor-pointer text-gray-700">Instant Alerts (Immediately on match)</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2 py-2">
                                                            <RadioGroupItem value="daily" id="alert-daily" />
                                                            <Label htmlFor="alert-daily" className="font-normal cursor-pointer text-gray-700">Daily Digest (Once daily at 5:00 AM)</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsSaveModalOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button type="button" onClick={handleSaveSearch} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                                                    {isSaving ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        "Save Search"
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </form>
                    </Card>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            <span className="ml-3 text-gray-500">Loading workers...</span>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && workers.length === 0 && (
                        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed">
                            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 mb-2">No workers found matching your criteria.</p>
                            <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
                        </div>
                    )}

                    {/* Worker Grid */}
                    {!loading && workers.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {workers.map((worker) => {
                                const name = worker.user?.full_name || "Unknown Worker";
                                const initials = getInitials(name);
                                const skills = Array.isArray(worker.skills) ? worker.skills : [];
                                const isInCart = cartItems.some((item) => item.worker_id === worker.user_id);

                                return (
                                    <Card key={worker.id} className="p-5 shadow-sm border-gray-200 hover:shadow-md transition-shadow relative group">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm border border-gray-100 overflow-hidden shrink-0">
                                                    {worker.photo_url ? (
                                                        <img src={worker.photo_url} alt={name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        initials
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center">
                                                        <h3 className="font-bold text-gray-900 mr-2 group-hover:text-blue-900 transition-colors">{name}</h3>
                                                        <BadgeCheck size={16} className="text-green-500 fill-green-100" />

                                                        {worker.review_count ? (
                                                            <button
                                                                onClick={() => setReviewTarget(worker)}
                                                                className="ml-3 flex items-center gap-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-1.5 py-0.5 rounded text-xs font-bold transition-colors border border-yellow-200"
                                                                title="View Reviews"
                                                            >
                                                                <Star size={12} className="fill-yellow-500 text-yellow-500" />
                                                                {worker.average_rating} <span className="text-yellow-600/70 font-medium">({worker.review_count})</span>
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                                        <span>{worker.trade || "General"}</span>
                                                        {worker.distance != null && (
                                                            <>
                                                                <span className="mx-1.5 text-gray-300">•</span>
                                                                <span className="flex items-center text-gray-600">
                                                                    <MapPin size={12} className="mr-0.5" />
                                                                    {worker.distance} {worker.distance === 1 ? 'mile' : 'miles'} away
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* On-Time Reliability Badge (PRD Story 3.1) */}
                                            {(() => {
                                                const pct = (worker as any).on_time_pct;
                                                if (pct === null || pct === undefined) {
                                                    return (
                                                        <div className="flex items-center bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-400 font-medium text-xs gap-1" title="On-Time Reliability: No shift data yet">
                                                            <Clock size={11} />
                                                            New
                                                        </div>
                                                    );
                                                }
                                                const pctNum = Math.round(pct);
                                                const colorClass = pctNum >= 90
                                                    ? "bg-green-50 border-green-200 text-green-700"
                                                    : pctNum >= 75
                                                        ? "bg-amber-50 border-amber-200 text-amber-700"
                                                        : "bg-red-50 border-red-200 text-red-700";
                                                return (
                                                    <div
                                                        className={`flex items-center border px-2 py-0.5 rounded font-bold text-xs gap-1 ${colorClass}`}
                                                        title={`On-Time Reliability: ${pctNum}% of clock-ins within 5 min of scheduled start`}
                                                    >
                                                        <Clock size={11} className="shrink-0" />
                                                        {pctNum}%
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Skills */}
                                        <div className="flex flex-wrap gap-2 mt-4 mb-4">
                                            {skills.slice(0, 4).map((skill) => (
                                                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
                                                    {skill}
                                                </span>
                                            ))}
                                            {skills.length > 4 && (
                                                <span className="px-2 py-1 text-gray-400 text-xs">+{skills.length - 4} more</span>
                                            )}
                                        </div>

                                        {/* Lender Company Metrics (PRD Story 3.1) */}
                                        {worker.fulfillment_score !== null && (
                                            <div className="flex items-center gap-3 mb-6 mt-2">
                                                {worker.reliable_partner && (
                                                    <div
                                                        className="flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded font-bold text-xs gap-1 shadow-sm"
                                                        title="Top-tier lender with >95% fulfillment score"
                                                    >
                                                        <Shield size={12} className="fill-current" />
                                                        Reliable Partner
                                                    </div>
                                                )}
                                                <div
                                                    className="text-xs text-gray-600 flex items-center bg-gray-50 border border-gray-200 px-2 py-1 rounded"
                                                    title="Percentage of confirmed bookings successfully fulfilled without lender cancellation"
                                                >
                                                    Fulfillment: <span className="font-semibold text-gray-900 ml-1">{Math.round(worker.fulfillment_score)}%</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div>
                                                <span className="text-xl font-bold text-gray-900">${(worker.hourly_rate * 1.30).toFixed(2)}</span>
                                                <span className="text-xs text-gray-500">/hr</span>
                                                <p className="text-[10px] text-gray-400 font-medium">All-inclusive rate</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-blue-900 border-blue-200 hover:bg-blue-50 cursor-pointer"
                                                onClick={() => handleAddToCartClick(worker)}
                                                disabled={addingToCart === worker.user_id || isInCart}
                                            >
                                                {addingToCart === worker.user_id ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Adding...
                                                    </>
                                                ) : isInCart ? (
                                                    <>
                                                        <BadgeCheck className="mr-2 h-4 w-4" />
                                                        Added
                                                    </>
                                                ) : (
                                                    "Add to Cart"
                                                )}
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                /* Saved Searches Tab Content */
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Your Saved Searches</h2>
                            <p className="text-sm text-gray-500 mt-1">Quickly access your frequently used filters and queries.</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {savedSearches.map((search) => (
                            <Card key={search.id} className="shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className={`p-3 rounded-lg ${search.search_criteria?.trade ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                                            }`}>
                                            <Bookmark size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                {search.name}
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                                                    {search.search_criteria?.trade ? "Employee" : "General"}
                                                </span>
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {search.search_criteria?.trade ? `Role: ${search.search_criteria.trade}` : "All Trades"}
                                                {search.search_criteria?.searchTerm ? ` • Query: ${search.search_criteria.searchTerm}` : ""}
                                            </p>
                                            <div className="flex items-center text-xs text-gray-400 mt-2 space-x-4">
                                                <span className="flex items-center">
                                                    <Clock size={12} className="mr-1" /> Created: {new Date(search.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="font-medium text-gray-500">
                                                    {search.alert_preference === 'Daily_Digest' ? 'Daily Alerts' : 'Instant Alerts'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                                        <Button
                                            size="sm"
                                            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                                            onClick={() => {
                                                const role = search.search_criteria?.trade || "";
                                                setSearchTerm(role);
                                                setActiveTab("search");
                                            }}
                                        >
                                            <Play size={14} className="mr-2 text-green-600" /> Run Search
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-blue-600">
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            {/* Booking Date Selection Modal */}
            <Dialog open={!!workerToBook} onOpenChange={(open) => !open && setWorkerToBook(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Booking Dates</DialogTitle>
                        <DialogDescription>
                            Please select the expected start and end dates for {workerToBook?.user?.full_name}.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <DatePicker 
                                value={bookingStartDate} 
                                onChange={(date) => date && setBookingStartDate(date)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <DatePicker 
                                value={bookingEndDate} 
                                onChange={(date) => date && setBookingEndDate(date)} 
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWorkerToBook(null)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmAddToCart} disabled={!!addingToCart}>
                            {addingToCart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm & Add to Cart
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
