// Types for Google Calendar Clone

export type ViewType = 'month' | 'week' | 'day' | 'agenda';

export type EventType = 'event' | 'task' | 'reminder' | 'birthday';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type NotificationType = 'email' | 'push';

export type NotificationTimeUnit = 'minutes' | 'hours' | 'days' | 'weeks';

export interface EventNotification {
  id: string;
  type: NotificationType;
  time: number; // Amount of time before event
  unit: NotificationTimeUnit;
  sent?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string; // ISO string
  end: string; // ISO string
  allDay: boolean;
  calendarId: string;
  type: EventType;
  recurrence: RecurrenceType;
  recurrenceEnd?: string; // ISO string - when recurrence ends
  location?: string;
  notifications?: EventNotification[];
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  isDefault: boolean;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultView: ViewType;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  locale: string;
  notificationEmail?: string; // Email for receiving notifications
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AgendaGroup {
  date: Date;
  label: string;
  events: CalendarEvent[];
}

export interface DragInfo {
  eventId: string;
  originalStart: string;
  originalEnd: string;
}
