"use client";

import { useLoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { useCallback, useRef, useState } from "react";

const containerStyle = {
    width: "100%",
    height: "200px",
    borderRadius: "0.5rem"
};

const libraries: ("places")[] = ["places"];

interface LocationPickerMapProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number, address?: string) => void;
}

export function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [isDragging, setIsDragging] = useState(false);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    const onDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
        setIsDragging(true);
        if (e.latLng) {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();

            if (!geocoderRef.current && window.google) {
                geocoderRef.current = new window.google.maps.Geocoder();
            }

            if (geocoderRef.current) {
                geocoderRef.current.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                    setIsDragging(false);
                    if (status === 'OK' && results && results[0]) {
                        onChange(newLat, newLng, results[0].formatted_address);
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

    const center = { lat, lng };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={16}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    scrollwheel: true,
                }}
            >
                <Marker
                    position={center}
                    draggable={true}
                    onDragEnd={onDragEnd}
                    title="Drag to adjust exact location"
                />
            </GoogleMap>
            <div className="absolute top-2 left-2 bg-white/90 px-3 py-1.5 rounded-md shadow-sm border border-gray-100 text-xs font-medium text-gray-700 pointer-events-none">
                {isDragging ? 'Updating address...' : 'Drag the pin to adjust exact location'}
            </div>
        </div>
    );
}
