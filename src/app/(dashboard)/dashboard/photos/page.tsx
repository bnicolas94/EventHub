import { getEventPhotos } from '@/lib/db/photos';
import { PhotoModerationGrid } from '@/components/photos/photo-moderation-grid';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveEvent } from '@/app/actions/events';
import { Camera, CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PhotosPage() {
    const supabase = await createServerSupabaseClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Get Tenant
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) {
        return <div>Error: Usuario no asignado a una organización.</div>;
    }

    // Get Active Event
    const event = await getActiveEvent(tenantUser.tenant_id);

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-2">
                    <CalendarOff className="w-8 h-8 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">No hay evento activo</h2>
                <p className="text-slate-400 max-w-md">
                    Para gestionar fotos, primero necesitas tener un evento seleccionado o creado.
                </p>
                <Button asChild variant="secondary">
                    <Link href="/dashboard/events/new">
                        Crear Evento
                    </Link>
                </Button>
            </div>
        );
    }

    // Fetch photos for active event
    const { data: photosData, error } = await getEventPhotos({
        eventId: event.id,
        limit: 1000,
        status: null
    });

    if (error) {
        return (
            <div className="p-8 text-center text-red-400">
                Error al cargar las fotos: {error}
            </div>
        );
    }

    // Cast status
    const photos = (photosData || []).map(p => ({
        ...p,
        status: p.status as 'approved' | 'pending' | 'rejected'
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-600/20 rounded-lg">
                            <Camera className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Galería de Fotos</h1>
                            <p className="text-slate-400 text-sm">
                                Evento: <span className="text-violet-300 font-medium">{event.name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <Button variant="outline" asChild>
                    <Link href={`/rsvp/preview/photos`} target="_blank">
                        Ver Galería Pública
                    </Link>
                </Button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <PhotoModerationGrid
                    key={event.id}
                    initialPhotos={photos}
                    eventId={event.id}
                    initialModerationEnabled={event.settings?.moderation_enabled || false}
                />

            </div>
        </div>
    );
}
