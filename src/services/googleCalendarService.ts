// Mock Google Calendar & Gemini AI Service
// In production, replace with actual API calls

import { CalendarEvent } from '../types';

// Mock API key - in production use: process.env.GOOGLE_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface GeminiResponse {
  text: string;
  suggestedEvents?: Partial<CalendarEvent>[];
}

// Simulated AI responses for calendar assistant
const mockResponses: Record<string, GeminiResponse> = {
  default: {
    text: "¡Hola! Soy tu asistente de calendario. Puedo ayudarte a:\n\n• Crear eventos\n• Buscar disponibilidad\n• Sugerir horarios\n• Recordarte compromisos\n\n¿En qué puedo ayudarte hoy?",
  },
  crear: {
    text: "Entendido. Para crear un evento necesito:\n\n1. **Título** del evento\n2. **Fecha y hora** de inicio\n3. **Duración** estimada\n\n¿Cuál es el título del evento que deseas crear?",
  },
  reunion: {
    text: "He analizado tu calendario. Te sugiero estos horarios para tu reunión:\n\n• **Mañana 10:00** - 1 hora libre\n• **Viernes 14:00** - Tarde despejada\n• **Lunes próximo 09:00** - Inicio de semana\n\n¿Cuál prefieres?",
    suggestedEvents: [
      {
        title: 'Reunión',
        type: 'event',
      },
    ],
  },
  disponibilidad: {
    text: "Revisando tu agenda de esta semana:\n\n📅 **Lunes**: Ocupado 9-12h\n📅 **Martes**: Libre todo el día\n📅 **Miércoles**: Reunión 15-16h\n📅 **Jueves**: Disponible mañana\n📅 **Viernes**: Libre después de 11h\n\n¿Quieres que reserve algún bloque?",
  },
  recordatorio: {
    text: "Perfecto, puedo configurar un recordatorio. ¿Para cuándo lo necesitas?\n\n• Hoy más tarde\n• Mañana por la mañana\n• Esta semana\n• Fecha específica",
  },
};

// Analyze user message and return appropriate response
const analyzeMessage = (message: string): GeminiResponse => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('crear') || lowerMessage.includes('nuevo evento') || lowerMessage.includes('agendar')) {
    return mockResponses.crear;
  }
  if (lowerMessage.includes('reunión') || lowerMessage.includes('meeting') || lowerMessage.includes('cita')) {
    return mockResponses.reunion;
  }
  if (lowerMessage.includes('disponib') || lowerMessage.includes('libre') || lowerMessage.includes('ocupado')) {
    return mockResponses.disponibilidad;
  }
  if (lowerMessage.includes('recordar') || lowerMessage.includes('recordatorio') || lowerMessage.includes('avisar')) {
    return mockResponses.recordatorio;
  }
  if (lowerMessage.includes('hola') || lowerMessage.includes('ayuda') || lowerMessage.includes('qué puedes')) {
    return mockResponses.default;
  }
  
  return {
    text: `Entendido: "${message}"\n\nPuedo ayudarte a gestionar tu calendario. ¿Deseas:\n\n• **Crear** un nuevo evento\n• **Buscar** disponibilidad\n• **Ver** próximos compromisos\n\nDime más detalles y te asisto.`,
  };
};

// Main chat function - simulates Gemini API call
export const sendChatMessage = async (
  message: string,
  _context?: { events: CalendarEvent[]; currentDate: Date }
): Promise<GeminiResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // In production with real Gemini API:
  /*
  if (GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Eres un asistente de calendario inteligente. 
    Contexto: El usuario tiene ${context?.events.length || 0} eventos.
    Fecha actual: ${context?.currentDate?.toLocaleDateString('es') || 'hoy'}.
    
    Usuario: ${message}
    
    Responde de forma concisa y útil en español.`;
    
    const result = await model.generateContent(prompt);
    return { text: result.response.text() };
  }
  */
  
  return analyzeMessage(message);
};

// Parse natural language to event (mock implementation)
export const parseEventFromText = async (
  text: string
): Promise<Partial<CalendarEvent> | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simple pattern matching for demo
  const lowerText = text.toLowerCase();
  
  // Try to extract time
  const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|h)?/i);
  const tomorrow = lowerText.includes('mañana');
  const today = lowerText.includes('hoy');
  
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();
    
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    const date = new Date();
    if (tomorrow) date.setDate(date.getDate() + 1);
    date.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endDate.getHours() + 1);
    
    return {
      title: 'Nuevo evento',
      start: date.toISOString(),
      end: endDate.toISOString(),
      allDay: false,
      type: 'event',
      recurrence: 'none',
    };
  }
  
  return null;
};

// Get smart suggestions based on calendar data
export const getSmartSuggestions = async (
  events: CalendarEvent[],
  currentDate: Date
): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const suggestions: string[] = [];
  const upcomingEvents = events.filter(e => !e.isDeleted && new Date(e.start) > currentDate);
  
  if (upcomingEvents.length === 0) {
    suggestions.push('Tu calendario está vacío. ¿Quieres crear tu primer evento?');
  } else if (upcomingEvents.length < 3) {
    suggestions.push('Tienes pocos eventos programados esta semana.');
  }
  
  // Check for gaps in schedule
  suggestions.push('Tienes disponibilidad mañana por la tarde.');
  
  return suggestions;
};
