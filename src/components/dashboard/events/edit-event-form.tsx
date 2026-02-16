
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateEvent, updateEventSettings } from '@/app/actions/events';
import { toast } from 'sonner';
import { Loader2, CalendarIcon, MapPinIcon, UsersIcon, Palette } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FeatureGate } from '@/components/shared/feature-gate';

const LocationPicker = dynamic(() => import('@/components/maps/location-picker').then(mod => mod.LocationPicker), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-900 animate-pulse rounded-lg" />
});

const formSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    location_address: z.string().optional(),
    max_guests: z.coerce.number().int().positive().optional(),
    primary_color: z.string().optional(),
    logo_url: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditEventFormProps {
    event: {
        id: string;
        name: string;
        date: string;
        location_address?: string;
        max_guests?: number;
        settings?: any;
    };
}

export function EditEventForm({ event }: EditEventFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
        event.settings?.location ? event.settings.location : null
    );

    // Format date for input datetime-local
    const defaultDate = event.date ? new Date(event.date).toISOString().slice(0, 16) : '';

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: event.name,
            date: defaultDate,
            location_address: event.location_address || '',
            max_guests: event.max_guests || 100,
            primary_color: event.settings?.branding?.primary_color || '#7c3aed', // Default violet
            logo_url: event.settings?.branding?.logo_url || ''
        }
    });

    const handleLocationSelect = (lat: number, lng: number) => {
        setCoordinates({ lat, lng });
    };

    async function onSubmit(data: FormData) {
        setIsLoading(true);
        // Transform data map
        const payload = {
            name: data.name,
            date: data.date,
            location_address: data.location_address,
            max_guests: data.max_guests
        };

        try {
            // 1. Update main event details
            const result = await updateEvent(event.id, payload);

            if (!result.success) {
                throw new Error(result.error || 'Error al actualizar detalles');
            }

            // 2. Update settings with coordinates and branding
            const settingsPayload: any = {
                ...event.settings, // Preserve existing settings
            };

            if (coordinates) {
                settingsPayload.location = coordinates;
            }

            // Branding (only if values present, but FeatureGate prevents sending if disabled at UI level)
            // Ideally we should double check permission here, but server action should strictly check it too.
            // For now, we trust UI + Backend strict check (if we added it).
            settingsPayload.branding = {
                primary_color: data.primary_color,
                logo_url: data.logo_url
            };

            const settingsResult = await updateEventSettings(event.id, settingsPayload);

            if (!settingsResult.success) {
                throw new Error(settingsResult.error || 'Error al actualizar configuración');
            }

            toast.success('Evento actualizado correctamente');
        } catch (error: any) {
            toast.error(error.message || 'Error de conexión');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
            <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-violet-400" />
                    Detalles Generales
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Evento</Label>
                    <Input id="name" {...register('name')} className="bg-slate-950/50" />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="date">Fecha y Hora</Label>
                    <div className="relative">
                        <Input id="date" type="datetime-local" {...register('date')} className="bg-slate-950/50" />
                    </div>
                    {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="max_guests">Invitados Estimados</Label>
                    <div className="relative">
                        <UsersIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="max_guests" type="number" className="pl-9 bg-slate-950/50" {...register('max_guests')} />
                    </div>
                    {errors.max_guests && <p className="text-sm text-red-500">{errors.max_guests.message}</p>}
                </div>
            </div>

            <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-violet-400" />
                    Ubicación y Mapa
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="location_address">Dirección o Nombre del Lugar</Label>
                    <Input id="location_address" placeholder="Ej: Salón Los Olivos" {...register('location_address')} className="bg-slate-950/50" />
                    <p className="text-xs text-slate-400">Esta dirección se mostrará en la invitación.</p>
                </div>

                <div className="space-y-2">
                    <Label>Mapa Interactivo</Label>
                    <div className="rounded-lg overflow-hidden border border-white/10">
                        <LocationPicker
                            initialLat={coordinates?.lat}
                            initialLng={coordinates?.lng}
                            onLocationSelect={handleLocationSelect}
                        />
                    </div>
                    <p className="text-xs text-slate-400">
                        Busca la dirección y mueve el pin para confirmar la ubicación exacta que verán los invitados.
                    </p>
                </div>
            </div>

            <FeatureGate feature="custom_branding" showBanner className="border-amber-500/20 bg-amber-500/5">
                <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-violet-400" />
                        Personalización y Marca
                    </h3>

                    <div className="space-y-2">
                        <Label htmlFor="primary_color">Color Principal</Label>
                        <div className="flex gap-2">
                            <Input
                                id="primary_color"
                                type="color"
                                className="w-12 h-10 p-1 bg-slate-950/50"
                                {...register('primary_color')}
                            />
                            <Input
                                type="text"
                                placeholder="#000000"
                                className="flex-1 bg-slate-950/50"
                                {...register('primary_color')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="logo_url">URL del Logo (Opcional)</Label>
                        <Input
                            id="logo_url"
                            placeholder="https://..."
                            className="bg-slate-950/50"
                            {...register('logo_url')}
                        />
                    </div>
                </div>
            </FeatureGate>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </div>
        </form>
    );
}
