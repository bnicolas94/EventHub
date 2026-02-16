import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getActiveEvent } from '@/app/actions/events';
import { EditEventForm } from '@/components/dashboard/events/edit-event-form';
import { redirect } from 'next/navigation';
import { Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Obtener ID del tenant para el usuario actual
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) {
        return <div className="p-8 text-center text-red-500">Error: Usuario no asociado a un tenant.</div>;
    }

    const event = await getActiveEvent(tenantUser.tenant_id);

    if (!event) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">No hay evento activo</h2>
                <p className="text-slate-400">Selecciona o crea un evento para configurar sus opciones.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-violet-600/20 rounded-lg">
                    <Settings className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Configuración del Evento</h1>
                    <p className="text-slate-400">Gestiona los detalles generales y la ubicación.</p>
                </div>
            </div>

            <EditEventForm key={event.id} event={event} />
        </div>

    );
}
