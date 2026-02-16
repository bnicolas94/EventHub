import { getEventPhotos } from '@/lib/db/photos';
import { PhotoModerationGrid } from '@/components/photos/photo-moderation-grid';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
    params: Promise<{
        eventId: string;
    }>;
}

export const dynamic = 'force-dynamic';

export default async function EventPhotosPage({ params }: PageProps) {
    const { eventId } = await params;
    const supabase = await createServerSupabaseClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Fetch photos (explicitly asking for ALL statuses including rejected)
    const { data: photosData, error } = await getEventPhotos({
        eventId,
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

    // Cast status to match component prop (since DB might return text)
    const photos = (photosData || []).map(p => ({
        ...p,
        status: p.status as 'approved' | 'pending' | 'rejected'
    }));

    // Fetch event settings for moderation toggle
    const { data: eventData } = await supabase
        .from('events')
        .select('settings')
        .eq('id', eventId)
        .single();

    const initialModerationEnabled = eventData?.settings?.moderation_enabled || false;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" className="text-slate-400 p-0 hover:text-white hover:bg-transparent" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver al Dashboard
                            </Link>
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-600/20 rounded-lg">
                            <ImageIcon className="w-6 h-6 text-violet-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Galería de Fotos</h1>
                    </div>
                    <p className="text-slate-400 mt-1 ml-11">
                        Modera las fotos subidas por tus invitados.
                    </p>
                </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <PhotoModerationGrid
                    initialPhotos={photos}
                    eventId={eventId}
                    initialModerationEnabled={initialModerationEnabled}
                />
            </div>
        </div>
    );
}
