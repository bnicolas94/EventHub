import { getGuestByToken } from '@/app/actions/rsvp';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RSVPForm } from '@/components/rsvp/rsvp-form';
import RSVPViewerWrapper from '@/components/invitations/rsvp-viewer';
import { Metadata } from 'next';
import { getEventPhotos } from '@/lib/db/photos';
import { PhotoGallery } from '@/components/photos/photo-gallery';
import { PhotoUpload } from '@/components/photos/photo-upload';
import { EventMap } from '@/components/maps/event-map';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Share2, Music, Camera, Clock } from "lucide-react";
import { getTimeline } from '@/app/actions/timeline';
import { TimelineView } from '@/components/timeline/timeline-view';
import { TimelineItem } from '@/types/timeline.types';


interface RSVPPageProps {
    params: Promise<{
        token: string;
    }>;
}

export async function generateMetadata({ params }: RSVPPageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const { token } = resolvedParams;
    const guest = await getGuestByToken(token);

    if (!guest) {
        return { title: 'Invitación no encontrada' };
    }

    return {
        title: `Invitación para ${guest.full_name} - ${guest.event.name}`,
        description: `Confirma tu asistencia al evento ${guest.event.name}.`,
    };
}

export default async function RSVPPage({ params }: RSVPPageProps) {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    const guest = await getGuestByToken(token);

    if (!guest) {
        notFound();
    }

    // Extraído del invitado
    const event = guest.event;

    // Obtener fotos
    const { data: photosData } = await getEventPhotos({ eventId: event.id, limit: 50 });


    // Transformar fotos
    const photos = (photosData || []).map(p => ({
        ...p,
        status: p.status as 'approved' | 'pending' | 'rejected'
    }));

    // Obtener Timeline
    const timelineItems = await getTimeline(event.id) as TimelineItem[];
    const showTimeline = timelineItems.length > 0;
    const showLocation = !!(event.location_name || event.location_address || (event.settings as any)?.location?.lat);


    // Permitir acceso para pruebas, solo mostrar banner de advertencia si no está publicado
    // if (event.status !== 'published') {
    //     return ( ... );
    // }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?auto=format&fit=crop&q=80')] bg-cover bg-center overflow-x-hidden">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" /> {/* Increased overlay opacity */}

            {event.status !== 'published' && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-600/90 text-white text-center text-xs py-1 z-50">
                    Modo Vista Previa: Evento no publicado ({event.status})
                </div>
            )}

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8 pt-6">

                {/* Show Design First - Safety wrapped */}
                {/* Show Design First - Safety wrapped */}
                {guest.event.invitation_design && (
                    <div className="w-full transform scale-75 md:scale-90 lg:scale-100 origin-top flex justify-center">
                        <RSVPViewerWrapper design={guest.event.invitation_design} />
                    </div>
                )}

                <div className="w-full max-w-lg">

                    <Tabs defaultValue="rsvp" className="w-full">
                        <TabsList className={cn("grid w-full bg-slate-800/50 backdrop-blur-sm",
                            (showLocation && showTimeline) ? "grid-cols-4" :
                                (showLocation || showTimeline) ? "grid-cols-3" : "grid-cols-2"
                        )}>
                            <TabsTrigger value="rsvp" className="data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-300 hover:text-white transition-colors">Confirmar</TabsTrigger>
                            <TabsTrigger value="photos" className="data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-300 hover:text-white transition-colors">Galería</TabsTrigger>
                            {showTimeline && (
                                <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-300 hover:text-white transition-colors">Cronograma</TabsTrigger>
                            )}
                            {showLocation && (
                                <TabsTrigger value="location" className="data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-300 hover:text-white transition-colors">Ubicación</TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="rsvp" className="mt-6 focus-visible:outline-none">
                            <RSVPForm guest={guest} token={token} />
                        </TabsContent>
                        <TabsContent value="photos" className="mt-6 focus-visible:outline-none">
                            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-light text-white mb-2 font-heading">Galería del Evento</h2>
                                            <p className="text-slate-400">Comparte tus mejores momentos con nosotros.</p>
                                        </div>
                                    </div>

                                    <PhotoGallery photos={photos} />

                                    <PhotoUpload eventId={event.id} guestId={guest.id} />
                                </div>
                            </Card>


                        </TabsContent>

                        {showTimeline && (
                            <TabsContent value="timeline" className="mt-6 focus-visible:outline-none">
                                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden">
                                    <TimelineView items={timelineItems} />
                                </Card>
                            </TabsContent>
                        )}



                        {showLocation && (
                            <TabsContent value="location" className="mt-6 focus-visible:outline-none">

                                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden">
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h2 className="text-2xl font-light text-white mb-2 font-heading">Ubicación</h2>
                                            <p className="text-slate-400 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-violet-400" />
                                                {event.location_name || 'Ubicación'}
                                                {event.location_address && <span className="text-slate-500">• {event.location_address}</span>}
                                            </p>
                                        </div>

                                        {(event.settings as any)?.location?.lat ? (
                                            <div className="rounded-xl overflow-hidden border border-slate-700/50">
                                                <EventMap
                                                    lat={(event.settings as any).location.lat}
                                                    lng={(event.settings as any).location.lng}
                                                    venueName={event.location_name}
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-center p-6 gap-4">
                                                <MapPin className="w-12 h-12 text-slate-600" />
                                                <p className="text-slate-400 max-w-sm">
                                                    El mapa interactivo no está disponible, pero puedes ver la ubicación en Google Maps.
                                                </p>
                                                <Button
                                                    variant="secondary"
                                                    asChild
                                                >
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.location_name || ''} ${event.location_address || ''}`.trim())}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Abrir en Google Maps
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                <p className="text-center text-slate-500 text-xs mt-8 pb-8">
                    Powered by <span className="text-violet-400 font-semibold">EventHub</span>
                </p>
            </div >
        </div >
    );
}
