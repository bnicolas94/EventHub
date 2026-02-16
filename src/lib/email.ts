
import { Resend } from 'resend';

// Initialize Resend if API key is present
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

export async function sendEmail({ to, subject, html, from = 'EventHub <onboarding@resend.dev>' }: EmailOptions) {
    if (!resend) {
        console.log('---------------------------------------------------');
        console.log('simulate_email_send:', { to, subject });
        console.log('content_preview:', html.substring(0, 100) + '...');
        console.log('---------------------------------------------------');
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, id: 'mock-id-' + Date.now() };
    }

    try {
        const data = await resend.emails.send({
            from,
            to,
            subject,
            html,
        });
        return { success: true, id: data.data?.id };
    } catch (error) {
        console.error('Resend Error:', error);
        return { success: false, error };
    }
}

export function generateInvitationEmailHtml(guestName: string, eventName: string, rsvpLink: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background-color: #f4f4f5; color: #18181b; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .button { display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 30px; font-size: 12px; color: #71717a; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>¡Hola ${guestName}!</h1>
        <p>Estás invitado al evento <strong>${eventName}</strong>.</p>
        <p>Nos encantaría contar con tu presencia. Por favor, confirma tu asistencia haciendo clic en el botón de abajo:</p>
        
        <div style="text-align: center;">
            <a href="${rsvpLink}" class="button">Ver Invitación y Confirmar</a>
        </div>

        <p style="margin-top: 30px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="font-size: 14px; color: #52525b; word-break: break-all;">${rsvpLink}</p>
        
        <div class="footer">
            <p>Enviado con EventHub</p>
        </div>
    </div>
</body>
</html>
    `;
}
