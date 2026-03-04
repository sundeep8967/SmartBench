"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateWorkerProfileAction } from "./actions";
import { MapPin, Clock } from "lucide-react";
import { LocationPickerMap } from "@/components/ui/location-picker-map";
import { WorkerProfile } from "@/types";
import { AddressInput } from "@/components/ui/address-input";
import tzlookup from "tz-lookup";

export interface ExtendedWorkerProfile extends WorkerProfile {
    home_city?: string;
    home_state?: string;
    home_timezone?: string;
}

export function WorkerProfileForm({ initialData }: { initialData?: ExtendedWorkerProfile }) {
    const [loading, setLoading] = useState(false);
    const [isPinMoved, setIsPinMoved] = useState(false);
    const [isPinConfirmed, setIsPinConfirmed] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        travel_radius_miles: initialData?.travel_radius_miles || 50,
        earliest_start_time: initialData?.earliest_start_time || "06:00",
        latest_start_time: initialData?.latest_start_time || "09:00",
        home_zip_code: initialData?.home_zip_code || "",
        city: initialData?.home_city || "",
        state: initialData?.home_state || "",
        timezone: initialData?.home_timezone || "America/Chicago",
        lat: initialData?.lat ?? undefined,
        lng: initialData?.lng ?? undefined
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateWorkerProfileAction({
                ...formData,
                home_city: formData.city,
                home_state: formData.state,
                home_timezone: formData.timezone,
            });
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
                                    onChange={(address, components) => {
                                        setIsPinMoved(false);
                                        setIsPinConfirmed(false);
                                        setFormData({
                                            ...formData,
                                            home_zip_code: components?.zipCode || address, // Keep zip in the main column
                                            city: components?.city || "",
                                            state: components?.state || "",
                                            timezone: (components?.lat && components?.lng) ? tzlookup(components.lat, components.lng) : "America/Chicago",
                                            lat: components?.lat,
                                            lng: components?.lng
                                        });
                                    }}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">City</Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">State</Label>
                                    <Input
                                        value={formData.state}
                                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Zip Code</Label>
                                    <Input
                                        value={formData.home_zip_code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, home_zip_code: e.target.value }))}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Timezone</Label>
                                    <Input
                                        value={formData.timezone}
                                        disabled
                                        className="h-8 text-sm bg-gray-50"
                                    />
                                </div>
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
                        </div>

                        {formData.lat !== undefined && formData.lng !== undefined && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between max-w-[50%]">
                                    <Label>Confirm Pin Location</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={isPinConfirmed ? "outline" : "default"}
                                        className={isPinConfirmed ? "border-green-500 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800" : ""}
                                        disabled={!isPinMoved || isPinConfirmed}
                                        onClick={() => setIsPinConfirmed(true)}
                                    >
                                        {isPinConfirmed ? "Confirmed ✓" : "Confirm Pin"}
                                    </Button>
                                </div>
                                <div className="w-full md:w-1/2">
                                    <LocationPickerMap
                                        lat={formData.lat}
                                        lng={formData.lng}
                                        onChange={(lat, lng, address, components) => {
                                            setIsPinMoved(true);
                                            setIsPinConfirmed(false);
                                            setFormData(prev => ({
                                                ...prev,
                                                lat,
                                                lng,
                                                ...(address ? { home_zip_code: address } : {}),
                                                ...(components?.city ? { city: components.city } : {}),
                                                ...(components?.state ? { state: components.state } : {}),
                                                ...(components?.zipCode ? { home_zip_code: components.zipCode } : {}),
                                                timezone: (lat && lng) ? tzlookup(lat, lng) : prev.timezone
                                            }))
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Working Hours Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                                onClick={(e) => {
                                    if ('showPicker' in e.currentTarget) {
                                        (e.currentTarget as any).showPicker();
                                    }
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white" disabled={loading || (formData.lat !== undefined && !isPinConfirmed)}>
                            {loading ? "Saving..." : "Save Preferences"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
