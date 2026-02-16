'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ChecklistItem {
    id: string;
    event_id: string;
    title: string;
    description: string | null;
    is_completed: boolean;
    sort_order: number;
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
}

const DEFAULT_TASKS = [
    { title: 'Definir fecha y lugar del evento', sort_order: 1 },
    { title: 'Crear lista preliminar de invitados', sort_order: 2 },
    { title: 'Diseñar invitaciones digitales', sort_order: 3 },
    { title: 'Enviar invitaciones', sort_order: 4 },
    { title: 'Organizar distribución de mesas', sort_order: 5 },
    { title: 'Confirmar menú y restricciones', sort_order: 6 },
];

export async function getChecklist(eventId: string): Promise<ChecklistItem[]> {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = await createServiceRoleClient();

    // 1. Verify user has access to the event (uses RLS on 'events' table)
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();

    if (eventError || !event) {
        console.error('Checklist Error: Event not found or unauthorized', eventId);
        return [];
    }

    // 2. Fetch/Initialize checklist items using Admin Client (bypasses RLS on checklist_items)
    const { data, error } = await adminSupabase
        .from('checklist_items')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching checklist:', error);
        return [];
    }

    // 3. If empty, initialize default tasks
    if (data.length === 0) {
        const { data: newData, error: insertError } = await adminSupabase
            .from('checklist_items')
            .insert(DEFAULT_TASKS.map(task => ({
                ...task,
                event_id: eventId
            })))
            .select();

        if (insertError) {
            console.error('Error initializing checklist:', insertError);
            return [];
        }
        return newData;
    }

    return data;
}

export async function toggleChecklistItem(itemId: string, completed: boolean) {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = await createServiceRoleClient();

    // 1. Get the item and its event_id
    const { data: item, error: fetchError } = await adminSupabase
        .from('checklist_items')
        .select('event_id')
        .eq('id', itemId)
        .single();

    if (fetchError || !item) {
        return { success: false, error: 'Tarea no encontrada' };
    }

    // 2. Verify user has access to that event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('id', item.event_id)
        .single();

    if (eventError || !event) {
        return { success: false, error: 'No autorizado' };
    }

    // 3. Update the item
    const { error } = await adminSupabase
        .from('checklist_items')
        .update({
            is_completed: completed,
            completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', itemId);

    if (error) {
        console.error('Error toggling checklist item:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
