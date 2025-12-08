/**
 * useEvents Hook
 * 
 * Manages event state with Cloud persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent } from '@/types';
import { 
  getEvents, 
  addEvent as addEventToCloud, 
  updateEvent as updateEventInCloud,
  softDeleteEvent,
  deleteEvent as deleteEventFromCloud,
  restoreEvent as restoreEventInCloud,
} from '@/services/eventService';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadDone = useRef(false);

  // Fetch events from Cloud on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const cloudEvents = await getEvents();
        setEvents(cloudEvents);
        initialLoadDone.current = true;
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch events'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const addEvent = useCallback(async (event: CalendarEvent) => {
    // Optimistic update
    setEvents(prev => [...prev, event]);
    
    try {
      await addEventToCloud(event);
    } catch (err) {
      console.error('Error adding event to cloud:', err);
      // Revert on error
      setEvents(prev => prev.filter(e => e.id !== event.id));
    }
  }, []);

  const updateEvent = useCallback(async (event: CalendarEvent) => {
    // Store previous state for rollback
    const previousEvent = events.find(e => e.id === event.id);
    
    // Optimistic update
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    
    try {
      await updateEventInCloud(event);
    } catch (err) {
      console.error('Error updating event in cloud:', err);
      // Revert on error
      if (previousEvent) {
        setEvents(prev => prev.map(e => e.id === event.id ? previousEvent : e));
      }
    }
  }, [events]);

  const deleteEvent = useCallback(async (id: string, permanent = false) => {
    if (permanent) {
      // Optimistic delete
      setEvents(prev => prev.filter(e => e.id !== id));
      
      try {
        await deleteEventFromCloud(id);
      } catch (err) {
        console.error('Error deleting event from cloud:', err);
      }
    } else {
      // Soft delete - optimistic update
      setEvents(prev => prev.map(e => 
        e.id === id ? { ...e, isDeleted: true, deletedAt: new Date().toISOString() } : e
      ));
      
      try {
        await softDeleteEvent(id);
      } catch (err) {
        console.error('Error soft deleting event:', err);
      }
    }
  }, []);

  const restoreEvent = useCallback(async (id: string) => {
    // Optimistic update
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, isDeleted: false, deletedAt: undefined } : e
    ));
    
    try {
      await restoreEventInCloud(id);
    } catch (err) {
      console.error('Error restoring event:', err);
    }
  }, []);

  // Import Google events (merge without duplicates)
  const importGoogleEvents = useCallback((googleEvents: CalendarEvent[]) => {
    setEvents(prev => {
      const nonGoogleEvents = prev.filter(e => !e.id.startsWith('google-'));
      return [...nonGoogleEvents, ...googleEvents];
    });
  }, []);

  return {
    events,
    setEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    restoreEvent,
    importGoogleEvents,
    isLoading,
    error,
  };
}
