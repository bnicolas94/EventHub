'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { SubscriptionPlan } from '@/lib/types';
import { updateSubscriptionPlan as updatePlan } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditPlanDialogProps {
    plan: SubscriptionPlan;
}

export function EditPlanDialog({ plan }: EditPlanDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        price_usd: plan.price_usd,
        max_guests: plan.max_guests,
        max_events: plan.max_events,
        storage_quota_mb: plan.storage_quota_mb,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: Number(value),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updatePlan(plan.id, formData);

            if (result.success) {
                toast.success('Plan actualizado correctamente');
                setOpen(false);
            } else {
                toast.error(result.error || 'Error al actualizar');
            }
        } catch {
            toast.error('Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full mt-4 border-white/10 text-slate-300 hover:bg-white/5"
                >
                    Editar plan
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Editar Plan {plan.name}</DialogTitle>
                    <DialogDescription>
                        Modifica los límites y precios de este plan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Precio (USD)
                            </Label>
                            <Input
                                id="price"
                                name="price_usd"
                                type="number"
                                step="0.01"
                                value={formData.price_usd}
                                onChange={handleChange}
                                className="col-span-3 bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="guests" className="text-right">
                                Max Invitados
                            </Label>
                            <Input
                                id="guests"
                                name="max_guests"
                                type="number"
                                value={formData.max_guests}
                                onChange={handleChange}
                                className="col-span-3 bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="events" className="text-right">
                                Max Eventos
                            </Label>
                            <Input
                                id="events"
                                name="max_events"
                                type="number"
                                value={formData.max_events}
                                onChange={handleChange}
                                className="col-span-3 bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="storage" className="text-right">
                                Storage (MB)
                            </Label>
                            <Input
                                id="storage"
                                name="storage_quota_mb"
                                type="number"
                                value={formData.storage_quota_mb}
                                onChange={handleChange}
                                className="col-span-3 bg-white/5 border-white/10"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-violet-600 hover:bg-violet-500"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
