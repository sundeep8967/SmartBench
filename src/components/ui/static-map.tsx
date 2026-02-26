"use client";

import { useLoadScript, GoogleMap, Marker } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.5rem"
};

export function StaticMap({ lat, lng, zoom = 14 }: { lat: number; lng: number, zoom?: number }) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const center = { lat, lng };

    if (loadError) return <div className="p-4 bg-gray-50 flex items-center justify-center h-full text-red-500 rounded-lg">Error loading map</div>;
    if (!isLoaded) return <div className="p-4 bg-gray-50 flex items-center justify-center h-full text-gray-400 rounded-lg animate-pulse">Loading map...</div>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                scrollwheel: false,
                clickableIcons: false,
            }}
        >
            <Marker position={center} />
        </GoogleMap>
    );
}
