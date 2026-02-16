
import { getEvents } from '@/app/actions/events';
import { CreateEventDialog } from '@/components/dashboard/events/create-event-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPinIcon, MoreVertical, Edit } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define interface for Event based on getEvents return
interface Event {
    id: string;
    name: string;
    date: string;
    location_address?: string;
    max_guests?: number;
    status: string;
    created_at: string;
}

import { checkPlanLimits } from '@/lib/plans';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Crown } from 'lucide-react';

export default async function EventsPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get tenant ID
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user!.id)
        .single();

    // Check limits
    let canCreate = true;
    let limitMessage = '';

    if (tenantUser) {
        const check = await checkPlanLimits(tenantUser.tenant_id, 'events');
        canCreate = check.allowed;
        limitMessage = check.message || '';
    }

    const events = await getEvents() as unknown as Event[];

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mis Eventos</h1>
                    <p className="text-muted-foreground">Gestiona y organiza todos tus eventos desde aquí.</p>
                </div>

                {canCreate ? (
                    <CreateEventDialog />
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-500 font-medium hidden md:inline-block">
                            {limitMessage}
                        </span>
                        <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700">
                            <Link href="/dashboard/settings/billing">
                                <Crown className="mr-2 h-4 w-4" />
                                Actualizar Plan
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="overflow-hidden text-ellipsis whitespace-nowrap pr-2" title={event.name}>
                                {event.name}
                            </CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <Link href={`/dashboard/events/${event.id}`}>
                                        <DropdownMenuItem>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Gestionar
                                        </DropdownMenuItem>
                                    </Link>
                                    {/* Delete action implementation pending */}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {event.date ? format(new Date(event.date), "d 'de' MMMM, yyyy", { locale: es }) : 'Sin fecha'}
                                </div>
                                {event.location_address && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <MapPinIcon className="mr-2 h-4 w-4" />
                                        {event.location_address}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4">
                                <Link href={`/dashboard/events/${event.id}`}>
                                    <Button className="w-full" variant="outline">
                                        Ver Detalles
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {events.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <h3 className="text-xl font-semibold mb-2">No tienes eventos creados</h3>
                    <p className="text-muted-foreground mb-6">Comienza creando tu primer evento para gestionarlo.</p>
                    {canCreate ? (
                        <CreateEventDialog />
                    ) : (
                        <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700">
                            <Link href="/dashboard/settings/billing">
                                Actualizar Plan
                            </Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
