
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TimelineItem, CreateTimelineItemInput, UpdateTimelineItemInput } from '@/types/timeline.types';

export async function getEventTimeline(eventId: string) {
    const supabase = await createServerSupabaseClient();

    // We order by 'order' primarily, then 'start_time'
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

    return data as TimelineItem[];
}

export async function createTimelineItem(eventId: string, data: CreateTimelineItemInput) {
    const supabase = await createServerSupabaseClient();

    // Get max order to append
    const { data: maxOrderData } = await supabase
        .from('event_timeline_items')
        .select('order')
        .eq('event_id', eventId)
        .order('order', { ascending: false })
        .limit(1)
        .single();

    const nextOrder = (maxOrderData?.order ?? 0) + 1;

    const { data: newItem, error } = await supabase
        .from('event_timeline_items')
        .insert({
            event_id: eventId,
            ...data,
            order: data.order ?? nextOrder // Use provided order or append
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating timeline item:', error);
        throw new Error(error.message);
    }

    return newItem as TimelineItem;
}

export async function updateTimelineItem(itemId: string, data: UpdateTimelineItemInput) {
    const supabase = await createServerSupabaseClient();

    const { data: updatedItem, error } = await supabase
        .from('event_timeline_items')
        .update(data)
        .eq('id', itemId)
        .select()
        .single();

    if (error) {
        console.error('Error updating timeline item:', error);
        throw new Error(error.message);
    }

    return updatedItem as TimelineItem;
}

export async function deleteTimelineItem(itemId: string) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('event_timeline_items')
        .delete()
        .eq('id', itemId);

    if (error) {
        console.error('Error deleting timeline item:', error);
        throw new Error(error.message);
    }

    return true;
}

export async function reorderTimelineItems(eventId: string, items: { id: string; order: number }[]) {
    const supabase = await createServerSupabaseClient();

    // This could be optimized with a stored procedure or batch update if Supabase supported it easily via client
    // For MVP, we iterate. Constraints on 'order' uniqueness? No.

    const updates = items.map(item =>
        supabase
            .from('event_timeline_items')
            .update({ order: item.order })
            .eq('id', item.id)
            .eq('event_id', eventId) // Safety check
    );

    await Promise.all(updates);

    return true;
}
