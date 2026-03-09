"use client";

import { useState, useRef, useEffect } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

const libraries: ("places")[] = ["places"];

export interface AddressComponents {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    formattedAddress: string;
    lat?: number;
    lng?: number;
}

interface AddressInputProps {
    value: string;
    onChange: (address: string, components?: AddressComponents) => void;
    placeholder?: string;
    required?: boolean;
    types?: string[];
    hideIcon?: boolean;
}

export function AddressInput({ value, onChange, placeholder = "Search for an address", required = false, types, hideIcon = false }: AddressInputProps) {
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

                const components: AddressComponents = {
                    street: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    formattedAddress: place.formatted_address || place.name || "",
                    lat,
                    lng,
                };

                const addressComponents = place.address_components || [];
                let streetNumber = "";
                let route = "";

                for (const component of addressComponents) {
                    const types = component.types;
                    if (types.includes("street_number")) {
                        streetNumber = component.long_name;
                    } else if (types.includes("route")) {
                        route = component.long_name;
                    } else if (types.includes("locality")) {
                        components.city = component.long_name;
                    } else if (types.includes("sublocality_level_1")) {
                        components.city = components.city || component.long_name;
                    } else if (types.includes("postal_town")) {
                        components.city = components.city || component.long_name;
                    } else if (types.includes("administrative_area_level_1")) {
                        components.state = component.long_name;
                    } else if (types.includes("postal_code")) {
                        components.zipCode = component.long_name;
                    }
                }

                components.street = `${streetNumber} ${route}`.trim();

                onChange(components.formattedAddress, components);
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
            <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                    ...(types ? { types } : {}),
                    componentRestrictions: { country: 'us' },
                    // Biasing towards Minnesota bounds
                    bounds: {
                        north: 49.384358,
                        south: 43.499356,
                        east: -89.483385,
                        west: -97.239209,
                    },
                    strictBounds: false
                }}
            >
                <div className="relative">
                    {!hideIcon && <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />}
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={hideIcon ? "" : "pl-9"}
                        required={required}
                    />
                </div>
            </Autocomplete>
        </div>
    );
}
