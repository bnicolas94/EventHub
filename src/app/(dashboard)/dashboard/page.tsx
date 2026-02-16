import { getDashboardMetrics } from '@/app/actions/dashboard';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { SmartChecklist } from '@/components/dashboard/smart-checklist';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    // Check if user has any event created
    const metrics = await getDashboardMetrics();

    // Helper to get user name for greeting
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no event found (metrics null), show "Create Event" CTA
    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-violet-600/20 rounded-full flex items-center justify-center mb-2">
                    <Calendar className="w-10 h-10 text-violet-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">¡Bienvenido a EventHub!</h2>
                <p className="text-slate-400 max-w-md text-lg">
                    Para comenzar a utilizar todas las funciones, necesitas crear tu primer evento.
                </p>
                <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-500 text-white rounded-full px-8">
                    <Link href="/dashboard/events/new">
                        <PlusCircle className="mr-2 w-5 h-5" />
                        Crear Mi Evento
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div key={metrics.eventId} className="space-y-8 animate-in fade-in duration-500">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Hola, Organizador</h2>
                    <p className="text-slate-400 mt-2 text-lg">
                        Gestionando: <span className="text-violet-400 font-semibold">{metrics.eventName}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm hidden md:block">
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Faltan</p>
                        <p className="text-3xl font-bold text-white leading-none">
                            {metrics.daysLeft} <span className="text-lg font-normal text-slate-500">días</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <KpiCards metrics={metrics} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left: Checklist (2 cols wide on large screens) */}
                <div className="lg:col-span-2">
                    <SmartChecklist
                        items={metrics.checklistItems}
                        progress={metrics.checklistProgress}
                    />
                </div>

                {/* Right: Activity Feed */}
                <div>
                    <RecentActivity activities={metrics.recentActivity} />
                </div>
            </div>

            {/* Quick Actions Footer (Optional) */}
            <div className="flex gap-4 pt-4 overflow-x-auto pb-2">
                {/* Links to common actions if needed */}
            </div>
        </div>
    );
}
