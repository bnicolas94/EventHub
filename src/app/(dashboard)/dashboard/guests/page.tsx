import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GuestFormDialog } from '@/components/guests/guest-form-dialog';
import { GuestTable } from '@/components/guests/guest-table';
import { getActiveEvent } from '@/app/actions/events';
import { getGuests } from '@/app/actions/guests';
import { ImportGuestsDialog } from '@/components/guests/import-guests-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { SendInvitationsDialog } from '@/components/guests/send-invitations-dialog';

import { FeatureGate } from '@/components/shared/feature-gate';

export default async function GuestsPage() {
    const supabase = await createServerSupabaseClient();

    // 1. Get current tenant/user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>No autorizado</div>;

    // 2. Get User's Tenant
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) return <div>No se encontró tenant para el usuario.</div>;

    // 3. Get Active/Latest Event
    const event = await getActiveEvent(tenantUser.tenant_id);

    // If no event, we should show "Create Event First".
    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-semibold text-white">No tienes eventos creados</h2>
                <p className="text-slate-400">Crea tu primer evento para gestionar invitados.</p>
            </div>
        );
    }

    // 3. Get Guests for this event
    const guests = await getGuests(event.id);

    // 4. Calculate Stats
    const total = guests.length;
    const confirmed = guests.filter((g: any) => g.rsvp_status === 'confirmed').length;
    const pending = guests.filter((g: any) => g.rsvp_status === 'pending' || g.rsvp_status === 'opened').length;
    const declined = guests.filter((g: any) => g.rsvp_status === 'declined').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Invitados: {event.name}</h2>
                    <p className="text-slate-400 mt-1">
                        Gestiona tu lista de invitados y envía invitaciones
                    </p>
                </div>
                <div className="flex gap-2">
                    <FeatureGate feature="mass_communications">
                        <SendInvitationsDialog eventId={event.id} guests={guests} />
                    </FeatureGate>
                    <FeatureGate feature="csv_import">
                        <ImportGuestsDialog eventId={event.id} />
                    </FeatureGate>
                    <GuestFormDialog eventId={event.id} />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/[0.03] border-white/[0.06]">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Total</p>
                            <p className="text-2xl font-bold text-white">{total}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500/50" />
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/[0.06]">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Confirmados</p>
                            <p className="text-2xl font-bold text-emerald-400">{confirmed}</p>
                        </div>
                        <UserCheck className="w-8 h-8 text-emerald-500/50" />
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/[0.06]">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Pendientes</p>
                            <p className="text-2xl font-bold text-amber-400">{pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-amber-500/50" />
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/[0.06]">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Rechazados</p>
                            <p className="text-2xl font-bold text-red-400">{declined}</p>
                        </div>
                        <UserX className="w-8 h-8 text-red-500/50" />
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <GuestTable key={event.id} guests={guests} />


        </div>
    );
}
