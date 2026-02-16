
import { getEventById, setActiveEvent } from '@/app/actions/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, MapPinIcon, UsersIcon, Play } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { notFound, redirect } from 'next/navigation';
import { EditEventForm } from '@/components/dashboard/events/edit-event-form';

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const event = await getEventById(eventId);

    if (!event) notFound();

    async function handleSetActive() {
        'use server';
        await setActiveEvent(event.id);
        redirect('/dashboard');
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{event.date ? format(new Date(event.date), "PPP p", { locale: es }) : 'Sin fecha'}</span>
                        </div>
                        {event.location_address && (
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="h-4 w-4" />
                                <span>{event.location_address}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <form action={handleSetActive}>
                        <Button variant="default">
                            <Play className="mr-2 h-4 w-4" />
                            Establecer como Activo
                        </Button>
                    </form>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Invitados</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{event.max_guests || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">Capacidad máxima estimada</p>
                    </CardContent>
                </Card>
                {/* Add more stats if available */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Editar Detalles</CardTitle>
                    <CardDescription>Actualiza la información básica del evento.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EditEventForm event={event} />
                </CardContent>
            </Card>
        </div>
    );
}
