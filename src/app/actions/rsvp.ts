'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { Guest } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export interface RSVPData {
    status: 'confirmed' | 'declined';
    dietary_restrictions: string;
    confirmed_companions: number;
    companion_names: string; // Comma separated
    notes: string;
}

export async function getGuestByToken(token: string) {
    // Use service role client to bypass RLS since unauthenticated users access this
    const supabase = await createServiceRoleClient();

    // Fetch guest and event details
    const { data: guest, error } = await supabase
        .from('guests')
        .select(`
            id, 
            full_name, 
            plus_ones_allowed, 
            plus_ones_confirmed,
            plus_ones_names,
            rsvp_status,
            dietary_restrictions,
            event:events (
                id,
                name,
                date,
                location_name,
                location_address,
                invitation_design,
                settings,
                status
            )
        `)
        .eq('invitation_token', token)
        .single();

    if (error || !guest) {
        console.error('Error fetching guest by token:', error);
        return null;
    }

    // Normalize event if returned as array
    const eventData = Array.isArray(guest.event) ? guest.event[0] : guest.event;

    return {
        ...guest,
        event: eventData
    };
}

export async function submitRSVP(token: string, data: RSVPData) {
    const supabase = await createServiceRoleClient();

    const companionNamesArray = data.companion_names
        ? data.companion_names.split(',').map(n => n.trim()).filter(n => n)
        : [];

    const updateData = {
        rsvp_status: data.status,
        dietary_restrictions: { notes: data.dietary_restrictions }, // Assuming JSON structure
        plus_ones_confirmed: data.confirmed_companions,
        plus_ones_names: companionNamesArray,
        notes: data.notes,
        responded_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('guests')
        .update(updateData)
        .eq('invitation_token', token);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath(`/rsvp/${token}`);
    return { success: true };
}
