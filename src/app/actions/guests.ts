'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateGuestInput {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    category: string;
    companion_limit: number;
}

export async function createGuest(data: CreateGuestInput, eventId: string) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();


        if (!user) {
            return { success: false, error: 'No autorizado' };
        }

        const { data: tenantUser } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('auth_id', user.id)
            .single();

        if (!tenantUser) {
            return { success: false, error: 'Usuario no asociado a un tenant' };
        }

        // [NEW] Check guest limits
        const { checkEventGuestLimit } = await import('@/lib/plans');
        const limitCheck = await checkEventGuestLimit(tenantUser.tenant_id, eventId, 1);

        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.message || 'Límite de invitados alcanzado' };
        }

        const { data: newGuest, error } = await supabase
            .from('guests')
            .insert({
                event_id: eventId,
                full_name: `${data.first_name} ${data.last_name}`.trim(),
                email: data.email || null,
                phone: data.phone || null,
                group_name: data.category,
                plus_ones_allowed: data.companion_limit,
                rsvp_status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Create guest error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/dashboard/guests`);
        return { success: true, data: newGuest };
    } catch (error) {
        console.error('Create guest exception:', error);
        return { success: false, error: 'Error al crear invitado' };
    }
}

export async function getGuests(eventId: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

    if (error) {
        return [];
    }
    return data;
}

export async function deleteGuest(guestId: string) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/guests');
    return { success: true };
}

export async function updateGuest(guestId: string, updates: Record<string, any>) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', guestId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/guests');
    return { success: true };
}

export async function importGuests(guests: CreateGuestInput[], eventId: string) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'No autorizado' };

        const { data: tenantUser } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('auth_id', user.id)
            .single();

        if (!tenantUser) {
            return { success: false, error: 'Usuario no asociado a un tenant' };
        }

        // [NEW] Check guest limits for batch
        const { checkEventGuestLimit } = await import('@/lib/plans');
        const limitCheck = await checkEventGuestLimit(tenantUser.tenant_id, eventId, guests.length);

        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.message || 'Límite de invitados alcanzado' };
        }

        // Transform to DB format
        const dbGuests = guests.map(g => ({
            event_id: eventId,
            full_name: `${g.first_name} ${g.last_name}`.trim(),
            email: g.email || null,
            phone: g.phone || null,
            group_name: g.category,
            plus_ones_allowed: g.companion_limit,
            rsvp_status: 'pending'
        }));

        const { error } = await supabase
            .from('guests')
            .insert(dbGuests);

        if (error) {
            console.error('Import error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/guests');
        return { success: true, count: guests.length };
    } catch (error) {
        console.error('Import exception:', error);
        return { success: false, error: 'Error al importar invitados' };
    }
}
