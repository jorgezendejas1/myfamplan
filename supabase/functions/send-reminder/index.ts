import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  to: string;
  eventTitle: string;
  eventStart: string;
  eventLocation?: string;
  eventDescription?: string;
  reminderTime: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send reminder function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      eventTitle, 
      eventStart, 
      eventLocation, 
      eventDescription,
      reminderTime 
    }: ReminderEmailRequest = await req.json();

    console.log(`Sending reminder email to ${to} for event: ${eventTitle}`);

    const eventDate = new Date(eventStart);
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4285f4; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📅 Recordatorio de Evento</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">${eventTitle}</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              <strong>⏰ ${reminderTime}</strong>
            </p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #333;">
                <strong>📆 Fecha:</strong> ${formattedDate}
              </p>
              <p style="margin: 5px 0; color: #333;">
                <strong>🕐 Hora:</strong> ${formattedTime}
              </p>
              ${eventLocation ? `
              <p style="margin: 5px 0; color: #333;">
                <strong>📍 Ubicación:</strong> ${eventLocation}
              </p>
              ` : ''}
            </div>
            ${eventDescription ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin-bottom: 10px;">Descripción:</h3>
              <p style="color: #666;">${eventDescription}</p>
            </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este es un recordatorio automático de tu calendario.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Calendario <onboarding@resend.dev>",
        to: [to],
        subject: `Recordatorio: ${eventTitle} - ${reminderTime}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reminder function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
