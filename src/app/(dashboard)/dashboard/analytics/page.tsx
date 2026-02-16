import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveEvent } from '@/app/actions/events';
import { getEventAnalytics } from '@/app/actions/analytics';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { BarChart3, CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

import { checkFeatureAccessOrRedirect } from '@/lib/gating';

export default async function AnalyticsPage() {
    await checkFeatureAccessOrRedirect('advanced_reports');
    const supabase = await createServerSupabaseClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // 2. Tenant Check
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) {
        return <div>Error: Usuario no asignado a una organización.</div>;
    }

    // 3. Active Event Check
    const event = await getActiveEvent(tenantUser.tenant_id);

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-2">
                    <CalendarOff className="w-8 h-8 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">No hay evento activo</h2>
                <p className="text-slate-400 max-w-md">
                    Para ver analíticas, primero necesitas configurar un evento.
                </p>
                <Button asChild variant="secondary">
                    <Link href="/dashboard/events/new">
                        Crear Evento
                    </Link>
                </Button>
            </div>
        );
    }

    // 4. Fetch Analytics
    const { data: metrics, error } = await getEventAnalytics(event.id);

    if (error || !metrics) {
        return (
            <div className="p-8 text-center text-red-400">
                Error al cargar analíticas: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Analíticas y Reportes</h1>
                    <p className="text-slate-400 text-sm">
                        Evento: <span className="text-blue-300 font-medium">{event.name}</span>
                    </p>
                </div>
            </div>

            <AnalyticsDashboard key={event.id} metrics={metrics} eventName={event.name} />

        </div>
    );
}
