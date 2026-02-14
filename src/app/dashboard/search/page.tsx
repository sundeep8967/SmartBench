"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Search, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

interface Worker {
    id: string; // Worker Profile ID
    user_id: string;
    trade: string;
    skills: string[]; // parsed from JSON
    user: {
        full_name: string;
        email: string;
    };
    hourly_rate: number;
    distance_miles: number;
}

export default function WorkerSearchPage() {
    const searchParams = useSearchParams();
    const workOrderId = searchParams.get('workOrderId');
    const projectId = searchParams.get('projectId');
    const router = useRouter();
    const { toast } = useToast();

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await fetch("/api/workers/available");
            if (res.ok) {
                const data = await res.json();
                setWorkers(data);
            }
        } catch (error) {
            console.error("Failed to fetch workers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (worker: Worker) => {
        if (!workOrderId) {
            toast({ title: "Error", description: "No Work Order selected. Start from a Project page.", variant: "destructive" });
            return;
        }

        setAddingToCart(worker.id);
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    work_order_id: workOrderId,
                    worker_id: worker.user_id, // Use User ID for booking
                    hourly_rate: worker.hourly_rate,
                    start_date: new Date().toISOString(), // Mock dates for now
                    end_date: new Date(Date.now() + 86400000 * 5).toISOString() // +5 days
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast({ title: "Success", description: "Worker added to cart." });
            if (projectId) {
                // Optional: Redirect back or stay to add more
                // router.push(`/dashboard/projects/${projectId}`);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setAddingToCart(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Find Workers</h1>
                    <p className="text-muted-foreground">
                        {workOrderId ? "Select workers to fulfill your work order." : "Browse available talent."}
                    </p>
                </div>
                {projectId && (
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/cart">View Cart</Link>
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
                            Back to Project
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search by trade, skill, or name..." className="pl-8" />
                </div>
                <Button>Search</Button>
            </div>

            {loading ? (
                <div>Loading workers...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((worker) => (
                        <Card key={worker.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50 pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {worker.user.full_name ? worker.user.full_name[0] : 'U'}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{worker.user.full_name}</CardTitle>
                                            <div className="text-sm text-muted-foreground flex items-center">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {worker.distance_miles} miles away
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">${worker.hourly_rate}/hr</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm font-medium mb-1 flex items-center">
                                            <Briefcase className="h-3 w-3 mr-1" />
                                            {worker.trade}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {/* Skills are JSONB, might come as string or array depending on Supabase client */}
                                            {Array.isArray(worker.skills) ? worker.skills.map(s => (
                                                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                                            )) : (
                                                <span className="text-xs text-muted-foreground">No specific skills listed</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/10">
                                <Button
                                    className="w-full"
                                    onClick={() => handleAddToCart(worker)}
                                    disabled={!!addingToCart}
                                >
                                    {addingToCart === worker.id ? "Adding..." : "Add to Cart"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
