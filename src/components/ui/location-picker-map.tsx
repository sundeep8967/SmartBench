"use client";

import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { useCallback, useRef, useState, useEffect } from "react";
import { AddressComponents } from "./address-input";

const containerStyle = {
    width: "100%",
    height: "200px",
    borderRadius: "0.5rem"
};

const libraries: ("places")[] = ["places"];

interface LocationPickerMapProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number, address?: string, components?: AddressComponents) => void;
}

export function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [isDragging, setIsDragging] = useState(false);
    const [localCenter, setLocalCenter] = useState({ lat, lng });
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    // Sync local center if the props change externally
    useEffect(() => {
        setLocalCenter({ lat, lng });
    }, [lat, lng]);

    const onDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
        setIsDragging(true);
        if (e.latLng) {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();

            // Instantly update the visual center so it doesn't bounce back
            setLocalCenter({ lat: newLat, lng: newLng });

            if (!geocoderRef.current && window.google) {
                geocoderRef.current = new window.google.maps.Geocoder();
            }

            if (geocoderRef.current) {
                geocoderRef.current.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                    setIsDragging(false);
                    if (status === 'OK' && results && results[0]) {
                        const place = results[0];
                        const addressComponents = place.address_components || [];
                        let streetNumber = "";
                        let route = "";

                        const components: AddressComponents = {
                            street: "",
                            city: "",
                            state: "",
                            zipCode: "",
                            formattedAddress: place.formatted_address,
                            lat: newLat,
                            lng: newLng,
                        };

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

                        onChange(newLat, newLng, place.formatted_address, components);
                    } else {
                        onChange(newLat, newLng);
                    }
                });
            } else {
                setIsDragging(false);
                onChange(newLat, newLng);
            }
        } else {
            setIsDragging(false);
        }
    }, [onChange]);

    if (loadError) return <div className="p-4 bg-gray-50 flex items-center justify-center h-[200px] text-red-500 rounded-lg">Error loading map preview</div>;
    if (!isLoaded) return <div className="p-4 bg-gray-50 flex items-center justify-center h-[200px] text-gray-400 rounded-lg animate-pulse">Loading map preview...</div>;

    return (
        <div className="space-y-2">
            <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={localCenter}
                    zoom={18}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        scrollwheel: true,
                    }}
                >
                    <Marker
                        position={localCenter}
                        draggable={true}
                        onDragEnd={onDragEnd}
                        title="Drag to adjust exact location"
                    />
                </GoogleMap>
            </div>
            <div className="text-sm font-medium text-gray-600 text-center">
                {isDragging ? <span className="text-purple-600">Updating address...</span> : 'First, drag the pin to select the exact location. Then, click the confirm button.'}
            </div>
        </div>
    );
}
