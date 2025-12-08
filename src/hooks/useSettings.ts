/**
 * useSettings Hook
 * 
 * Manages settings state with Cloud persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants';
import { getSettings, updateSettings as updateSettingsInCloud } from '@/services/settingsService';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const syncedRef = useRef(false);

  // Fetch settings from Cloud on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const cloudSettings = await getSettings();
        setSettings(cloudSettings);
        syncedRef.current = true;
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch settings'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Sync to Cloud when settings change
  useEffect(() => {
    if (!syncedRef.current) return;

    const syncToCloud = async () => {
      try {
        await updateSettingsInCloud(settings);
      } catch (err) {
        console.error('Error syncing settings:', err);
      }
    };

    syncToCloud();
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    setSettings,
    updateSettings,
    isLoading,
    error,
  };
}
