
'use client';

import { useAuthStore } from '@/lib/stores';
import { PlanFeature } from '@/lib/plans';
import { ReactNode } from 'react';
import { SubscriptionPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
    feature: PlanFeature;
    children: ReactNode;
    fallback?: ReactNode;
    showBanner?: boolean;
    className?: string; // Para el contenedor del banner
}

export function FeatureGate({
    feature,
    children,
    fallback,
    showBanner = false,
    className
}: FeatureGateProps) {
    const { tenant, isLoading } = useAuthStore();

    // Si está cargando, asumimos que tiene permiso para evitar parpadeos molestos,
    // o mostramos children (optimistic). Si es crítico, mejor null.
    // Optamos por mostrar children hasta confirmar, salvo que sea feature muy premium.
    if (isLoading || !tenant) return null;

    const plan = Array.isArray(tenant.plan) ? tenant.plan[0] : tenant.plan;
    if (!plan) return null;

    const features = (plan as SubscriptionPlan).features as any;
    const hasAccess = features?.[feature] === true;

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (showBanner) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-8 border border-white/10 rounded-xl bg-slate-900/50 text-center space-y-4", className)}>
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-white mb-1">Función Premium</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                        Esta funcionalidad está disponible exclusivamente en los planes Pro y Enterprise.
                    </p>
                </div>
                <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Link href="/dashboard/settings/billing">
                        Actualizar Plan
                    </Link>
                </Button>
            </div>
        );
    }

    return null;
}
