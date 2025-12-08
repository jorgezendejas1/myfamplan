/**
 * DayView Component
 * 
 * Displays a single day calendar view with:
 * - Day header with date
 * - All-day events section
 * - Hourly time grid with events
 * - Current time indicator
 * - Drag & drop support for moving events
 * - Touch-friendly for mobile
 */

import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useApp } from '../App';
import { CalendarEvent } from '../types';
import { 
  getEventsForDay, 
  isToday, 
  formatDate,
  formatTime,
  parseISO,
  differenceInMinutes,
  startOfDay,
  addMinutes,
} from '../utils/dateUtils';
import { HOURS } from '../constants';
import { cn } from '@/lib/utils';
import { GripVertical, MapPin, Clock } from 'lucide-react';

interface DayViewProps {
  visibleCalendarIds: string[];
  onSelectTime: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 64; // pixels per hour

const DayView: React.FC<DayViewProps> = ({
  visibleCalendarIds,
  onSelectTime,
  onSelectEvent,
}) => {
  const { currentDate, events, calendars, settings, updateEvent } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const getCalendarColor = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.color || '#4285F4';
  };

  const dayEvents = useMemo(
    () => getEventsForDay(events, currentDate, visibleCalendarIds),
    [events, currentDate, visibleCalendarIds]
  );

  const allDayEvents = dayEvents.filter(e => e.allDay);
  const timedEvents = dayEvents.filter(e => !e.allDay);

  /**
   * Calculate event visual position and height based on time
   */
  const getEventStyle = (event: CalendarEvent) => {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    const dayStart = startOfDay(start);
    
    const topMinutes = differenceInMinutes(start, dayStart);
    const durationMinutes = differenceInMinutes(end, start);
    
    const top = (topMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 24); // min 24px

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setDraggingEvent(event);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset(e.clientY - rect.top);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  }, []);

  /**
   * Handle drop - calculate new time and update event
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingEvent || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const dropY = e.clientY - gridRect.top - dragOffset;
    
    // Calculate new time
    const totalMinutes = Math.max(0, (dropY / HOUR_HEIGHT) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;

    // Calculate duration
    const originalStart = parseISO(draggingEvent.start);
    const originalEnd = parseISO(draggingEvent.end);
    const duration = differenceInMinutes(originalEnd, originalStart);

    // Create new times
    const newStart = new Date(currentDate);
    newStart.setHours(Math.min(23, hours), Math.min(45, minutes), 0, 0);
    const newEnd = addMinutes(newStart, duration);

    // Update event
    const updatedEvent: CalendarEvent = {
      ...draggingEvent,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateEvent(updatedEvent);
    setDraggingEvent(null);
  }, [draggingEvent, dragOffset, currentDate, updateEvent]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggingEvent(null);
  };

  // Scroll to current hour on mount
  React.useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = Math.max(0, (currentHour - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const isTodayDate = isToday(currentDate);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - responsive padding */}
      <div className="flex border-b border-border shrink-0 py-3 md:py-4 px-3 md:px-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase">
            {formatDate(currentDate, 'EEEE')}
          </div>
          <div
            className={cn(
              'text-3xl md:text-4xl font-light mt-1',
              isTodayDate && 'w-12 h-12 md:w-14 md:h-14 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center'
            )}
          >
            {formatDate(currentDate, 'd')}
          </div>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-border p-2 shrink-0">
          <div className="text-xs text-muted-foreground mb-1">Todo el día</div>
          <div className="flex flex-wrap gap-1">
            {allDayEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="event-chip text-white"
                style={{ backgroundColor: getCalendarColor(event.calendarId) }}
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time grid with drag & drop */}
      <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-thin">
        <div className="flex relative min-h-full">
          {/* Time labels - smaller on mobile */}
          <div className="w-14 md:w-20 shrink-0">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 relative">
                <span className="absolute -top-2.5 right-2 md:right-3 text-[10px] md:text-xs text-muted-foreground">
                  {settings.timeFormat === '24h' 
                    ? `${hour.toString().padStart(2, '0')}:00`
                    : `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'p' : 'a'}`
                  }
                </span>
              </div>
            ))}
          </div>

          {/* Day column with drop zone */}
          <div 
            ref={gridRef}
            className={cn(
              'flex-1 relative border-l border-border',
              isTodayDate && 'bg-calendar-today/30'
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Hour slots */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-border time-slot cursor-pointer"
                onClick={() => {
                  const clickDate = new Date(currentDate);
                  clickDate.setHours(hour, 0, 0, 0);
                  onSelectTime(clickDate);
                }}
              />
            ))}

            {/* Current time indicator */}
            {isTodayDate && (
              <div
                className="absolute left-0 right-0 border-t-2 border-destructive z-10 pointer-events-none"
                style={{
                  top: `${(new Date().getHours() + new Date().getMinutes() / 60) * HOUR_HEIGHT}px`,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-destructive -mt-1.5 -ml-1.5" />
              </div>
            )}

            {/* Events - draggable */}
            {timedEvents.map((event) => (
              <div
                key={event.id}
                draggable
                onDragStart={(e) => handleDragStart(e, event)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent(event);
                }}
                className={cn(
                  "absolute left-1 right-1 md:left-2 md:right-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-white overflow-hidden cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity shadow-sm z-20 group",
                  draggingEvent?.id === event.id && 'opacity-50 ring-2 ring-primary'
                )}
                style={{
                  ...getEventStyle(event),
                  backgroundColor: getCalendarColor(event.calendarId),
                }}
              >
                <GripVertical className="absolute right-1 top-1 w-4 h-4 opacity-0 group-hover:opacity-60 pointer-events-none" />
                <div className="font-medium text-sm md:text-base">{event.title}</div>
                <div className="flex items-center gap-1 text-white/80 text-xs md:text-sm">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.start, settings.timeFormat === '24h')} - {formatTime(event.end, settings.timeFormat === '24h')}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1 text-white/70 text-xs md:text-sm truncate mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {event.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;
