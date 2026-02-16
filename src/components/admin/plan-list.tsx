
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil } from 'lucide-react';
import { EditPlanDialog } from './edit-plan-dialog';
import { useRouter } from 'next/navigation';

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

interface PlanListProps {
    initialPlans: any[];
}

export function PlanList({ initialPlans }: PlanListProps) {
    const [plans, setPlans] = useState(initialPlans);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const router = useRouter();

    const handleEditClick = (plan: any) => {
        setSelectedPlan(plan);
        setOpenDialog(true);
    };

    const handleRefresh = () => {
        router.refresh();
        // Simple optimistic or full reload could go here. 
        // For now relying on router.refresh() + maybe a slight delay or just waiting for new props if we were using 'use' hook, 
        // but simple router.refresh() is good enough for Admin.
    };

    return (
        <>
            <div className="grid gap-6 md:grid-cols-3">
                {plans?.map((plan: any) => (
                    <Card key={plan.id} className="bg-slate-900 border-white/10 flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                                <Badge variant="outline" className="text-amber-400 border-amber-400/20">
                                    ${plan.price_usd}/m
                                </Badge>
                            </div>
                            <CardDescription className="text-slate-400">
                                {plan.slug.toUpperCase()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1">
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Eventos</span>
                                    <span className="text-white font-medium">{plan.max_events === 99999 ? 'Ilimitados' : plan.max_events}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Invitados</span>
                                    <span className="text-white font-medium">{plan.max_guests === 99999 ? 'Ilimitados' : plan.max_guests}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Almacenamiento</span>
                                    <span className="text-white font-medium">{plan.storage_quota_mb} MB</span>
                                </div>
                            </div>

                            <div className="pt-4 space-y-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Funciones</p>
                                {ALL_FEATURES.map((key) => {
                                    const value = plan.features?.[key] === true;
                                    return (
                                        <div key={key} className="flex items-center gap-2 text-sm">
                                            {value ?
                                                <Check className="w-4 h-4 text-emerald-400" /> :
                                                <X className="w-4 h-4 text-red-400" />
                                            }
                                            <span className={value ? "text-slate-300" : "text-slate-500"}>
                                                {FEATURE_LABELS[key] || key}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="outline"
                                className="w-full border-white/10 text-white hover:bg-white/5 hover:text-amber-400"
                                onClick={() => handleEditClick(plan)}
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar Plan
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {selectedPlan && (
                <EditPlanDialog
                    open={openDialog}
                    onOpenChange={setOpenDialog}
                    plan={selectedPlan}
                />
            )}
        </>
    );
}
