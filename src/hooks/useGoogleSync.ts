import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  getConnectedAccounts, 
  syncFromGoogle, 
  type GoogleAccount 
} from '@/services/googleSyncService';
import type { CalendarEvent } from '@/types';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface UseGoogleSyncOptions {
  onEventsImported: (events: CalendarEvent[]) => void;
  enabled?: boolean;
}

export function useGoogleSync({ onEventsImported, enabled = true }: UseGoogleSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date | null>(null);

  const syncAllAccounts = useCallback(async (showToast = false) => {
    try {
      const accounts = await getConnectedAccounts();
      const enabledAccounts = accounts.filter(acc => acc.sync_enabled);
      
      if (enabledAccounts.length === 0) return;

      let totalEvents = 0;
      const allEvents: CalendarEvent[] = [];

      for (const account of enabledAccounts) {
        try {
          const events = await syncFromGoogle(account.id);
          allEvents.push(...events);
          totalEvents += events.length;
        } catch (error) {
          console.error(`Error syncing account ${account.email}:`, error);
        }
      }

      if (allEvents.length > 0) {
        onEventsImported(allEvents);
      }

      lastSyncRef.current = new Date();

      if (showToast && totalEvents > 0) {
        toast.success(`${totalEvents} eventos sincronizados de Google Calendar`);
      }
    } catch (error) {
      console.error('Error in auto sync:', error);
    }
  }, [onEventsImported]);

  // Initial sync on mount
  useEffect(() => {
    if (!enabled) return;

    // Delay initial sync to let the app load
    const initialSyncTimeout = setTimeout(() => {
      syncAllAccounts(false);
    }, 3000);

    return () => clearTimeout(initialSyncTimeout);
  }, [enabled, syncAllAccounts]);

  // Set up periodic sync
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      syncAllAccounts(false);
    }, SYNC_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, syncAllAccounts]);

  const manualSync = useCallback(() => {
    syncAllAccounts(true);
  }, [syncAllAccounts]);

  return {
    manualSync,
    lastSync: lastSyncRef.current,
  };
}
