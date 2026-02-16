
import { getActiveEvent } from '@/app/actions/events';
import { getTimeline } from '@/app/actions/timeline';
import { TimelineManager } from '@/components/timeline/timeline-manager';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TimelineItem } from '@/types/timeline.types';

import { checkFeatureAccessOrRedirect } from '@/lib/gating';

export default async function TimelineDashboardPage() {
    await checkFeatureAccessOrRedirect('timeline');
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) {
        return <div>Error: Usuario no asignado a una organización.</div>;
    }

    const event = await getActiveEvent(tenantUser.tenant_id);

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-semibold text-white">No tienes eventos creados</h2>
                <p className="text-slate-400">Crea tu primer evento para gestionar el cronograma.</p>
            </div>
        );
    }

    const items = await getTimeline(event.id) as TimelineItem[];

    return (
        <div className="container mx-auto py-6 max-w-3xl">
            <TimelineManager key={event.id} eventId={event.id} initialItems={items} />

        </div>
    );
}
