// Date utilities using date-fns with Spanish locale

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isSameDay,
  isSameMonth,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  differenceInMinutes,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isBefore,
  isAfter,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarEvent, RecurrenceType, AgendaGroup } from '../types';

export const formatDate = (date: Date | string, formatStr: string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: es });
};

export const getMonthDays = (date: Date, weekStartsOn: 0 | 1 = 1): Date[] => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn, locale: es });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn, locale: es });
  return eachDayOfInterval({ start, end });
};

export const getWeekDays = (date: Date, weekStartsOn: 0 | 1 = 1): Date[] => {
  const start = startOfWeek(date, { weekStartsOn, locale: es });
  const end = endOfWeek(date, { weekStartsOn, locale: es });
  return eachDayOfInterval({ start, end });
};

export const getDateLabel = (date: Date): string => {
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  if (isYesterday(date)) return 'Ayer';
  return format(date, "EEE d MMM", { locale: es });
};

export const getRelativeDateLabel = (date: Date): string => {
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0 && diffDays <= 7) {
    return format(date, "EEEE", { locale: es });
  }
  
  return format(date, "EEE d MMM", { locale: es });
};

// Generate recurring event instances within a date range
export const expandRecurringEvent = (
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] => {
  if (event.recurrence === 'none') {
    const eventStart = parseISO(event.start);
    if (isWithinInterval(eventStart, { start: rangeStart, end: rangeEnd }) ||
        isSameDay(eventStart, rangeStart) || isSameDay(eventStart, rangeEnd)) {
      return [event];
    }
    return [];
  }

  const instances: CalendarEvent[] = [];
  const originalStart = parseISO(event.start);
  const originalEnd = parseISO(event.end);
  const duration = differenceInMinutes(originalEnd, originalStart);
  const recurrenceEnd = event.recurrenceEnd ? parseISO(event.recurrenceEnd) : addYears(rangeEnd, 1);

  let currentStart = originalStart;
  let iteration = 0;
  const maxIterations = 365; // Safety limit

  while (isBefore(currentStart, rangeEnd) && isBefore(currentStart, recurrenceEnd) && iteration < maxIterations) {
    if (isAfter(currentStart, rangeStart) || isSameDay(currentStart, rangeStart) || 
        isWithinInterval(currentStart, { start: rangeStart, end: rangeEnd })) {
      const instanceEnd = addDays(setMinutes(setHours(currentStart, getHours(originalEnd)), getMinutes(originalEnd)), 
        Math.floor(duration / (24 * 60)));
      
      instances.push({
        ...event,
        id: `${event.id}_${format(currentStart, 'yyyy-MM-dd')}`,
        start: currentStart.toISOString(),
        end: instanceEnd.toISOString(),
      });
    }

    // Advance to next occurrence
    switch (event.recurrence) {
      case 'daily':
        currentStart = addDays(currentStart, 1);
        break;
      case 'weekly':
        currentStart = addWeeks(currentStart, 1);
        break;
      case 'monthly':
        currentStart = addMonths(currentStart, 1);
        break;
      case 'yearly':
        currentStart = addYears(currentStart, 1);
        break;
      default:
        iteration = maxIterations; // Exit loop
    }
    iteration++;
  }

  return instances;
};

// Get events for a specific day, including recurring events
export const getEventsForDay = (
  events: CalendarEvent[],
  date: Date,
  visibleCalendarIds: string[]
): CalendarEvent[] => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  const expandedEvents = events
    .filter(e => !e.isDeleted && visibleCalendarIds.includes(e.calendarId))
    .flatMap(event => expandRecurringEvent(event, dayStart, dayEnd));

  return expandedEvents.filter(event => {
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    
    // Check if event overlaps with this day
    return (
      isSameDay(eventStart, date) ||
      isSameDay(eventEnd, date) ||
      (isBefore(eventStart, dayEnd) && isAfter(eventEnd, dayStart))
    );
  }).sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return parseISO(a.start).getTime() - parseISO(b.start).getTime();
  });
};

// Group events by date for Agenda view
export const groupEventsByDate = (
  events: CalendarEvent[],
  startDate: Date,
  days: number,
  visibleCalendarIds: string[]
): AgendaGroup[] => {
  const groups: AgendaGroup[] = [];
  const endDate = addDays(startDate, days);

  // Expand all recurring events in the range
  const expandedEvents = events
    .filter(e => !e.isDeleted && visibleCalendarIds.includes(e.calendarId))
    .flatMap(event => expandRecurringEvent(event, startDate, endDate));

  // Group by date
  for (let i = 0; i < days; i++) {
    const currentDate = addDays(startDate, i);
    const dayEvents = expandedEvents.filter(event => {
      const eventStart = parseISO(event.start);
      return isSameDay(eventStart, currentDate);
    }).sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

    if (dayEvents.length > 0) {
      groups.push({
        date: currentDate,
        label: getRelativeDateLabel(currentDate),
        events: dayEvents,
      });
    }
  }

  return groups;
};

export const formatTimeRange = (start: string, end: string, is24h: boolean = true): string => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const timeFormat = is24h ? 'HH:mm' : 'h:mm a';
  
  return `${format(startDate, timeFormat)} - ${format(endDate, timeFormat)}`;
};

export const formatTime = (date: Date | string, is24h: boolean = true): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, is24h ? 'HH:mm' : 'h:mm a');
};

export {
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  startOfWeek,
  getHours,
  setHours,
  setMinutes,
  differenceInMinutes,
};
