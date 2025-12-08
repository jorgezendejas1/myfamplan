/**
 * LocalStorage Service with Versioning and Migration
 * 
 * This module handles all localStorage operations with:
 * - Data versioning for future migrations
 * - Type-safe get/set operations
 * - Migration support when data structure changes
 * - Error handling with fallbacks
 */

import { CalendarEvent, Calendar, Settings, ChatMessage } from '../types';
import { DEFAULT_CALENDARS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';

// Current storage schema version
const STORAGE_VERSION = 1;
const VERSION_KEY = 'calendar_storage_version';

// Type definitions for stored data
interface StoredData {
  events: CalendarEvent[];
  calendars: Calendar[];
  settings: Settings;
  chatHistory: ChatMessage[];
}

type StorageKey = keyof typeof STORAGE_KEYS;

// Default values for each storage key
const defaultValues: Record<string, unknown> = {
  [STORAGE_KEYS.EVENTS]: [],
  [STORAGE_KEYS.CALENDARS]: DEFAULT_CALENDARS,
  [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
  [STORAGE_KEYS.CHAT_HISTORY]: [],
};

/**
 * Retrieves the current storage version
 */
export const getStorageVersion = (): number => {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Sets the current storage version
 */
const setStorageVersion = (version: number): void => {
  try {
    localStorage.setItem(VERSION_KEY, version.toString());
  } catch (error) {
    console.error('Error setting storage version:', error);
  }
};

/**
 * Migration functions for each version upgrade
 * Add new migrations here when storage schema changes
 */
const migrations: Record<number, () => void> = {
  // Migration from version 0 to 1
  1: () => {
    console.log('Running migration to v1: Adding new fields to events');
    
    // Example: Add 'updatedAt' field to existing events if missing
    try {
      const eventsJson = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (eventsJson) {
        const events = JSON.parse(eventsJson) as CalendarEvent[];
        const migratedEvents = events.map(event => ({
          ...event,
          updatedAt: event.updatedAt || event.createdAt || new Date().toISOString(),
          isDeleted: event.isDeleted ?? false,
        }));
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(migratedEvents));
      }
    } catch (error) {
      console.error('Migration v1 failed:', error);
    }
  },
  
  // Future migrations go here
  // 2: () => { ... }
};

/**
 * Runs all necessary migrations to bring storage up to current version
 */
export const runMigrations = (): void => {
  const currentVersion = getStorageVersion();
  
  if (currentVersion >= STORAGE_VERSION) {
    return; // Already up to date
  }
  
  console.log(`Storage migration needed: v${currentVersion} -> v${STORAGE_VERSION}`);
  
  // Run each migration in sequence
  for (let v = currentVersion + 1; v <= STORAGE_VERSION; v++) {
    const migrate = migrations[v];
    if (migrate) {
      console.log(`Running migration v${v}...`);
      migrate();
    }
  }
  
  setStorageVersion(STORAGE_VERSION);
  console.log('All migrations completed');
};

/**
 * Generic function to load data from localStorage
 * @param key - The storage key
 * @returns The stored value or default value
 */
export function loadFromStorage<T>(key: string): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
    return (defaultValues[key] as T) ?? ([] as unknown as T);
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return (defaultValues[key] as T) ?? ([] as unknown as T);
  }
}

/**
 * Generic function to save data to localStorage
 * @param key - The storage key
 * @param value - The value to store
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Attempting cleanup...');
      cleanupOldData();
      
      // Retry once after cleanup
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        console.error('Storage still full after cleanup');
      }
    } else {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }
}

/**
 * Removes data from localStorage
 * @param key - The storage key
 */
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
};

/**
 * Clears all calendar-related data from localStorage
 */
export const clearAllStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem(VERSION_KEY);
    console.log('All calendar storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

/**
 * Cleanup function to remove old/deleted data
 * Called when storage quota is exceeded
 */
const cleanupOldData = (): void => {
  try {
    // Remove permanently deleted events older than 30 days
    const eventsJson = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (eventsJson) {
      const events = JSON.parse(eventsJson) as CalendarEvent[];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const cleanedEvents = events.filter(event => {
        if (event.isDeleted && event.deletedAt) {
          return new Date(event.deletedAt) > thirtyDaysAgo;
        }
        return true;
      });
      
      if (cleanedEvents.length < events.length) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(cleanedEvents));
        console.log(`Cleaned up ${events.length - cleanedEvents.length} old deleted events`);
      }
    }
    
    // Limit chat history to last 100 messages
    const chatJson = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (chatJson) {
      const messages = JSON.parse(chatJson) as ChatMessage[];
      if (messages.length > 100) {
        const trimmed = messages.slice(-100);
        localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
        console.log(`Trimmed chat history to 100 messages`);
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

/**
 * Exports all calendar data for backup
 * @returns JSON string of all stored data
 */
export const exportAllData = (): string => {
  const data: Partial<StoredData> = {};
  
  try {
    data.events = loadFromStorage<CalendarEvent[]>(STORAGE_KEYS.EVENTS);
    data.calendars = loadFromStorage<Calendar[]>(STORAGE_KEYS.CALENDARS);
    data.settings = loadFromStorage<Settings>(STORAGE_KEYS.SETTINGS);
    data.chatHistory = loadFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY);
  } catch (error) {
    console.error('Error exporting data:', error);
  }
  
  return JSON.stringify({
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }, null, 2);
};

/**
 * Imports data from a backup
 * @param jsonString - The JSON string to import
 * @returns Success status
 */
export const importAllData = (jsonString: string): boolean => {
  try {
    const imported = JSON.parse(jsonString);
    
    if (!imported.data) {
      console.error('Invalid import format: missing data');
      return false;
    }
    
    const { data } = imported;
    
    if (data.events) {
      saveToStorage(STORAGE_KEYS.EVENTS, data.events);
    }
    if (data.calendars) {
      saveToStorage(STORAGE_KEYS.CALENDARS, data.calendars);
    }
    if (data.settings) {
      saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
    }
    if (data.chatHistory) {
      saveToStorage(STORAGE_KEYS.CHAT_HISTORY, data.chatHistory);
    }
    
    console.log('Data imported successfully');
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

/**
 * Gets the approximate storage usage in bytes
 */
export const getStorageUsage = (): { used: number; available: number } => {
  let used = 0;
  
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        used += item.length * 2; // UTF-16 = 2 bytes per char
      }
    });
  } catch (error) {
    console.error('Error calculating storage usage:', error);
  }
  
  // Most browsers allow 5-10MB for localStorage
  const available = 5 * 1024 * 1024; // Assume 5MB
  
  return { used, available };
};

// Initialize: run migrations on module load
runMigrations();
