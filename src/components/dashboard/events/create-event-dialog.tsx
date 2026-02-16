'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createEvent } from '@/app/actions/events';
import { toast } from 'sonner';
import { Loader2, Plus, CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    location: z.string().optional(),
    max_guests: z.coerce.number().int().positive().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateEventDialog({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);



    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            date: '',
            location: '',
            max_guests: 100
        }
    });



    async function onSubmit(data: FormData) {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('date', data.date);
        if (data.location) formData.append('location_address', data.location);
        if (data.max_guests) formData.append('max_guests', data.max_guests.toString());

        try {
            const result = await createEvent(null, formData);

            if (result.success) {
                toast.success('Evento creado correctamente');
                setOpen(false);
                reset();
            } else {
                toast.error(result.error || 'Error al crear el evento');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Evento
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Evento</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles básicos para comenzar a organizar tu evento.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Evento</Label>
                        <Input id="name" placeholder="Ej: Boda de María y Juan" {...register('name')} />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Fecha y Hora</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="date" type="datetime-local" className="pl-9" {...register('date')} />
                        </div>
                        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Ubicación (Opcional)</Label>
                        <div className="relative">
                            <MapPinIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="location" placeholder="Ej: Salón Los Olivos" className="pl-9" {...register('location')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max_guests">Invitados Estimados</Label>
                        <div className="relative">
                            <UsersIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="max_guests" type="number" className="pl-9" {...register('max_guests')} />
                        </div>
                        {errors.max_guests && <p className="text-sm text-red-500">{errors.max_guests.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Evento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
