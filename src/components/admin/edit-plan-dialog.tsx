
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { updateSubscriptionPlan } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ALL_FEATURES = [
    'tables',
    'timeline',
    'csv_import',
    'advanced_reports',
    'photo_moderation',
    'mass_communications',
    'ai_suggestions',
    'custom_branding',
    'custom_domain',
    'sms_notifications',
];

const FEATURE_LABELS: Record<string, string> = {
    tables: 'Diseñador de Mesas',
    timeline: 'Cronograma de Evento',
    csv_import: 'Importación de Invitados (CSV)',
    advanced_reports: 'Analíticas y Reportes',
    photo_moderation: 'Moderación de Fotos',
    mass_communications: 'Envío Masivo (Email/SMS)',
    ai_suggestions: 'IA y Sugerencias Inteligentes',
    custom_branding: 'Marca Blanca / Branding',
    custom_domain: 'Dominio Propio',
    sms_notifications: 'Notificaciones SMS',
};

const planSchema = z.object({
    price_usd: z.coerce.number().min(0),
    max_events: z.coerce.number().int().min(1),
    max_guests: z.coerce.number().int().min(1),
    storage_quota_mb: z.coerce.number().int().min(1),
    // Zod record for string keys and boolean values
    features: z.record(z.string(), z.boolean()),
});

type PlanFormData = z.infer<typeof planSchema>;

interface EditPlanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: any;
}

export function EditPlanDialog({ open, onOpenChange, plan }: EditPlanDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Casting resolver to any to avoid strict type mismatch with recursive Record types in Zod
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PlanFormData>({
        resolver: zodResolver(planSchema) as any,
        defaultValues: {
            price_usd: Number(plan.price_usd),
            max_events: Number(plan.max_events),
            max_guests: Number(plan.max_guests),
            storage_quota_mb: Number(plan.storage_quota_mb),
            features: plan.features as Record<string, boolean>,
        }
    });

    const features = watch('features');

    const onSubmit = async (data: PlanFormData) => {
        setIsLoading(true);
        try {
            const result = await updateSubscriptionPlan(plan.id, data);

            if (result.success) {
                toast.success('Plan actualizado correctamente');
                onOpenChange(false);
            } else {
                toast.error(result.error || 'Error al actualizar plan');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFeature = (key: string, checked: boolean) => {
        setValue(`features.${key}`, checked, { shouldDirty: true });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Plan: {plan.name}</DialogTitle>
                    <DialogDescription>
                        Modifica los límites y características del plan. Los cambios afectan a todos los tenants suscritos.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price_usd">Precio (USD/mes)</Label>
                            <Input id="price_usd" type="number" step="0.01" {...register('price_usd')} />
                            {errors.price_usd && <p className="text-red-500 text-xs">{errors.price_usd.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_events">Max Eventos</Label>
                            <Input id="max_events" type="number" {...register('max_events')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_guests">Max Invitados</Label>
                            <Input id="max_guests" type="number" {...register('max_guests')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storage_quota_mb">Storage (MB)</Label>
                            <Input id="storage_quota_mb" type="number" {...register('storage_quota_mb')} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Funciones Habilitadas</Label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-4 rounded-md dark:bg-slate-900 border">
                            {ALL_FEATURES.map((key) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={key}
                                        checked={features?.[key] === true}
                                        onCheckedChange={(checked: boolean | string) => toggleFeature(key, checked === true)}
                                    />
                                    <label
                                        htmlFor={key}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {FEATURE_LABELS[key] || key}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
