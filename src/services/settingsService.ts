/**
 * Settings Service
 * 
 * Handles settings CRUD operations using Supabase Cloud
 */

import { supabase } from '@/integrations/supabase/client';
import { Settings, ViewType } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants';

interface SettingsRow {
  id: string;
  settings_key: string;
  theme: string;
  default_view: string;
  week_starts_on: number;
  time_format: string;
  locale: string;
  notification_email: string | null;
  created_at: string;
  updated_at: string;
}

const mapRowToSettings = (row: SettingsRow): Settings => ({
  theme: row.theme as Settings['theme'],
  defaultView: row.default_view as ViewType,
  weekStartsOn: row.week_starts_on as 0 | 1,
  timeFormat: row.time_format as Settings['timeFormat'],
  locale: row.locale,
  notificationEmail: row.notification_email || undefined,
});

/**
 * Fetch settings from Cloud
 */
export async function getSettings(): Promise<Settings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('settings_key', 'default')
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      return DEFAULT_SETTINGS;
    }

    return mapRowToSettings(data);
  } catch (error) {
    console.error('Error in getSettings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update settings
 */
export async function updateSettings(settings: Settings): Promise<Settings | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .update({
        theme: settings.theme,
        default_view: settings.defaultView,
        week_starts_on: settings.weekStartsOn,
        time_format: settings.timeFormat,
        locale: settings.locale,
        notification_email: settings.notificationEmail || null,
      })
      .eq('settings_key', 'default')
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return null;
    }

    return mapRowToSettings(data);
  } catch (error) {
    console.error('Error in updateSettings:', error);
    return null;
  }
}
