/**
 * Chatbot Mock Service
 * 
 * Simulates Gemini AI API responses for calendar assistant functionality.
 * In production, replace with actual Gemini API calls.
 * 
 * Environment variable required for production:
 * - VITE_GEMINI_API_KEY: Your Google Gemini API key
 * 
 * To enable real Gemini integration:
 * 1. Set VITE_GEMINI_API_KEY in your .env file
 * 2. Uncomment the real API call code in sendMessage()
 * 3. Install @google/generative-ai if not already installed
 */

import { CalendarEvent } from '../types';

// Response type for chat messages
export interface ChatResponse {
  text: string;
  suggestedAction?: 'create_event' | 'show_availability' | 'set_reminder';
  eventData?: Partial<CalendarEvent>;
  confidence: number;
}

// Context passed to the AI for better responses
export interface ChatContext {
  events: CalendarEvent[];
  currentDate: Date;
  userName?: string;
}

// Predefined responses for common intents
const RESPONSES: Record<string, ChatResponse> = {
  greeting: {
    text: `¡Hola! 👋 Soy tu asistente de calendario. Puedo ayudarte a:

• **Crear eventos** - "Crear reunión mañana a las 10"
• **Buscar disponibilidad** - "¿Cuándo estoy libre esta semana?"
• **Recordatorios** - "Recuérdame llamar al médico"
• **Ver agenda** - "¿Qué tengo hoy?"

¿En qué puedo ayudarte?`,
    confidence: 1.0,
  },
  
  create_event: {
    text: `Perfecto, vamos a crear un evento. Necesito algunos detalles:

1. **¿Cuál es el título?**
2. **¿Cuándo?** (fecha y hora)
3. **¿Duración estimada?**

Puedes decirme algo como: "Reunión con Juan mañana a las 15:00 por 1 hora"`,
    suggestedAction: 'create_event',
    confidence: 0.9,
  },
  
  availability: {
    text: `📅 Analizando tu disponibilidad esta semana:

| Día | Mañana | Tarde |
|-----|--------|-------|
| Lunes | ✅ Libre | 🔴 Ocupado |
| Martes | ✅ Libre | ✅ Libre |
| Miércoles | 🔴 Ocupado 9-12h | ✅ Libre |
| Jueves | ✅ Libre | ⚠️ 1 evento |
| Viernes | ✅ Libre | ✅ Libre |

¿Quieres que reserve algún horario específico?`,
    suggestedAction: 'show_availability',
    confidence: 0.85,
  },
  
  reminder: {
    text: `⏰ Voy a configurar un recordatorio para ti.

¿Para cuándo lo necesitas?
• **Hoy** más tarde
• **Mañana** por la mañana
• **Esta semana** (dime el día)
• **Fecha específica**

También puedes decirme directamente: "Recordarme en 2 horas"`,
    suggestedAction: 'set_reminder',
    confidence: 0.9,
  },
  
  today_agenda: {
    text: `📋 Tu agenda de hoy incluye estos compromisos. Revisa la vista de día para más detalles.

💡 **Tip:** Usa el atajo **1** para ir a la vista de día, o **4** para ver la agenda completa.`,
    confidence: 0.95,
  },
  
  help: {
    text: `📖 **Comandos que entiendo:**

**Crear eventos:**
- "Nueva reunión mañana 10am"
- "Agendar cita con doctor viernes 16:00"
- "Crear cumpleaños de María 15 marzo"

**Consultar:**
- "¿Qué tengo hoy?"
- "¿Estoy libre el martes?"
- "Próximos eventos"

**Recordatorios:**
- "Recuérdame comprar leche"
- "Avísame en 30 minutos"

**Atajos de teclado:**
- **J/K** - Navegar períodos
- **T** - Ir a hoy
- **C** - Crear evento
- **1-4** - Cambiar vista`,
    confidence: 1.0,
  },
  
  fallback: {
    text: `Entendido. No estoy seguro de cómo ayudarte con eso, pero puedo:

• Crear un nuevo evento
• Mostrar tu disponibilidad
• Configurar recordatorios

¿Qué prefieres hacer?`,
    confidence: 0.3,
  },
};

// Intent detection patterns
const INTENT_PATTERNS: Array<{
  patterns: RegExp[];
  intent: keyof typeof RESPONSES;
}> = [
  {
    patterns: [
      /^(hola|buenos?\s?(días?|tardes?|noches?)|hey|hi)/i,
      /^(qué tal|cómo estás)/i,
    ],
    intent: 'greeting',
  },
  {
    patterns: [
      /(crear|nuevo?a?|agendar|añadir|programar)\s*(evento|reunión|cita|tarea)/i,
      /quiero\s*(crear|agendar|programar)/i,
    ],
    intent: 'create_event',
  },
  {
    patterns: [
      /(disponib|libre|ocupado|hueco|espacio)/i,
      /cuándo\s*(puedo|estoy)/i,
      /(tengo|hay)\s*espacio/i,
    ],
    intent: 'availability',
  },
  {
    patterns: [
      /(recordar|recuérdame|recordatorio|avísa|avísame|alertar?)/i,
      /(no\s*olvidar|no\s*olvides)/i,
    ],
    intent: 'reminder',
  },
  {
    patterns: [
      /(qué\s*tengo|agenda|eventos?)\s*(hoy|ahora)/i,
      /mi\s*(día|agenda)/i,
      /para\s*hoy/i,
    ],
    intent: 'today_agenda',
  },
  {
    patterns: [
      /(ayuda|help|comandos|qué\s*puedes|cómo\s*funciona)/i,
      /(opciones|instrucciones)/i,
    ],
    intent: 'help',
  },
];

/**
 * Detects the user's intent from their message
 */
const detectIntent = (message: string): keyof typeof RESPONSES => {
  const normalizedMessage = message.toLowerCase().trim();
  
  for (const { patterns, intent } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedMessage)) {
        return intent;
      }
    }
  }
  
  return 'fallback';
};

/**
 * Extracts event data from natural language
 * Example: "Reunión con Juan mañana a las 15:00 por 1 hora"
 */
export const extractEventFromMessage = (message: string): Partial<CalendarEvent> | null => {
  const result: Partial<CalendarEvent> = {};
  
  // Extract time
  const timeMatch = message.match(/(\d{1,2})[:\s]?(\d{2})?\s*(am|pm|h|hrs)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();
    
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Check for "mañana"
    if (/mañana/i.test(message)) {
      date.setDate(date.getDate() + 1);
    }
    
    const endDate = new Date(date);
    
    // Check for duration
    const durationMatch = message.match(/(\d+)\s*(hora|hr|h|minuto|min)/i);
    if (durationMatch) {
      const amount = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      
      if (unit.startsWith('min')) {
        endDate.setMinutes(endDate.getMinutes() + amount);
      } else {
        endDate.setHours(endDate.getHours() + amount);
      }
    } else {
      endDate.setHours(endDate.getHours() + 1); // Default 1 hour
    }
    
    result.start = date.toISOString();
    result.end = endDate.toISOString();
  }
  
  // Try to extract title (first capitalized words or quoted text)
  const quotedMatch = message.match(/"([^"]+)"|'([^']+)'/);
  if (quotedMatch) {
    result.title = quotedMatch[1] || quotedMatch[2];
  } else {
    // Extract meaningful words as title
    const words = message
      .replace(/\b(mañana|hoy|a\s*las?|por|hora|minuto|nuevo?a?|crear|agendar)\b/gi, '')
      .trim();
    
    if (words.length > 0) {
      result.title = words.charAt(0).toUpperCase() + words.slice(1);
    }
  }
  
  return Object.keys(result).length > 0 ? result : null;
};

/**
 * Main function to send a message and get a response
 * Simulates Gemini AI behavior
 * 
 * @param message - User's message
 * @param context - Optional context with calendar data
 * @returns Promise with chat response
 */
export const sendMessage = async (
  message: string,
  context?: ChatContext
): Promise<ChatResponse> => {
  // Simulate network delay (300-800ms)
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  
  /* 
   * PRODUCTION IMPLEMENTATION:
   * Uncomment this block to use real Gemini API
   * 
   * import { GoogleGenerativeAI } from '@google/generative-ai';
   * 
   * const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
   * if (apiKey) {
   *   const genAI = new GoogleGenerativeAI(apiKey);
   *   const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
   *   
   *   const systemPrompt = `Eres un asistente de calendario inteligente. 
   *   Ayudas a los usuarios a gestionar sus eventos y tiempo.
   *   Responde siempre en español de forma concisa y útil.
   *   
   *   Contexto actual:
   *   - Fecha: ${context?.currentDate?.toLocaleDateString('es') || 'hoy'}
   *   - Eventos próximos: ${context?.events?.length || 0}
   *   `;
   *   
   *   const result = await model.generateContent([
   *     { text: systemPrompt },
   *     { text: message }
   *   ]);
   *   
   *   return {
   *     text: result.response.text(),
   *     confidence: 0.9,
   *   };
   * }
   */
  
  // Mock implementation
  const intent = detectIntent(message);
  const response = { ...RESPONSES[intent] };
  
  // Enrich response with context-specific information
  if (intent === 'today_agenda' && context?.events) {
    const todayEvents = context.events.filter(e => {
      const eventDate = new Date(e.start);
      const today = new Date();
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear() &&
        !e.isDeleted
      );
    });
    
    if (todayEvents.length === 0) {
      response.text = `📅 ¡Tu día está libre! No tienes eventos programados para hoy.

¿Quieres crear algún evento?`;
    } else {
      response.text = `📋 **Hoy tienes ${todayEvents.length} evento(s):**\n\n${todayEvents
        .slice(0, 3)
        .map((e, i) => `${i + 1}. **${e.title}** - ${new Date(e.start).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`)
        .join('\n')}\n\n${todayEvents.length > 3 ? `_...y ${todayEvents.length - 3} más_` : ''}`;
    }
  }
  
  // Try to extract event data for create_event intent
  if (intent === 'create_event' || intent === 'fallback') {
    const extractedEvent = extractEventFromMessage(message);
    if (extractedEvent?.start && extractedEvent?.title) {
      response.text = `¡Perfecto! He preparado este evento:

📌 **${extractedEvent.title}**
🕐 ${new Date(extractedEvent.start).toLocaleString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })}

¿Quieres que lo añada a tu calendario?`;
      response.eventData = extractedEvent;
      response.suggestedAction = 'create_event';
      response.confidence = 0.85;
    }
  }
  
  return response;
};

/**
 * Gets smart suggestions based on user's calendar
 */
export const getSmartSuggestions = async (
  context: ChatContext
): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const suggestions: string[] = [];
  const { events, currentDate } = context;
  
  // Check for empty calendar
  const futureEvents = events.filter(
    e => !e.isDeleted && new Date(e.start) > currentDate
  );
  
  if (futureEvents.length === 0) {
    suggestions.push('Tu calendario está vacío. ¿Quieres crear tu primer evento?');
  }
  
  // Check for busy days
  const nextWeek = new Date(currentDate);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const weekEvents = futureEvents.filter(
    e => new Date(e.start) < nextWeek
  );
  
  if (weekEvents.length > 10) {
    suggestions.push('Tienes una semana muy ocupada. ¿Necesitas reorganizar algo?');
  }
  
  // Suggest based on time of day
  const hour = currentDate.getHours();
  if (hour < 10) {
    suggestions.push('Buenos días. ¿Quieres ver tu agenda para hoy?');
  } else if (hour >= 17) {
    suggestions.push('¿Quieres revisar lo que tienes para mañana?');
  }
  
  return suggestions;
};

/**
 * Example responses for testing
 */
export const EXAMPLE_CONVERSATIONS = [
  {
    user: 'Hola',
    assistant: RESPONSES.greeting.text,
  },
  {
    user: 'Crear reunión con el equipo mañana a las 10',
    assistant: `¡Perfecto! He preparado este evento:

📌 **Reunión con el equipo**
🕐 Mañana a las 10:00

¿Quieres que lo añada a tu calendario?`,
  },
  {
    user: '¿Qué tengo hoy?',
    assistant: RESPONSES.today_agenda.text,
  },
  {
    user: '¿Cuándo estoy libre esta semana?',
    assistant: RESPONSES.availability.text,
  },
];
