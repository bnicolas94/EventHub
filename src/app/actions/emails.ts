'use server';

import { Resend } from 'resend';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { InvitationEmailHtml } from '@/components/emails/invitation-template';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendGuestInvitation(guestId: string) {
    try {
        const supabase = await createServiceRoleClient();

        // 1. Fetch guest and event info
        const { data: guest, error: fetchError } = await supabase
            .from('guests')
            .select(`
                id,
                full_name,
                email,
                invitation_token,
                event:events (
                    name,
                    date,
                    location_name
                )
            `)
            .eq('id', guestId)
            .single();

        if (fetchError || !guest) {
            return { success: false, error: 'Invitado no encontrado' };
        }

        if (!guest.email) {
            return { success: false, error: 'El invitado no tiene correo electrónico' };
        }

        if (!guest.event) {
            return { success: false, error: 'Datos del evento no encontrados para este invitado' };
        }

        const event = Array.isArray(guest.event) ? guest.event[0] : guest.event;

        if (!event || !event.name) {
            return { success: false, error: 'Información del evento incompleta' };
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const rsvpLink = `${appUrl}/rsvp/${guest.invitation_token}`;

        // 2. Send Email via Resend (with timeout)
        const sendPromise = resend.emails.send({
            from: 'onboard@resend.dev',
            to: [guest.email],
            subject: `Te invitamos a: ${event.name}`,
            html: InvitationEmailHtml({
                guestName: guest.full_name,
                eventName: event.name,
                eventDate: event.date ? new Date(event.date).toLocaleDateString('es-ES', { dateStyle: 'long' }) : 'Fecha por confirmar',
                eventLocation: event.location_name || 'Ubicación por confirmar',
                rsvpLink: rsvpLink
            }),
        });

        // Timeout after 10 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Resend timeout')), 10000)
        );

        const { data, error } = await Promise.race([sendPromise, timeoutPromise]) as any;

        if (error) {
            console.error('Resend API Error:', error);
            return { success: false, error: error.message || 'Error en el servicio de email' };
        }

        // 3. Update guest status
        await supabase
            .from('guests')
            .update({ invitation_sent_at: new Date().toISOString() })
            .eq('id', guestId);

        return { success: true, messageId: data?.id };
    } catch (error: any) {
        console.error('Send Invitation General Exception:', error);
        const message = error.message === 'Resend timeout'
            ? 'La conexión con Resend tardó demasiado. Verifica tu API Key o conexión.'
            : error.message || 'Error desconocido';
        return { success: false, error: message };
    }
}
