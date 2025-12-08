/**
 * Chat Service
 * 
 * Handles communication with the AI chat edge function.
 * Supports event creation and querying via tool calling.
 */

import { CalendarEvent } from '../types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export interface ChatContext {
  events: CalendarEvent[];
  currentDate: Date;
  view?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  created_events?: any[];
  fetched_events?: any[];
  error?: string;
}

/**
 * Send chat message and get response with optional event actions
 */
export async function sendChatMessage({
  messages,
  context,
}: {
  messages: Message[];
  context?: ChatContext;
}): Promise<ChatResponse> {
  try {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        context: context ? {
          currentDate: context.currentDate.toISOString(),
          eventCount: context.events.filter(e => !e.isDeleted).length,
          view: context.view,
        } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.content || '',
      created_events: data.created_events || [],
      fetched_events: data.fetched_events || [],
    };
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}

/**
 * Legacy streaming function (kept for backwards compatibility)
 * @deprecated Use sendChatMessage instead for tool calling support
 */
export async function streamChat({
  messages,
  context,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  context?: ChatContext;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}) {
  try {
    // Use the new non-streaming endpoint
    const result = await sendChatMessage({ messages, context });
    
    // Simulate streaming by chunking the response
    const content = result.content;
    const chunkSize = 10;
    
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);
      onDelta(chunk);
      // Small delay to simulate streaming effect
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    onDone();
  } catch (error) {
    console.error("Chat stream error:", error);
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
    onDone();
  }
}
