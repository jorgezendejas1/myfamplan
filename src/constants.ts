// Constants for Google Calendar Clone

import { Calendar, Settings } from './types';

export const CALENDAR_COLORS = [
  '#4285F4', // Google Blue
  '#EA4335', // Red
  '#FBBC04', // Yellow
  '#34A853', // Green
  '#FF6D01', // Orange
  '#46BDC6', // Teal
  '#7986CB', // Lavender
  '#E67C73', // Flamingo
  '#F6BF26', // Banana
  '#33B679', // Sage
  '#8E24AA', // Grape
  '#039BE5', // Peacock
];

export const EVENT_TYPE_ICONS = {
  event: 'Calendar',
  task: 'CheckSquare',
  reminder: 'Bell',
  birthday: 'Cake',
} as const;

export const EVENT_TYPE_LABELS = {
  event: 'Evento',
  task: 'Tarea',
  reminder: 'Recordatorio',
  birthday: 'Cumpleaños',
} as const;

export const RECURRENCE_LABELS = {
  none: 'No se repite',
  daily: 'Todos los días',
  weekly: 'Cada semana',
  monthly: 'Cada mes',
  yearly: 'Cada año',
} as const;

export const DEFAULT_CALENDARS: Calendar[] = [
  {
    id: 'primary',
    name: 'Mi Calendario',
    color: '#4285F4',
    isVisible: true,
    isDefault: true,
  },
  {
    id: 'work',
    name: 'Trabajo',
    color: '#34A853',
    isVisible: true,
    isDefault: false,
  },
  {
    id: 'personal',
    name: 'Personal',
    color: '#EA4335',
    isVisible: true,
    isDefault: false,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  defaultView: 'month',
  weekStartsOn: 1, // Monday
  timeFormat: '24h',
  locale: 'es',
};

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const KEYBOARD_SHORTCUTS = {
  'j': 'Siguiente período',
  'k': 'Período anterior',
  't': 'Ir a hoy',
  'c': 'Crear evento',
  '1': 'Vista día',
  '2': 'Vista semana',
  '3': 'Vista mes',
  '4': 'Vista agenda',
  '/': 'Buscar',
  '?': 'Mostrar atajos',
} as const;

export const STORAGE_KEYS = {
  EVENTS: 'calendar_events',
  CALENDARS: 'calendar_calendars',
  SETTINGS: 'calendar_settings',
  CHAT_HISTORY: 'calendar_chat_history',
} as const;
