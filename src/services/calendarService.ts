/**
 * Calendar Service
 * 
 * Handles calendar CRUD operations using Supabase Cloud
 */

import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/types';
import { DEFAULT_CALENDARS } from '@/constants';

interface CalendarRow {
  id: string;
  calendar_id: string;
  name: string;
  color: string;
  is_visible: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const mapRowToCalendar = (row: CalendarRow): Calendar => ({
  id: row.calendar_id,
  name: row.name,
  color: row.color,
  isVisible: row.is_visible,
  isDefault: row.is_default,
});

const mapCalendarToRow = (calendar: Calendar): Partial<CalendarRow> => ({
  calendar_id: calendar.id,
  name: calendar.name,
  color: calendar.color,
  is_visible: calendar.isVisible,
  is_default: calendar.isDefault,
});

/**
 * Fetch all calendars from Cloud
 */
export async function getCalendars(): Promise<Calendar[]> {
  try {
    const { data, error } = await supabase
      .from('calendars')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching calendars:', error);
      return DEFAULT_CALENDARS;
    }

    if (!data || data.length === 0) {
      // Initialize with defaults if empty
      await initializeDefaultCalendars();
      return DEFAULT_CALENDARS;
    }

    return data.map(mapRowToCalendar);
  } catch (error) {
    console.error('Error in getCalendars:', error);
    return DEFAULT_CALENDARS;
  }
}

/**
 * Initialize default calendars in Cloud
 */
async function initializeDefaultCalendars(): Promise<void> {
  try {
    const rows = DEFAULT_CALENDARS.map(mapCalendarToRow);
    
    const { error } = await supabase
      .from('calendars')
      .upsert(rows as any, { onConflict: 'calendar_id' });

    if (error) {
      console.error('Error initializing calendars:', error);
    }
  } catch (error) {
    console.error('Error in initializeDefaultCalendars:', error);
  }
}

/**
 * Add a new calendar
 */
export async function addCalendar(calendar: Calendar): Promise<Calendar | null> {
  try {
    const row = mapCalendarToRow(calendar);
    
    const { data, error } = await supabase
      .from('calendars')
      .insert(row as any)
      .select()
      .single();

    if (error) {
      console.error('Error adding calendar:', error);
      return null;
    }

    return mapRowToCalendar(data);
  } catch (error) {
    console.error('Error in addCalendar:', error);
    return null;
  }
}

/**
 * Update an existing calendar
 */
export async function updateCalendar(calendar: Calendar): Promise<Calendar | null> {
  try {
    const { data, error } = await supabase
      .from('calendars')
      .update({
        name: calendar.name,
        color: calendar.color,
        is_visible: calendar.isVisible,
        is_default: calendar.isDefault,
      })
      .eq('calendar_id', calendar.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar:', error);
      return null;
    }

    return mapRowToCalendar(data);
  } catch (error) {
    console.error('Error in updateCalendar:', error);
    return null;
  }
}

/**
 * Delete a calendar
 */
export async function deleteCalendar(calendarId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('calendars')
      .delete()
      .eq('calendar_id', calendarId);

    if (error) {
      console.error('Error deleting calendar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCalendar:', error);
    return false;
  }
}

/**
 * Sync calendars to Cloud (batch upsert)
 */
export async function syncCalendars(calendars: Calendar[]): Promise<void> {
  try {
    const rows = calendars.map(mapCalendarToRow);
    
    const { error } = await supabase
      .from('calendars')
      .upsert(rows as any, { onConflict: 'calendar_id' });

    if (error) {
      console.error('Error syncing calendars:', error);
    }
  } catch (error) {
    console.error('Error in syncCalendars:', error);
  }
}
