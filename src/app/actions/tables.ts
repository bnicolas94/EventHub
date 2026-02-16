'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyFeatureAccess } from '@/lib/gating';

export interface Table {
    id: string;
    event_id: string;
    name: string;
    seats: number;
    shape: 'round' | 'rectangular' | 'square';
    x: number;
    y: number;
    rotation: number;
    guests?: any[]; // For now just basic info
}

export async function getTables(eventId: string) {
    const supabase = await createServerSupabaseClient();

    const { data: tables, error } = await supabase
        .from('tables')
        .select(`
            *,
            guests:guests!guests_table_id_fkey (
                id,
                full_name,
                rsvp_status
            )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching tables:', error);
        return [];
    }

    // Map DB columns to frontend model
    return tables.map(t => ({
        id: t.id,
        event_id: t.event_id,
        name: t.label || `Mesa ${t.table_number}`,
        seats: t.capacity,
        shape: t.shape,
        x: t.x_position,
        y: t.y_position,
        rotation: t.rotation || 0,
        guests: t.guests
    }));
}

export async function upsertTable(table: Partial<Table>) {
    const hasAccess = await verifyFeatureAccess('tables');
    if (!hasAccess) return { success: false, error: 'Función no disponible en tu plan' };

    const supabase = await createServerSupabaseClient();

    // Map frontend model to DB columns
    const dbTable = {
        event_id: table.event_id,
        label: table.name,
        capacity: table.seats,
        shape: table.shape,
        x_position: table.x,
        y_position: table.y,
        rotation: table.rotation,
    };

    // Remove undefined/null keys to avoid overwriting with nulls if partial update
    Object.keys(dbTable).forEach(key => {
        if (dbTable[key as keyof typeof dbTable] === undefined) {
            delete dbTable[key as keyof typeof dbTable];
        }
    });

    let result;

    if (table.id) {
        // UPDATE existing table
        result = await supabase
            .from('tables')
            .update(dbTable)
            .eq('id', table.id)
            .select()
            .single();
    } else {
        // INSERT new table
        // We need to ensure table_number is set
        const newTable = {
            ...dbTable,
            // Generate a simple number if not provided (DB should handle unique)
            table_number: Math.floor(Date.now() / 1000) % 10000
        };

        result = await supabase
            .from('tables')
            .insert(newTable)
            .select()
            .single();
    }

    if (result.error) {
        console.error('Error saving table:', result.error);
        return { success: false, error: result.error.message };
    }

    const data = result.data;

    // Map back for response (optional, but good for consistency)
    const mappedData = {
        id: data.id,
        event_id: data.event_id,
        name: data.label,
        seats: data.capacity,
        shape: data.shape,
        x: data.x_position,
        y: data.y_position,
        rotation: data.rotation || 0
    };

    // revalidatePath('/dashboard/tables');
    return { success: true, data: mappedData };
}

export async function deleteTable(tableId: string) {
    const hasAccess = await verifyFeatureAccess('tables');
    if (!hasAccess) return { success: false, error: 'Función no disponible en tu plan' };

    const supabase = await createServerSupabaseClient();

    // First unassign guests (optional, but good practice if no cascade)
    await supabase
        .from('guests')
        .update({ table_id: null })
        .eq('table_id', tableId);

    const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

    if (error) {
        return { success: false, error: error.message };
    }

    // revalidatePath('/dashboard/tables');
    return { success: true };
}

export async function assignGuestToTable(guestId: string, tableId: string | null) {
    const hasAccess = await verifyFeatureAccess('tables');
    if (!hasAccess) return { success: false, error: 'Función no disponible en tu plan' };

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('guests')
        .update({ table_id: tableId })
        .eq('id', guestId);

    if (error) {
        return { success: false, error: error.message };
    }

    // revalidatePath('/dashboard/tables');
    return { success: true };
}
