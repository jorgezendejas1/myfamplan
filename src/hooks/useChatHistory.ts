/**
 * useChatHistory Hook
 * 
 * Manages chat history state with Cloud persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';
import { 
  getChatHistory, 
  addChatMessage as addMessageToCloud,
  clearChatHistory as clearHistoryInCloud,
} from '@/services/chatHistoryService';

export function useChatHistory() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadDone = useRef(false);

  // Fetch chat history from Cloud on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getChatHistory();
        setChatMessages(history);
        initialLoadDone.current = true;
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch chat history'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const addMessage = useCallback(async (message: ChatMessage) => {
    // Optimistic update
    setChatMessages(prev => [...prev, message]);
    
    try {
      await addMessageToCloud(message);
    } catch (err) {
      console.error('Error adding message to cloud:', err);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    setChatMessages([]);
    
    try {
      await clearHistoryInCloud();
    } catch (err) {
      console.error('Error clearing chat history:', err);
    }
  }, []);

  return {
    chatMessages,
    setChatMessages,
    addMessage,
    clearHistory,
    isLoading,
    error,
  };
}
