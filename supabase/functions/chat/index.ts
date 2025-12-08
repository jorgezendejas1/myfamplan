/**
 * Chat Edge Function
 * 
 * Handles AI chat requests using Lovable AI Gateway.
 * Provides calendar assistant functionality with context-aware responses.
 * Supports event creation via tool calling.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `Eres un asistente de calendario inteligente en español. Tu objetivo es ayudar a los usuarios a gestionar su tiempo y eventos de calendario.

Capacidades:
- Crear eventos: Ayuda a los usuarios a crear citas, reuniones, recordatorios y tareas
- Consultar disponibilidad: Analiza la agenda y sugiere horarios libres
- Buscar eventos: Encuentra eventos por título, fecha o tipo
- Recordatorios: Configura alertas y recordatorios
- Consejos de productividad: Ofrece sugerencias para organizar mejor el tiempo

Cuando el usuario quiera crear un evento, USA la función create_event para crearlo.

Para fechas relativas:
- "mañana" = día siguiente a la fecha actual
- "la próxima semana" = 7 días después
- "el viernes" = el próximo viernes desde la fecha actual

Formato de respuesta:
- Usa Markdown para formatear (negrita, listas, etc.)
- Sé conciso pero amable
- Usa emojis relevantes con moderación (📅, ⏰, 📌, 💡)
- Siempre confirma cuando creas un evento exitosamente

Atajos de teclado del calendario (menciona cuando sea relevante):
- J/K: Navegar períodos
- T: Ir a hoy
- C: Crear evento rápido
- 1-4: Cambiar vista (Día/Semana/Mes/Agenda)
- ?: Ver ayuda completa`;

const CREATE_EVENT_TOOL = {
  type: "function",
  function: {
    name: "create_event",
    description: "Crea un nuevo evento en el calendario. Usa esta función cuando el usuario quiera agendar una cita, reunión, tarea o recordatorio.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Título del evento"
        },
        start_time: {
          type: "string",
          description: "Fecha y hora de inicio en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss)"
        },
        end_time: {
          type: "string",
          description: "Fecha y hora de fin en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss)"
        },
        description: {
          type: "string",
          description: "Descripción del evento (opcional)"
        },
        event_type: {
          type: "string",
          enum: ["event", "task", "reminder", "birthday"],
          description: "Tipo de evento: event (evento), task (tarea), reminder (recordatorio), birthday (cumpleaños)"
        },
        all_day: {
          type: "boolean",
          description: "Si es un evento de todo el día"
        },
        location: {
          type: "string",
          description: "Ubicación del evento (opcional)"
        }
      },
      required: ["title", "start_time", "end_time"]
    }
  }
};

const GET_EVENTS_TOOL = {
  type: "function",
  function: {
    name: "get_events",
    description: "Obtiene los eventos del calendario. Usa esta función para consultar eventos existentes, verificar disponibilidad o buscar citas.",
    parameters: {
      type: "object",
      properties: {
        from_date: {
          type: "string",
          description: "Fecha inicial para buscar eventos en formato ISO 8601"
        },
        to_date: {
          type: "string",
          description: "Fecha final para buscar eventos en formato ISO 8601"
        },
        search: {
          type: "string",
          description: "Texto para buscar en el título de los eventos (opcional)"
        }
      },
      required: []
    }
  }
};

async function createEvent(supabase: any, eventData: any): Promise<{ success: boolean; event?: any; error?: string }> {
  try {
    const eventId = crypto.randomUUID();
    const calendarId = 'default';
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        event_id: eventId,
        calendar_id: calendarId,
        title: eventData.title,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        description: eventData.description || '',
        event_type: eventData.event_type || 'event',
        all_day: eventData.all_day || false,
        location: eventData.location || null,
        notifications: [],
        recurrence: 'none',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Event created successfully:', data.id);
    return { success: true, event: data };
  } catch (err) {
    console.error('Exception creating event:', err);
    return { success: false, error: 'Error al crear el evento' };
  }
}

async function getEvents(supabase: any, params: any): Promise<{ success: boolean; events?: any[]; error?: string }> {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .eq('is_deleted', false);
    
    if (params.from_date) {
      query = query.gte('start_time', params.from_date);
    }
    if (params.to_date) {
      query = query.lte('end_time', params.to_date);
    }
    if (params.search) {
      query = query.ilike('title', `%${params.search}%`);
    }
    
    const { data, error } = await query.order('start_time', { ascending: true }).limit(20);
    
    if (error) {
      console.error('Error fetching events:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, events: data };
  } catch (err) {
    console.error('Exception fetching events:', err);
    return { success: false, error: 'Error al obtener eventos' };
  }
}

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build context-aware system prompt
    let enhancedPrompt = SYSTEM_PROMPT;
    
    if (context) {
      enhancedPrompt += `\n\nContexto actual del usuario:
- Fecha y hora actual: ${context.currentDate || new Date().toISOString()}
- Eventos próximos: ${context.eventCount || 0} eventos
- Vista actual: ${context.view || 'mes'}`;
    }

    console.log("Sending request to Lovable AI Gateway with tools...");

    // First request - allow tool calling
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
        tools: [CREATE_EVENT_TOOL, GET_EVENTS_TOOL],
        stream: false,
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

    const aiResponse = await response.json();
    const choice = aiResponse.choices?.[0];
    
    if (!choice) {
      throw new Error("No response from AI");
    }

    const message = choice.message;
    
    // Check if there are tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log("Processing tool calls:", message.tool_calls.length);
      
      const toolResults = [];
      let createdEvents = [];
      let fetchedEvents = [];
      
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, args);
        
        if (functionName === 'create_event') {
          const result = await createEvent(supabase, args);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result)
          });
          if (result.success && result.event) {
            createdEvents.push(result.event);
          }
        } else if (functionName === 'get_events') {
          const result = await getEvents(supabase, args);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result)
          });
          if (result.success && result.events) {
            fetchedEvents = result.events;
          }
        }
      }
      
      // Send the tool results back to get final response
      const finalMessages = [
        { role: "system", content: enhancedPrompt },
        ...messages,
        message,
        ...toolResults
      ];
      
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: finalMessages,
          stream: false,
        }),
      });
      
      if (!finalResponse.ok) {
        throw new Error("Error getting final response");
      }
      
      const finalData = await finalResponse.json();
      const finalContent = finalData.choices?.[0]?.message?.content || "Operación completada.";
      
      // Return response with metadata about created events
      return new Response(
        JSON.stringify({ 
          content: finalContent,
          created_events: createdEvents,
          fetched_events: fetchedEvents
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // No tool calls, return the regular response
    return new Response(
      JSON.stringify({ 
        content: message.content || "No tengo una respuesta para eso.",
        created_events: [],
        fetched_events: []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
