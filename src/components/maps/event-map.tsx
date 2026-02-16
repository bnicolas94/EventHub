'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Importar componentes de Leaflet dinámicamente
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

// Corrección para el icono de marcador por defecto
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const fixIcons = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface EventMapProps {
    lat: number;
    lng: number;
    venueName?: string;
}

export function EventMap({ lat, lng, venueName }: EventMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            fixIcons();
        }
    }, []);

    const openExternalMap = () => {
        // Enlace universal que debería abrirse correctamente en la mayoría de los dispositivos
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, '_blank');
    };

    if (!mounted) return <div className="h-[250px] w-full bg-slate-100 animate-pulse rounded-lg" />;

    return (
        <div className="space-y-3">
            <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-200/50 shadow-sm relative z-0">
                <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    dragging={false} // Sensación estática pero suficientemente interactiva
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]}>
                        <Popup>
                            {venueName || 'Ubicación del Evento'}
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>

            <Button
                variant="outline"
                className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                onClick={openExternalMap}
            >
                <ExternalLink className="w-4 h-4" />
                Cómo llegar (Google Maps/Waze)
            </Button>
        </div>
    );
}
