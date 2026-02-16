'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveInvitation(eventId: string, designJSON: any) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'No autorizado' };
        }

        // Verify user owns the event (via tenant)
        // For now we assume eventId is passed from trusted server component or verified here.
        // Ideally we re-verify ownership.
        // The RLS on 'events' table should protect update if setup correctly.
        // But we are using Service Client in some places? No, createServerSupabaseClient uses user session.
        // So RLS will apply. If the user owns the event's tenant, they can update.

        const { error } = await supabase
            .from('events')
            .update({ invitation_design: designJSON })
            .eq('id', eventId);

        if (error) {
            console.error('Save design error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/dashboard/invitations`);
        return { success: true };
    } catch (error) {
        console.error('Save design exception:', error);
        return { success: false, error: 'Error al guardar diseño' };
    }
}

export async function getInvitationDesign(eventId: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from('events')
        .select('invitation_design')
        .eq('id', eventId)
        .single();

    if (error) {
        return null;
    }
    return data.invitation_design;
}
