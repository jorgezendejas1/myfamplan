/**
 * ChatBot Component
 * 
 * AI-powered calendar assistant with event creation capabilities.
 * Uses Lovable AI for real-time conversational interactions.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../App';
import { ChatMessage, CalendarEvent } from '../types';
import { sendChatMessage } from '../services/chatService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Bot, User, Loader2, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const { events, currentDate, view, chatMessages, setChatMessages, setEvents } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Show welcome message if no messages (only add to local state, not cloud)
  const welcomeMessage = useMemo<ChatMessage | null>(() => {
    if (isOpen && chatMessages.length === 0) {
      return {
        id: 'welcome-message',
        role: 'assistant',
        content: '¡Hola! 👋 Soy tu asistente de calendario con IA. Puedo ayudarte a:\n\n• **Crear eventos** - \"Agenda una reunión mañana a las 10\"\n• **Ver disponibilidad** - \"¿Qué tengo esta semana?\"\n• **Buscar eventos** - \"¿Tengo algo el viernes?\"\n• **Recordatorios** - \"Recuérdame llamar a María\"\n\n¿En qué puedo ayudarte?',
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }, [isOpen, chatMessages.length]);

  // Transform backend event to CalendarEvent format
  const transformEvent = useCallback((backendEvent: any): CalendarEvent => {
    const now = new Date().toISOString();
    return {
      id: backendEvent.event_id || backendEvent.id,
      title: backendEvent.title,
      start: backendEvent.start_time,
      end: backendEvent.end_time,
      calendarId: backendEvent.calendar_id || 'default',
      type: backendEvent.event_type || 'event',
      description: backendEvent.description || '',
      location: backendEvent.location || '',
      allDay: backendEvent.all_day || false,
      recurrence: backendEvent.recurrence || 'none',
      notifications: backendEvent.notifications || [],
      isDeleted: false,
      createdAt: backendEvent.created_at || now,
      updatedAt: backendEvent.updated_at || now,
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Build message history for context (last 10 messages)
    const messageHistory = [...chatMessages, userMessage]
      .slice(-10)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const result = await sendChatMessage({
        messages: messageHistory,
        context: { events, currentDate, view },
      });

      // Add new events to the calendar if any were created
      if (result.created_events && result.created_events.length > 0) {
        const newEvents = result.created_events.map(transformEvent);
        setEvents(prev => [...prev, ...newEvents]);
        
        // Show success toast
        const eventCount = newEvents.length;
        toast.success(
          eventCount === 1 
            ? `📅 Evento "${newEvents[0].title}" creado` 
            : `📅 ${eventCount} eventos creados`,
          { duration: 3000 }
        );
      }

      // Add the assistant message
      if (result.content) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.content,
          timestamp: new Date().toISOString(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
      toast.error(error instanceof Error ? error.message : 'Error al enviar mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  // Combine stored messages with welcome message for display
  const displayMessages = welcomeMessage 
    ? [welcomeMessage, ...chatMessages] 
    : chatMessages;

  return (
    <div 
      className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] h-[60vh] sm:h-[500px] max-h-[calc(100vh-8rem)] bg-card rounded-2xl shadow-calendar-xl border border-border flex flex-col overflow-hidden z-50 animate-scale-in"
      role="dialog"
      aria-label="Asistente de calendario"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Asistente IA</h3>
            <p className="text-xs text-muted-foreground">Puede crear y consultar eventos</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar chat">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {displayMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary rounded-bl-sm'
                )}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      li: ({ children }) => <li className="mb-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Procesando...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Crea una reunión mañana a las 10am"
            disabled={isLoading}
            className="flex-1"
            aria-label="Mensaje para el asistente"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            size="icon"
            aria-label="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
