'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const timelineItemSchema = z.object({
    title: z.string().min(1, 'El título es obligatorio'),
    description: z.string().optional(),
    start_time: z.string().refine((val) => !isNaN(Date.parse(val)), 'Hora de inicio inválida'),
    end_time: z.string().optional(),
    icon: z.string().default('clock'),
    order: z.number().int().optional(),
});

export async function createTimelineItem(eventId: string, data: z.infer<typeof timelineItemSchema>) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autorizado' };

    // Check ownership of event
    const { data: event } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();

    if (!event) return { success: false, error: 'Evento no encontrado' };

    const { error } = await supabase
        .from('event_timeline_items')
        .insert({
            event_id: eventId,
            ...data
        });

    if (error) {
        console.error('Error creating timeline item:', error);
        return { success: false, error: 'Error al crear el item' };
    }

    revalidatePath(`/dashboard/events/${eventId}/timeline`);
    return { success: true };
}

export async function updateTimelineItem(itemId: string, eventId: string, data: Partial<z.infer<typeof timelineItemSchema>>) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
        .from('event_timeline_items')
        .update(data)
        .eq('id', itemId)
        .eq('event_id', eventId);

    if (error) {
        console.error('Error updating timeline item:', error);
        return { success: false, error: 'Error al actualizar el item' };
    }

    revalidatePath(`/dashboard/events/${eventId}/timeline`);
    return { success: true };
}

export async function deleteTimelineItem(itemId: string, eventId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
        .from('event_timeline_items')
        .delete()
        .eq('id', itemId)
        .eq('event_id', eventId);

    if (error) {
        console.error('Error deleting timeline item:', error);
        return { success: false, error: 'Error al eliminar el item' };
    }

    revalidatePath(`/dashboard/events/${eventId}/timeline`);
    return { success: true };
}

export async function reorderTimelineItems(eventId: string, items: { id: string; order: number }[]) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autorizado' };

    // Batch update via Promise.all
    // In production, consider RPC call for atomicity
    const updates = items.map(item =>
        supabase
            .from('event_timeline_items')
            .update({ order: item.order })
            .eq('id', item.id)
            .eq('event_id', eventId)
    );

    await Promise.all(updates);

    revalidatePath(`/dashboard/events/${eventId}/timeline`);
    return { success: true };
}

export async function getTimeline(eventId: string) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('event_timeline_items')
        .select('*')
        .eq('event_id', eventId)
        .order('order', { ascending: true })
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching timeline:', error);
        return [];
    }

    return data;
}
