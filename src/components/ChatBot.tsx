/**
 * ChatBot Component
 * 
 * AI-powered calendar assistant with streaming responses.
 * Uses Lovable AI for real-time conversational interactions.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../App';
import { ChatMessage } from '../types';
import { streamChat } from '../services/chatService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const { events, currentDate, view, chatMessages, setChatMessages } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, streamingContent]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Show welcome message if no messages
  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '¡Hola! 👋 Soy tu asistente de calendario con IA. Puedo ayudarte a:\n\n• **Crear eventos** - \"Agenda una reunión mañana a las 10\"\n• **Ver disponibilidad** - \"¿Qué tengo esta semana?\"\n• **Buscar eventos** - \"¿Tengo algo el viernes?\"\n• **Recordatorios** - \"Recuérdame llamar a María\"\n\n¿En qué puedo ayudarte?',
        timestamp: new Date().toISOString(),
      };
      setChatMessages([welcomeMessage]);
    }
  }, [isOpen, chatMessages.length, setChatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const userInput = input.trim();
    setChatMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    // Build message history for context (last 10 messages)
    const messageHistory = [...chatMessages, userMessage]
      .slice(-10)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let assistantContent = '';

    try {
      await streamChat({
        messages: messageHistory,
        context: { events, currentDate, view },
        onDelta: (chunk) => {
          assistantContent += chunk;
          setStreamingContent(assistantContent);
        },
        onDone: () => {
          // Add the complete assistant message
          if (assistantContent.trim()) {
            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: assistantContent,
              timestamp: new Date().toISOString(),
            };
            setChatMessages(prev => [...prev, assistantMessage]);
          }
          setStreamingContent('');
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Chat error:', error);
          toast.error(error.message || 'Error al enviar mensaje');
          setStreamingContent('');
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setStreamingContent('');
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

  // Combine stored messages with streaming content for display
  const displayMessages = [...chatMessages];

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
            <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
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
          
          {/* Streaming message */}
          {streamingContent && (
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="max-w-[80%] bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
                <ReactMarkdown
                  className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {streamingContent}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Loading indicator (only when waiting for first chunk) */}
          {isLoading && !streamingContent && (
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
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
            placeholder="Escribe un mensaje..."
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
