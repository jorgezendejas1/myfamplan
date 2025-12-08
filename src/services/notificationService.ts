import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent, EventNotification, NotificationTimeUnit } from "../types";
import { toast } from "sonner";

const NOTIFICATION_CHECK_INTERVAL = 60000; // Check every minute
const SENT_NOTIFICATIONS_KEY = 'calendar_sent_notifications';

// Convert notification time to milliseconds
const getNotificationMs = (time: number, unit: NotificationTimeUnit): number => {
  const multipliers: Record<NotificationTimeUnit, number> = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };
  return time * multipliers[unit];
};

// Get human-readable time string
const getTimeString = (time: number, unit: NotificationTimeUnit): string => {
  const labels: Record<NotificationTimeUnit, string> = {
    minutes: time === 1 ? 'minuto' : 'minutos',
    hours: time === 1 ? 'hora' : 'horas',
    days: time === 1 ? 'día' : 'días',
    weeks: time === 1 ? 'semana' : 'semanas',
  };
  return `${time} ${labels[unit]} antes`;
};

// Track sent notifications in localStorage
const getSentNotifications = (): Set<string> => {
  try {
    const stored = localStorage.getItem(SENT_NOTIFICATIONS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
};

const markNotificationSent = (notificationKey: string): void => {
  const sent = getSentNotifications();
  sent.add(notificationKey);
  // Keep only last 1000 notifications to prevent localStorage bloat
  const arr = Array.from(sent).slice(-1000);
  localStorage.setItem(SENT_NOTIFICATIONS_KEY, JSON.stringify(arr));
};

// Send email notification via edge function
export const sendEmailNotification = async (
  email: string,
  event: CalendarEvent,
  notification: EventNotification
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-reminder', {
      body: {
        to: email,
        eventTitle: event.title,
        eventStart: event.start,
        eventLocation: event.location,
        eventDescription: event.description,
        reminderTime: getTimeString(notification.time, notification.unit),
      },
    });

    if (error) {
      console.error('Error sending email notification:', error);
      return false;
    }

    console.log('Email notification sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
};

// Send browser push notification
export const sendPushNotification = (
  event: CalendarEvent,
  notification: EventNotification
): boolean => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    new Notification(`📅 ${event.title}`, {
      body: `${getTimeString(notification.time, notification.unit)}\n${event.location || ''}`,
      icon: '/favicon.ico',
      tag: `${event.id}-${notification.id}`,
    });
    return true;
  }

  return false;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Check and send due notifications
export const checkAndSendNotifications = async (
  events: CalendarEvent[],
  notificationEmail?: string
): Promise<void> => {
  const now = Date.now();
  const sentNotifications = getSentNotifications();

  for (const event of events) {
    if (event.isDeleted || !event.notifications?.length) continue;

    const eventStart = new Date(event.start).getTime();
    
    for (const notification of event.notifications) {
      const notificationKey = `${event.id}-${notification.id}`;
      
      // Skip if already sent
      if (sentNotifications.has(notificationKey)) continue;

      const triggerTime = eventStart - getNotificationMs(notification.time, notification.unit);
      const timeDiff = triggerTime - now;

      // Send if within the next minute (to account for check interval)
      if (timeDiff <= NOTIFICATION_CHECK_INTERVAL && timeDiff > -NOTIFICATION_CHECK_INTERVAL) {
        let sent = false;

        if (notification.type === 'email' && notificationEmail) {
          sent = await sendEmailNotification(notificationEmail, event, notification);
          if (sent) {
            toast.success(`Recordatorio enviado: ${event.title}`);
          }
        } else if (notification.type === 'push') {
          sent = sendPushNotification(event, notification);
          if (sent) {
            toast.info(`Recordatorio: ${event.title}`, {
              description: getTimeString(notification.time, notification.unit),
            });
          }
        }

        if (sent) {
          markNotificationSent(notificationKey);
        }
      }
    }
  }
};

// Start the notification checking loop
let checkInterval: number | null = null;

export const startNotificationService = (
  getEvents: () => CalendarEvent[],
  getEmail: () => string | undefined
): void => {
  if (checkInterval) return;

  // Request permission for push notifications
  requestNotificationPermission();

  checkInterval = window.setInterval(() => {
    checkAndSendNotifications(getEvents(), getEmail());
  }, NOTIFICATION_CHECK_INTERVAL);

  // Initial check
  checkAndSendNotifications(getEvents(), getEmail());

  console.log('Notification service started');
};

export const stopNotificationService = (): void => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('Notification service stopped');
  }
};
