export interface InvitationEmailProps {
    guestName: string;
    eventName: string;
    eventDate: string;
    eventLocation: string;
    rsvpLink: string;
}

export const InvitationEmailHtml = ({
    guestName,
    eventName,
    eventDate,
    eventLocation,
    rsvpLink,
}: InvitationEmailProps) => `
  <div style="font-family: sans-serif; background-color: #020617; color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">EventHub</h1>
    </div>
    
    <div style="padding: 20px; background-color: #0f172a; border-radius: 8px; border: 1px solid #334155;">
        <h2 style="font-size: 22px; border-bottom: 1px solid #334155; padding-bottom: 10px; color: #ffffff;">
            ¡Estás invitado a ${eventName}!
        </h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">
            Hola <strong>${guestName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">
            Nos encantaría que nos acompañes en esta fecha tan especial. Aquí tienes los detalles del evento:
        </p>
        
        <div style="margin: 25px 0; padding: 15px; background-color: #1e293b; border-radius: 6px; color: #f8fafc;">
            <p style="margin: 5px 0;">📅 <strong>Fecha:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;">📍 <strong>Lugar:</strong> ${eventLocation}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="${rsvpLink}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">
                Confirmar Asistencia
            </a>
        </div>
        
        <p style="font-size: 14px; color: #94a3b8; margin-top: 30px; text-align: center;">
            O copia y pega este link en tu navegador:<br/>
            <span style="color: #a78bfa; word-break: break-all;">${rsvpLink}</span>
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 40px; color: #64748b; font-size: 12px;">
        <p>© 2026 EventHub. Todos los derechos reservados.</p>
    </div>
  </div>
`;
