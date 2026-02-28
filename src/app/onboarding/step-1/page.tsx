"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressInput, AddressComponents } from "@/components/ui/address-input";
import { LocationPickerMap } from "@/components/ui/location-picker-map";

export default function Step1Info() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        ein: "",
        contactPhone: "",
        lat: undefined as number | undefined,
        lng: undefined as number | undefined,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (e.target.name === 'zipCode') {
            value = value.replace(/\D/g, '').slice(0, 5); // Digits only, max 5
        } else if (e.target.name === 'ein') {
            value = value.replace(/\D/g, '').slice(0, 9);
            if (value.length > 2) {
                value = `${value.slice(0, 2)}-${value.slice(2)}`;
            }
        } else if (e.target.name === 'contactPhone') {
            value = value.replace(/\D/g, '').slice(0, 10);
            if (value.length > 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
            } else if (value.length > 3) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleAddressChange = (address: string, components?: AddressComponents) => {
        if (components) {
            setFormData(prev => ({
                ...prev,
                address: components.street || address,
                city: components.city || prev.city,
                state: components.state || prev.state,
                zipCode: (components.zipCode || prev.zipCode).replace(/\D/g, '').slice(0, 5),
                lat: components.lat,
                lng: components.lng
            }));
        } else {
            setFormData(prev => ({ ...prev, address }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/onboarding/step1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save");
            }

            // Full page navigation — the proxy will see the updated JWT
            // with is_onboarded=true and let us through to /dashboard
            window.location.href = "/dashboard";
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Error saving company info. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label htmlFor="companyName">Business Name</Label>
                <Input
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Acme Construction Inc."
                />
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="address">Business Address</Label>
                    <div className="mt-1">
                        <AddressInput
                            value={formData.address}
                            onChange={handleAddressChange}
                            placeholder="123 Main St"
                            required
                        />
                    </div>
                </div>

                {formData.lat !== undefined && formData.lng !== undefined && (
                    <div className="space-y-2 mt-4">
                        <Label>Confirm Pin Location</Label>
                        <LocationPickerMap
                            lat={formData.lat}
                            lng={formData.lng}
                            onChange={(lat, lng, address, components) => {
                                setFormData(prev => ({
                                    ...prev,
                                    lat,
                                    lng,
                                    ...(address ? { address: components?.street || address } : {}),
                                    ...(components?.city ? { city: components.city } : {}),
                                    ...(components?.state ? { state: components.state } : {}),
                                    ...(components?.zipCode ? { zipCode: components.zipCode.replace(/\D/g, '').slice(0, 5) } : {})
                                }))
                            }}
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="city">City</Label>
                        <AddressInput
                            value={formData.city}
                            onChange={(val, components) => {
                                if (components && components.city) {
                                    setFormData(prev => ({
                                        ...prev,
                                        city: components.city,
                                        state: components.state || prev.state
                                    }));
                                } else {
                                    setFormData(prev => ({ ...prev, city: val }));
                                }
                            }}
                            placeholder="Anytown"
                            required
                            types={['(cities)']}
                            hideIcon={true}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="state">State</Label>
                            <AddressInput
                                value={formData.state}
                                onChange={(val, components) => {
                                    if (components && components.state) {
                                        setFormData(prev => ({
                                            ...prev,
                                            state: components.state
                                        }));
                                    } else {
                                        setFormData(prev => ({ ...prev, state: val }));
                                    }
                                }}
                                placeholder="New York"
                                required
                                types={['(regions)']}
                                hideIcon={true}
                            />
                        </div>
                        <div>
                            <Label htmlFor="zipCode">Zip Code</Label>
                            <AddressInput
                                value={formData.zipCode}
                                onChange={(val, components) => {
                                    if (components && components.zipCode) {
                                        setFormData(prev => ({
                                            ...prev,
                                            zipCode: components.zipCode,
                                            city: components.city || prev.city,
                                            state: components.state || prev.state
                                        }));
                                    } else {
                                        setFormData(prev => ({ ...prev, zipCode: val.replace(/\D/g, '').slice(0, 5) }));
                                    }
                                }}
                                placeholder="12345"
                                required
                                types={['(regions)']}
                                hideIcon={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <Label htmlFor="ein">EIN (Tax ID)</Label>
                <Input
                    id="ein"
                    name="ein"
                    required
                    value={formData.ein}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="12-3456789"
                    maxLength={10}
                    pattern="\d{2}-\d{7}"
                    title="Expected format: 12-3456789"
                />
            </div>

            <div>
                <Label htmlFor="contactPhone">Contact Phone (Mobile)</Label>
                <Input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    pattern="\(\d{3}\) \d{3}-\d{4}"
                    title="Expected format: (555) 123-4567"
                />
                <p className="text-xs text-neutral-500 mt-1">
                    Used for critical alerts (e.g., insurance expiration).
                </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Continue"}
            </Button>
        </form>
    );
}
