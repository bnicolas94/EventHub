import { createServerSupabaseClient } from '@/lib/supabase/server';
import InvitationEditorWrapper from '@/components/invitations/editor-wrapper';

import { checkFeatureAccessOrRedirect } from '@/lib/gating';

export default async function InvitationsPage() {
    await checkFeatureAccessOrRedirect('mass_communications');
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>No autorizado</div>;
    }

    // Get user's active event
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) return <div>No se encontró tenant.</div>;

    const { data: event } = await supabase
        .from('events')
        .select('id, name, invitation_design')
        .eq('tenant_id', tenantUser.tenant_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!event) {
        return <div>No tienes eventos creados.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Diseñador de Invitaciones</h2>
                    <p className="text-slate-400 mt-1">Editando para: {event.name}</p>
                </div>
            </div>

            <InvitationEditorWrapper
                key={event.id}
                initialDesign={event.invitation_design}
                eventId={event.id}
            />

        </div>
    );
}
