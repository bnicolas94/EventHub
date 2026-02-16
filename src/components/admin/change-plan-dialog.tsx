
'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { updateTenantPlan } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ChangePlanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant: any;
    plans: any[];
    onSuccess: (tenantId: string, planName: string, planId: string) => void;
}

export function ChangePlanDialog({
    open,
    onOpenChange,
    tenant,
    plans,
    onSuccess
}: ChangePlanDialogProps) {
    const [selectedPlanId, setSelectedPlanId] = useState(tenant.plan_id);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!selectedPlanId) return;

        setIsLoading(true);
        try {
            const result = await updateTenantPlan(tenant.id, selectedPlanId);

            if (result.success) {
                const newPlan = plans.find(p => p.id === selectedPlanId);
                toast.success(`Plan actualizado a ${newPlan?.name}`);
                onSuccess(tenant.id, newPlan?.name, selectedPlanId);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cambiar Plan de Suscripción</DialogTitle>
                    <DialogDescription>
                        Modifica el plan actual para {tenant.name}. Esta acción es inmediata.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="current_plan" className="text-right">
                            Actual
                        </Label>
                        <div className="col-span-3 text-sm font-medium">
                            {tenant.plan_name}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new_plan" className="text-right">
                            Nuevo Plan
                        </Label>
                        <div className="col-span-3">
                            <Select
                                value={selectedPlanId}
                                onValueChange={setSelectedPlanId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {plan.name} - ${plan.price_usd}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || selectedPlanId === tenant.plan_id}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
