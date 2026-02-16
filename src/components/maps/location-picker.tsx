'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Importar componentes de Leaflet dinámicamente para evitar problemas de SSR
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


const LocationMarker = dynamic(() => import('./location-marker'), { ssr: false });

// Corrección para el icono de marcador por defecto
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corregir iconos solo en el lado del cliente
const fixIcons = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
    const defaultCenter = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires Obelisco por defecto
    const [position, setPosition] = useState<any>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            fixIcons(); // Apply icon fix
        }
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setPosition(newPos);
                onLocationSelect(newPos.lat, newPos.lng);
                toast.success(`Ubicación encontrada: ${data[0].display_name.split(',')[0]}`);
            } else {
                toast.error('No se encontró la ubicación');
            }
        } catch (error) {
            console.error('Error searching location:', error);
            toast.error('Error al buscar la ubicación');
        } finally {
            setIsSearching(false);
        }
    };

    if (!mounted) return <div className="h-[300px] w-full bg-slate-900 animate-pulse rounded-lg" />;

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar dirección o ciudad..."
                        className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    variant="secondary"
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                </Button>
            </div>

            <div className="h-[350px] w-full rounded-lg overflow-hidden border border-slate-700 relative z-0">
                <MapContainer
                    center={position || defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        onLocationSelect={onLocationSelect}
                    />
                </MapContainer>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Haz clic en el mapa para ajustar la posición exacta.
            </p>
        </div>
    );
}
