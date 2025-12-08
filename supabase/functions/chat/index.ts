/**
 * Chat Edge Function
 * 
 * Handles AI chat requests using Lovable AI Gateway.
 * Provides calendar assistant functionality with context-aware responses.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un asistente de calendario inteligente en español. Tu objetivo es ayudar a los usuarios a gestionar su tiempo y eventos de calendario.

Capacidades:
- Crear eventos: Ayuda a los usuarios a crear citas, reuniones, recordatorios y tareas
- Consultar disponibilidad: Analiza la agenda y sugiere horarios libres
- Buscar eventos: Encuentra eventos por título, fecha o tipo
- Recordatorios: Configura alertas y recordatorios
- Consejos de productividad: Ofrece sugerencias para organizar mejor el tiempo

Formato de respuesta:
- Usa Markdown para formatear (negrita, listas, etc.)
- Sé conciso pero amable
- Usa emojis relevantes con moderación (📅, ⏰, 📌, 💡)
- Si el usuario quiere crear un evento, extrae: título, fecha, hora y duración
- Si no entiendes algo, pide clarificación amablemente

Atajos de teclado del calendario (menciona cuando sea relevante):
- J/K: Navegar períodos
- T: Ir a hoy
- C: Crear evento rápido
- 1-4: Cambiar vista (Día/Semana/Mes/Agenda)
- ?: Ver ayuda completa`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("API key not configured");
    }

    // Build context-aware system prompt
    let enhancedPrompt = SYSTEM_PROMPT;
    
    if (context) {
      enhancedPrompt += `\n\nContexto actual del usuario:
- Fecha actual: ${context.currentDate || new Date().toLocaleDateString('es')}
- Eventos próximos: ${context.eventCount || 0} eventos
- Vista actual: ${context.view || 'mes'}`;
    }

    console.log("Sending request to Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: enhancedPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor, espera un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar créditos al espacio de trabajo." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Error al procesar la solicitud" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
