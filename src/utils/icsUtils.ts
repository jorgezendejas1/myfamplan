// ICS Import/Export utilities

import { CalendarEvent, RecurrenceType } from '../types';
import { format, parseISO } from 'date-fns';

const formatICSDate = (dateStr: string, allDay: boolean): string => {
  const date = parseISO(dateStr);
  if (allDay) {
    return format(date, "yyyyMMdd");
  }
  return format(date, "yyyyMMdd'T'HHmmss");
};

const escapeICSText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

const recurrenceToRRule = (recurrence: RecurrenceType): string | null => {
  switch (recurrence) {
    case 'daily':
      return 'RRULE:FREQ=DAILY';
    case 'weekly':
      return 'RRULE:FREQ=WEEKLY';
    case 'monthly':
      return 'RRULE:FREQ=MONTHLY';
    case 'yearly':
      return 'RRULE:FREQ=YEARLY';
    default:
      return null;
  }
};

export const exportToICS = (events: CalendarEvent[]): string => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendar Clone//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach(event => {
    if (event.isDeleted) return;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@calendar-clone`);
    lines.push(`DTSTAMP:${formatICSDate(new Date().toISOString(), false)}Z`);
    
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatICSDate(event.start, true)}`);
      lines.push(`DTEND;VALUE=DATE:${formatICSDate(event.end, true)}`);
    } else {
      lines.push(`DTSTART:${formatICSDate(event.start, false)}`);
      lines.push(`DTEND:${formatICSDate(event.end, false)}`);
    }

    lines.push(`SUMMARY:${escapeICSText(event.title)}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }
    
    if (event.location) {
      lines.push(`LOCATION:${escapeICSText(event.location)}`);
    }

    const rrule = recurrenceToRRule(event.recurrence);
    if (rrule) {
      lines.push(rrule);
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

const parseICSDate = (dateStr: string): { date: Date; allDay: boolean } => {
  // Remove any VALUE=DATE: prefix
  const cleanStr = dateStr.replace(/^(DTSTART|DTEND)(;VALUE=DATE)?:/i, '');
  
  if (cleanStr.length === 8) {
    // All-day event: YYYYMMDD
    const year = parseInt(cleanStr.slice(0, 4));
    const month = parseInt(cleanStr.slice(4, 6)) - 1;
    const day = parseInt(cleanStr.slice(6, 8));
    return { date: new Date(year, month, day), allDay: true };
  }
  
  // Full datetime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const datePart = cleanStr.replace('Z', '').split('T');
  const year = parseInt(datePart[0].slice(0, 4));
  const month = parseInt(datePart[0].slice(4, 6)) - 1;
  const day = parseInt(datePart[0].slice(6, 8));
  
  let hours = 0, minutes = 0, seconds = 0;
  if (datePart[1]) {
    hours = parseInt(datePart[1].slice(0, 2));
    minutes = parseInt(datePart[1].slice(2, 4));
    seconds = parseInt(datePart[1].slice(4, 6)) || 0;
  }
  
  return { date: new Date(year, month, day, hours, minutes, seconds), allDay: false };
};

const parseRRule = (rrule: string): RecurrenceType => {
  if (rrule.includes('FREQ=DAILY')) return 'daily';
  if (rrule.includes('FREQ=WEEKLY')) return 'weekly';
  if (rrule.includes('FREQ=MONTHLY')) return 'monthly';
  if (rrule.includes('FREQ=YEARLY')) return 'yearly';
  return 'none';
};

const unescapeICSText = (text: string): string => {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
};

export const importFromICS = (icsContent: string, calendarId: string): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const lines = icsContent.split(/\r?\n/);
  
  let currentEvent: Partial<CalendarEvent> | null = null;
  let allDay = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line folding (lines starting with space/tab are continuations)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].slice(1);
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {
        id: crypto.randomUUID(),
        calendarId,
        type: 'event',
        recurrence: 'none',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      allDay = false;
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.title && currentEvent.start && currentEvent.end) {
        events.push({
          ...currentEvent,
          allDay,
          title: currentEvent.title,
          description: currentEvent.description || '',
          start: currentEvent.start,
          end: currentEvent.end,
        } as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = unescapeICSText(line.slice(8));
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = unescapeICSText(line.slice(12));
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = unescapeICSText(line.slice(9));
      } else if (line.startsWith('DTSTART')) {
        const { date, allDay: isAllDay } = parseICSDate(line);
        currentEvent.start = date.toISOString();
        allDay = isAllDay;
      } else if (line.startsWith('DTEND')) {
        const { date } = parseICSDate(line);
        currentEvent.end = date.toISOString();
      } else if (line.startsWith('RRULE:')) {
        currentEvent.recurrence = parseRRule(line);
      } else if (line.startsWith('UID:')) {
        // Use UID if provided, helps with deduplication
        currentEvent.id = line.slice(4).split('@')[0];
      }
    }
  }

  return events;
};

export const downloadICS = (events: CalendarEvent[], filename: string = 'calendar.ics'): void => {
  const icsContent = exportToICS(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
