"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateWorkerProfileAction } from "./actions";
import { MapPin, Clock } from "lucide-react";
import { AddressInput } from "@/components/ui/address-input";
import { LocationPickerMap } from "@/components/ui/location-picker-map";

import { WorkerProfile } from "@/types";

export function WorkerProfileForm({ initialData }: { initialData?: WorkerProfile }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        travel_radius_miles: initialData?.travel_radius_miles || 50,
        earliest_start_time: initialData?.earliest_start_time || "06:00",
        latest_start_time: initialData?.latest_start_time || "09:00",
        home_zip_code: initialData?.home_zip_code || "",
        lat: initialData?.lat ?? undefined,
        lng: initialData?.lng ?? undefined
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateWorkerProfileAction(formData);
            toast({ title: "Success", description: "Worker profile updated successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                <CardTitle className="text-base font-bold text-gray-900">Work Preferences</CardTitle>
                <p className="text-sm text-gray-500">Set your travel distance and working hour constraints for marketplace matching.</p>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="home_zip_code" className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                    Home Address
                                </Label>
                                <AddressInput
                                    value={formData.home_zip_code}
                                    onChange={(address, components) => setFormData({
                                        ...formData,
                                        home_zip_code: address,
                                        lat: components?.lat,
                                        lng: components?.lng
                                    })}
                                    required
                                />
                            </div>

                            {formData.lat !== undefined && formData.lng !== undefined && (
                                <div className="space-y-2">
                                    <Label>Confirm Pin Location</Label>
                                    <LocationPickerMap
                                        lat={formData.lat}
                                        lng={formData.lng}
                                        onChange={(lat, lng, address) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                lat,
                                                lng,
                                                ...(address ? { home_zip_code: address } : {})
                                            }))
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="travel_radius_miles">Travel Radius (miles)</Label>
                            <Input
                                id="travel_radius_miles"
                                type="number"
                                min="1"
                                max="200"
                                value={formData.travel_radius_miles}
                                onChange={(e) => setFormData({ ...formData, travel_radius_miles: parseInt(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="earliest_start_time" className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                Earliest Start Time
                            </Label>
                            <Input
                                id="earliest_start_time"
                                type="time"
                                value={formData.earliest_start_time}
                                onChange={(e) => setFormData({ ...formData, earliest_start_time: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="latest_start_time" className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                Latest Acceptable Start Time
                            </Label>
                            <Input
                                id="latest_start_time"
                                type="time"
                                value={formData.latest_start_time}
                                onChange={(e) => setFormData({ ...formData, latest_start_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white" disabled={loading}>
                            {loading ? "Saving..." : "Save Preferences"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
