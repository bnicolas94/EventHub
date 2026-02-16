'use server';

import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { InvitationEmailHtml } from '@/components/emails/invitation-template';
import { revalidatePath } from 'next/cache';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBulkInvitations(eventId: string, guestIds: string[]) {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = await createServiceRoleClient(); // Use for updates

    // 1. Fetch Event Details
    const { data: event } = await supabase
        .from('events')
        .select('name, date, location_name')
        .eq('id', eventId)
        .single();

    if (!event) return { success: false, error: 'Evento no encontrado' };

    // 2. Fetch Guests
    const { data: guests } = await supabase
        .from('guests')
        .select('id, full_name, email, invitation_token')
        .in('id', guestIds)
        .not('email', 'is', null);

    if (!guests || guests.length === 0) {
        return { success: false, error: 'No se encontraron invitados válidos con email.' };
    }

    let sentCount = 0;
    let failedCount = 0;
    const failures: { email: string; error: string }[] = [];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const eventDate = event.date ? new Date(event.date).toLocaleDateString('es-ES', { dateStyle: 'long' }) : 'Fecha por confirmar';

    // 3. Loop and Send
    for (const [index, guest] of guests.entries()) {
        if (!guest.email) continue;

        // Rate limit: 2 requests per second for Resend free tier.
        // We add a 500ms delay between requests (starting from the second one).
        if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        try {
            const rsvpLink = `${baseUrl}/rsvp/${guest.invitation_token}`;
            const html = InvitationEmailHtml({
                guestName: guest.full_name,
                eventName: event.name,
                eventDate,
                eventLocation: event.location_name || 'Ubicación por confirmar',
                rsvpLink
            });

            const { data, error } = await resend.emails.send({
                from: 'onboard@resend.dev',
                to: [guest.email],
                subject: `Te invitamos a: ${event.name}`,
                html
            });

            if (!error) {
                // Log communication ... (stays the same)
                await adminSupabase.from('communications').insert({
                    event_id: eventId,
                    type: 'invitation',
                    subject: `Invitación a ${event.name}`,
                    content: 'Email enviado automáticamente',
                    sent_at: new Date().toISOString(),
                    status: 'sent',
                    recipients_count: 1,
                    metadata: { guest_id: guest.id, resend_id: data?.id }
                });

                await adminSupabase.from('guests').update({
                    invitation_sent_at: new Date().toISOString()
                }).eq('id', guest.id);

                sentCount++;
            } else {
                failedCount++;
                failures.push({ email: guest.email, error: error.message });
                console.error(`Resend error for ${guest.email}:`, error);
            }
        } catch (err: any) {
            failedCount++;
            failures.push({ email: guest.email, error: err.message || 'Error desconocido' });
            console.error(`Exception sending to ${guest.email}:`, err);
        }
    }

    revalidatePath('/dashboard/guests');
    return { success: true, sent: sentCount, failed: failedCount, failures };
}
