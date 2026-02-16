'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createEventSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    location_address: z.string().optional(),
    max_guests: z.coerce.number().int().positive().optional(),
});


export async function getEvents() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) {
        return [];
    }

    const { data: events, error } = await supabase
        .from('events')

        .select('id, name, date, location_address, max_guests, status, created_at')

        .eq('tenant_id', tenantUser.tenant_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }


    return events;
}

export async function getEventById(eventId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) return null;

    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('tenant_id', tenantUser.tenant_id)
        .single();

    if (error) {
        console.error('Error fetching event:', error);
        return null;
    }

    return event;
}


export async function setActiveEvent(eventId: string) {
    const cookieStore = await cookies();
    cookieStore.set('active_event_id', eventId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    revalidatePath('/dashboard', 'layout');
    return { success: true };
}

export async function getActiveEventId() {
    const cookieStore = await cookies();
    const eventId = cookieStore.get('active_event_id')?.value;
    return eventId;
}

export async function getActiveEvent(tenantId: string) {
    const supabase = await createServerSupabaseClient();
    const cookieStore = await cookies();
    const activeEventId = cookieStore.get('active_event_id')?.value;

    let event = null;

    if (activeEventId) {
        const { data: activeEvent } = await supabase
            .from('events')
            .select('*')
            .eq('id', activeEventId)
            .eq('tenant_id', tenantId)
            .single();

        if (activeEvent) {
            event = activeEvent;
        }
    }

    if (!event) {
        const { data: latestEvent } = await supabase
            .from('events')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        event = latestEvent;
    }

    return event;
}

export async function updateEventSettings(eventId: string, settings: any) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autorizado' };

    // Actualizar el evento con nuevas configuraciones (fusionar con existentes si es necesario)
    // Primero obtener configuraciones actuales para fusionar
    const { data: currentEvent } = await supabase
        .from('events')
        .select('settings')
        .eq('id', eventId)
        .single();

    const currentSettings = currentEvent?.settings || {};
    const newSettings = { ...currentSettings, ...settings };

    const { error } = await supabase
        .from('events')
        .update({ settings: newSettings })
        .eq('id', eventId);

    if (error) {
        console.error('Error updating event settings:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard', 'layout');
    return { success: true };
}

export async function updateEvent(eventId: string, data: any) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', eventId);

    if (error) {
        console.error('Error updating event:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard', 'layout');
    return { success: true };
}

export async function createEvent(prevState: any, formData: FormData) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'No autorizado' };
    }

    const rawData = {
        name: formData.get('name'),
        date: formData.get('date'),
        location_address: formData.get('location_address'),
        max_guests: formData.get('max_guests'),
    };

    const validatedFields = createEventSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Datos inválidos',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();


    if (!tenantUser) {
        return { success: false, error: 'Usuario no asociado a un tenant' };
    }

    // [NEW] Check plan limits
    const { checkPlanLimits } = await import('@/lib/plans');
    const limitCheck = await checkPlanLimits(tenantUser.tenant_id, 'events');

    if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.message || 'Límite de plan alcanzado' };
    }

    const { data: event, error } = await supabase

        .from('events')
        .insert({
            tenant_id: tenantUser.tenant_id,
            name: validatedFields.data.name,
            date: validatedFields.data.date,
            location_address: validatedFields.data.location_address,
            max_guests: validatedFields.data.max_guests || 100, // Default to 100
            status: 'draft',
            settings: {}
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating event:', error);
        return { success: false, error: 'Error al crear el evento' };
    }

    revalidatePath('/dashboard/events');
    return { success: true, eventId: event.id };
}

export async function deleteEvent(eventId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autorizado' };

    // Check if event belongs to tenant of user
    const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

    if (!tenantUser) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('tenant_id', tenantUser.tenant_id);

    if (error) {
        console.error('Error deleting event:', error);
        return { success: false, error: error.message };
    }

    // Clear active event cookie if it was the deleted one
    const cookieStore = await cookies();
    const activeEventId = cookieStore.get('active_event_id')?.value;
    if (activeEventId === eventId) {
        cookieStore.delete('active_event_id');
    }

    revalidatePath('/dashboard/events');
    return { success: true };
}
