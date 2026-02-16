import { getActiveEvent } from '@/app/actions/events';
import { getGuests } from '@/app/actions/guests';
import { getTables } from '@/app/actions/tables';
import { TableEditor } from '@/components/tables/table-editor';
import { FeatureGate } from '@/components/shared/feature-gate';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { checkFeatureAccessOrRedirect } from '@/lib/gating';

export default async function TablesPage() {
    await checkFeatureAccessOrRedirect('tables');

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
        redirect('/login');
    }

    const event = await getActiveEvent(tenantUser.tenant_id);

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>No hay un evento activo seleccionado.</p>
            </div>
        );
    }

    const tables = await getTables(event.id);
    const guests = await getGuests(event.id);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden p-6">
                <FeatureGate feature="tables" showBanner className="max-w-xl mx-auto mt-20">
                    <TableEditor
                        key={event.id}
                        eventId={event.id}
                        initialTables={tables || []}
                        initialGuests={guests || []}
                    />
                </FeatureGate>

            </div>
        </div>
    );
}
