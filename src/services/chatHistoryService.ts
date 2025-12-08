/**
 * Chat History Service
 * 
 * Handles chat history CRUD operations using Supabase Cloud
 */

import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types';

interface ChatRow {
  id: string;
  message_id: string;
  role: string;
  content: string;
  timestamp: string;
  created_at: string;
}

const mapRowToMessage = (row: ChatRow): ChatMessage => ({
  id: row.message_id,
  role: row.role as 'user' | 'assistant',
  content: row.content,
  timestamp: row.timestamp,
});

const mapMessageToRow = (message: ChatMessage): Partial<ChatRow> => ({
  message_id: message.id,
  role: message.role,
  content: message.content,
  timestamp: message.timestamp,
});

/**
 * Fetch chat history from Cloud
 */
export async function getChatHistory(): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    return (data || []).map(mapRowToMessage);
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    return [];
  }
}

/**
 * Add a new chat message
 */
export async function addChatMessage(message: ChatMessage): Promise<ChatMessage | null> {
  try {
    const row = mapMessageToRow(message);
    
    const { data, error } = await supabase
      .from('chat_history')
      .insert(row as any)
      .select()
      .single();

    if (error) {
      console.error('Error adding chat message:', error);
      return null;
    }

    return mapRowToMessage(data);
  } catch (error) {
    console.error('Error in addChatMessage:', error);
    return null;
  }
}

/**
 * Clear chat history
 */
export async function clearChatHistory(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in clearChatHistory:', error);
    return false;
  }
}
