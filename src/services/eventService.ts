/**
 * Event Service
 * 
 * Handles event CRUD operations using Supabase Cloud
 */

import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent, EventNotification } from '@/types';
import { Json } from '@/integrations/supabase/types';

interface EventRow {
  id: string;
  event_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  calendar_id: string;
  event_type: string;
  recurrence: string;
  recurrence_end: string | null;
  location: string | null;
  notifications: Json;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

const parseNotifications = (notifications: Json): EventNotification[] => {
  if (!notifications) return [];
  if (Array.isArray(notifications)) {
    return notifications as unknown as EventNotification[];
  }
  return [];
};

const mapRowToEvent = (row: EventRow): CalendarEvent => ({
  id: row.event_id,
  title: row.title,
  description: row.description || '',
  start: row.start_time,
  end: row.end_time,
  allDay: row.all_day,
  calendarId: row.calendar_id,
  type: row.event_type as CalendarEvent['type'],
  recurrence: row.recurrence as CalendarEvent['recurrence'],
  recurrenceEnd: row.recurrence_end || undefined,
  location: row.location || undefined,
  notifications: parseNotifications(row.notifications),
  isDeleted: row.is_deleted,
  deletedAt: row.deleted_at || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapEventToRow = (event: CalendarEvent) => ({
  event_id: event.id,
  title: event.title,
  description: event.description,
  start_time: event.start,
  end_time: event.end,
  all_day: event.allDay,
  calendar_id: event.calendarId,
  event_type: event.type,
  recurrence: event.recurrence,
  recurrence_end: event.recurrenceEnd || null,
  location: event.location || null,
  notifications: (event.notifications || []) as unknown as Json,
  is_deleted: event.isDeleted,
  deleted_at: event.deletedAt || null,
});

/**
 * Fetch all events from Cloud
 */
export async function getEvents(): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return (data || []).map(mapRowToEvent);
  } catch (error) {
    console.error('Error in getEvents:', error);
    return [];
  }
}

/**
 * Add a new event
 */
export async function addEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
  try {
    const row = mapEventToRow(event);
    
    const { data, error } = await supabase
      .from('events')
      .insert(row as any)
      .select()
      .single();

    if (error) {
      console.error('Error adding event:', error);
      return null;
    }

    return mapRowToEvent(data);
  } catch (error) {
    console.error('Error in addEvent:', error);
    return null;
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({
        title: event.title,
        description: event.description,
        start_time: event.start,
        end_time: event.end,
        all_day: event.allDay,
        calendar_id: event.calendarId,
        event_type: event.type,
        recurrence: event.recurrence,
        recurrence_end: event.recurrenceEnd || null,
        location: event.location || null,
        notifications: (event.notifications || []) as unknown as Json,
        is_deleted: event.isDeleted,
        deleted_at: event.deletedAt || null,
      })
      .eq('event_id', event.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return null;
    }

    return mapRowToEvent(data);
  } catch (error) {
    console.error('Error in updateEvent:', error);
    return null;
  }
}

/**
 * Delete an event (soft delete)
 */
export async function softDeleteEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Error soft deleting event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in softDeleteEvent:', error);
    return false;
  }
}

/**
 * Permanently delete an event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('event_id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    return false;
  }
}

/**
 * Restore a deleted event
 */
export async function restoreEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        is_deleted: false,
        deleted_at: null,
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Error restoring event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in restoreEvent:', error);
    return false;
  }
}

/**
 * Sync events to Cloud (batch upsert)
 */
export async function syncEvents(events: CalendarEvent[]): Promise<void> {
  try {
    const rows = events.map(mapEventToRow);
    
    const { error } = await supabase
      .from('events')
      .upsert(rows as any, { onConflict: 'event_id' });

    if (error) {
      console.error('Error syncing events:', error);
    }
  } catch (error) {
    console.error('Error in syncEvents:', error);
  }
}
