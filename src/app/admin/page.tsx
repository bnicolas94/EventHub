
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Activity, TrendingUp } from 'lucide-react';
import { checkSystemAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';

async function getAnalytics() {
    const isAdmin = await checkSystemAdmin();
    if (!isAdmin) return null;

    const supabase = await createServiceRoleClient();

    // 1. Total Tenants
    const { count: totalTenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true });

    // 2. Active Paid Subscriptions (Pro + Enterprise) -> assuming 'free' has specific ID or slug
    const { data: paidPlans } = await supabase
        .from('subscription_plans')
        .select('id')
        .in('slug', ['pro', 'enterprise']);

    const paidPlanIds = paidPlans?.map(p => p.id) || [];

    const { count: activePaid, error: paidError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .in('plan_id', paidPlanIds)
        .eq('subscription_status', 'active');

    // 3. New Tenants Last 30 Days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newTenants, error: newError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

    return {
        totalTenants: totalTenants || 0,
        activePaid: activePaid || 0,
        newTenants: newTenants || 0
    };
}

export default async function AdminDashboardPage() {
    const analytics = await getAnalytics();

    if (!analytics) {
        redirect('/dashboard');
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard General</h1>
                <p className="text-slate-400">Visión general del rendimiento de la plataforma.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Total Tenants</CardTitle>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{analytics.totalTenants}</div>
                        <p className="text-xs text-slate-400">+{(analytics.newTenants / (analytics.totalTenants || 1) * 100).toFixed(1)}% este mes</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Suscripciones Activas</CardTitle>
                        <CreditCard className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{analytics.activePaid}</div>
                        <p className="text-xs text-slate-400">Usuarios de pago (Pro/Enterprise)</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Nuevos (30d)</CardTitle>
                        <Activity className="h-4 w-4 text-violet-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{analytics.newTenants}</div>
                        <p className="text-xs text-slate-400">Registros en el último mes</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">MRR Estimado</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">$---</div>
                        <p className="text-xs text-slate-400">Próximamente</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
