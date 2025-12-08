/**
 * Chat Service
 * 
 * Handles communication with the AI chat edge function.
 * Provides streaming responses for real-time chat experience.
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

/**
 * Stream chat response from AI
 * 
 * @param messages - Conversation history
 * @param context - Calendar context for better responses
 * @param onDelta - Callback for each text chunk
 * @param onDone - Callback when stream completes
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

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response stream available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      // Process line-by-line as data arrives
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        // Handle CRLF
        if (line.endsWith("\r")) line = line.slice(0, -1);
        
        // Skip comments and empty lines
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        
        // Check for stream end
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            onDelta(content);
          }
        } catch {
          // Incomplete JSON, put back and wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
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

/**
 * Non-streaming chat request (fallback)
 */
export async function sendChat(
  messages: Message[],
  context?: ChatContext
): Promise<string> {
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
      } : undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(errorData.error || `Error ${response.status}`);
  }

  // For streaming responses, collect all chunks
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    textBuffer += decoder.decode(value, { stream: true });
    
    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullText += content;
      } catch {
        // Continue on parse errors
      }
    }
  }

  return fullText;
}
