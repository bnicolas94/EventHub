
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getEvents, getActiveEventId } from '@/app/actions/events';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const events = await getEvents();
    const activeEventId = await getActiveEventId();


    // Fallback if no active event is set and events exist
    const currentEventId = activeEventId || (events.length > 0 ? events[0].id : '');

    // [NEW] Get tenant & plan
    const { getTenantPlan } = await import('@/lib/plans');
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    let initialTenant = undefined;
    if (tenantUser) {
        const planData = await getTenantPlan(tenantUser.tenant_id);
        if (planData?.tenant) {
            initialTenant = planData.tenant;
        }
    }

    return (
        <DashboardShell
            initialEvents={events}
            initialActiveEventId={currentEventId}
            userEmail={user.email || 'Usuario'}
            initialTenant={initialTenant}
        >
            {children}
        </DashboardShell>
    );
}
