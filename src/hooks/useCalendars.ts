/**
 * useCalendars Hook
 * 
 * Manages calendar state with Cloud persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar } from '@/types';
import { DEFAULT_CALENDARS } from '@/constants';
import { 
  getCalendars, 
  addCalendar as addCalendarToCloud, 
  updateCalendar as updateCalendarInCloud,
  deleteCalendar as deleteCalendarFromCloud,
  syncCalendars 
} from '@/services/calendarService';

export function useCalendars() {
  const [calendars, setCalendars] = useState<Calendar[]>(DEFAULT_CALENDARS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const syncedRef = useRef(false);

  // Fetch calendars from Cloud on mount
  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const cloudCalendars = await getCalendars();
        setCalendars(cloudCalendars);
        syncedRef.current = true;
      } catch (err) {
        console.error('Error fetching calendars:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch calendars'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendars();
  }, []);

  // Sync to Cloud when calendars change (after initial sync)
  useEffect(() => {
    if (!syncedRef.current) return;

    const syncToCloud = async () => {
      try {
        await syncCalendars(calendars);
      } catch (err) {
        console.error('Error syncing calendars:', err);
      }
    };

    syncToCloud();
  }, [calendars]);

  const addCalendar = useCallback(async (calendar: Calendar) => {
    setCalendars(prev => [...prev, calendar]);
    
    try {
      await addCalendarToCloud(calendar);
    } catch (err) {
      console.error('Error adding calendar to cloud:', err);
    }
  }, []);

  const updateCalendar = useCallback(async (calendar: Calendar) => {
    setCalendars(prev => prev.map(c => c.id === calendar.id ? calendar : c));
    
    try {
      await updateCalendarInCloud(calendar);
    } catch (err) {
      console.error('Error updating calendar in cloud:', err);
    }
  }, []);

  const deleteCalendar = useCallback(async (calendarId: string) => {
    setCalendars(prev => prev.filter(c => c.id !== calendarId));
    
    try {
      await deleteCalendarFromCloud(calendarId);
    } catch (err) {
      console.error('Error deleting calendar from cloud:', err);
    }
  }, []);

  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    setCalendars(prev => 
      prev.map(c => 
        c.id === calendarId ? { ...c, isVisible: !c.isVisible } : c
      )
    );
  }, []);

  return {
    calendars,
    setCalendars,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    toggleCalendarVisibility,
    isLoading,
    error,
  };
}
