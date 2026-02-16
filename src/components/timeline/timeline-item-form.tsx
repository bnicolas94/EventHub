
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTimelineItem, updateTimelineItem } from '@/app/actions/timeline';
import { TimelineItem } from '@/types/timeline.types';
import { toast } from 'sonner';
import { Loader2, Plus, Clock, AlignLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const formSchema = z.object({
    title: z.string().min(1, 'El título es obligatorio'),
    description: z.string().optional(),
    start_time: z.string().refine((val) => !isNaN(Date.parse(val)), 'Hora inválida'),
    end_time: z.string().optional(),
    icon: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface TimelineItemFormProps {
    eventId: string;
    item?: TimelineItem;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function TimelineItemForm({ eventId, item, open: controlledOpen, onOpenChange, onSuccess, children }: TimelineItemFormProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            start_time: '',
            end_time: '',
            icon: 'clock',
        }
    });

    useEffect(() => {
        if (item) {
            // Format time for datetime-local input (YYYY-MM-DDTHH:mm)
            const formatTime = (isoString: string) => {
                if (!isoString) return '';
                try {
                    return new Date(isoString).toISOString().slice(0, 16);
                } catch (e) {
                    return '';
                }
            };

            reset({
                title: item.title,
                description: item.description || '',
                start_time: formatTime(item.start_time),
                end_time: item.end_time ? formatTime(item.end_time) : '',
                icon: item.icon || 'clock',
            });
        } else {
            reset({
                title: '',
                description: '',
                start_time: '',
                end_time: '',
                icon: 'clock',
            });
        }
    }, [item, reset, isOpen]);

    async function onSubmit(data: FormData) {
        setIsLoading(true);
        try {
            // Convert local time back to ISO
            const isoStartTime = new Date(data.start_time).toISOString();
            const isoEndTime = data.end_time ? new Date(data.end_time).toISOString() : undefined;

            const payload = {
                ...data,
                start_time: isoStartTime,
                end_time: isoEndTime,
            };

            let result;
            if (item) {
                result = await updateTimelineItem(item.id, eventId, payload);
            } else {
                result = await createTimelineItem(eventId, payload);
            }

            if (result.success) {
                toast.success(item ? 'Item actualizado' : 'Item creado');
                setOpen(false);
                reset();
                onSuccess?.();
            } else {
                toast.error(result.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Item
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{item ? 'Editar Item' : 'Agregar Nuevo Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" placeholder="Ej: Ceremonia" {...register('title')} />
                        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="start_time">Hora de Inicio</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="start_time" type="datetime-local" className="pl-9" {...register('start_time')} />
                        </div>
                        {errors.start_time && <p className="text-sm text-red-500">{errors.start_time.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end_time">Hora de Fin (Opcional)</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="end_time" type="datetime-local" className="pl-9" {...register('end_time')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <Textarea id="description" placeholder="Detalles adicionales..." {...register('description')} />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {item ? 'Guardar Cambios' : 'Crear Item'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
