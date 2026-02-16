'use client';

import { useEffect } from 'react';
import { useMapEvents, Marker } from 'react-leaflet';

interface LocationMarkerProps {
    position: { lat: number; lng: number } | null;
    setPosition: (pos: { lat: number; lng: number }) => void;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationMarker({ position, setPosition, onLocationSelect }: LocationMarkerProps) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}
