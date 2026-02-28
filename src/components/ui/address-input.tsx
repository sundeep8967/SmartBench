"use client";

import { useState, useRef, useEffect } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

const libraries: ("places")[] = ["places"];

interface AddressInputProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number) => void;
    placeholder?: string;
    required?: boolean;
}

export function AddressInput({ value, onChange, placeholder = "Search for an address", required = false }: AddressInputProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const onLoad = (autoC: google.maps.places.Autocomplete) => {
        setAutocomplete(autoC);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                onChange(place.formatted_address || place.name || "", lat, lng);
            } else {
                // User typed something but didn't select from the dropdown
                onChange(inputRef.current?.value || "");
            }
        }
    };

    if (loadError) {
        return <div className="text-red-500 text-sm">Error loading Google Maps. Is the API key set?</div>;
    }

    if (!isLoaded) {
        return <Input disabled placeholder="Loading maps..." />;
    }

    return (
        <div className="relative">
            <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="pl-9"
                        required={required}
                    />
                </div>
            </Autocomplete>
        </div>
    );
}
