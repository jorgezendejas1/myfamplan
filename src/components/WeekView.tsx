/**
 * WeekView Component
 * 
 * Displays a week calendar view with:
 * - Day columns with date headers
 * - All-day events section
 * - Hourly time grid with events
 * - Current time indicator
 * - Drag & drop support for moving events
 * - Responsive design (hides some columns on mobile)
 */

import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useApp } from '../App';
import { CalendarEvent } from '../types';
import { 
  getWeekDays, 
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
import { GripVertical } from 'lucide-react';

interface WeekViewProps {
  visibleCalendarIds: string[];
  onSelectTime: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 48; // pixels per hour

const WeekView: React.FC<WeekViewProps> = ({
  visibleCalendarIds,
  onSelectTime,
  onSelectEvent,
}) => {
  const { currentDate, events, calendars, settings, updateEvent } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Drag & drop state
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const weekDays = useMemo(
    () => getWeekDays(currentDate, settings.weekStartsOn),
    [currentDate, settings.weekStartsOn]
  );

  const getCalendarColor = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.color || '#4285F4';
  };

  /**
   * Calculate event visual position and height based on time
   * @param event - Calendar event to position
   * @returns CSS styles for top and height
   */
  const getEventStyle = (event: CalendarEvent) => {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    const dayStart = startOfDay(start);
    
    const topMinutes = differenceInMinutes(start, dayStart);
    const durationMinutes = differenceInMinutes(end, start);
    
    const top = (topMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20); // min 20px

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  /**
   * Handle drag start - store initial event and mouse offset
   */
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setDraggingEvent(event);
    
    // Calculate offset from mouse to event top
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  }, []);

  /**
   * Handle drop - calculate new time and update event
   */
  const handleDrop = useCallback((e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingEvent || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const dropY = e.clientY - gridRect.top - dragOffset.y;
    
    // Calculate new hour and minutes from drop position
    const totalMinutes = Math.max(0, (dropY / HOUR_HEIGHT) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round((totalMinutes % 60) / 15) * 15; // Snap to 15-min intervals

    // Calculate event duration
    const originalStart = parseISO(draggingEvent.start);
    const originalEnd = parseISO(draggingEvent.end);
    const duration = differenceInMinutes(originalEnd, originalStart);

    // Create new start/end times
    const newStart = new Date(targetDay);
    newStart.setHours(Math.min(23, hours), Math.min(45, minutes), 0, 0);
    const newEnd = addMinutes(newStart, duration);

    // Update the event
    const updatedEvent: CalendarEvent = {
      ...draggingEvent,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateEvent(updatedEvent);
    setDraggingEvent(null);
  }, [draggingEvent, dragOffset, updateEvent]);

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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with days - responsive: fewer days on mobile */}
      <div className="flex border-b border-border shrink-0">
        {/* Time gutter */}
        <div className="w-12 md:w-16 shrink-0" />
        
        {/* Day headers */}
        {weekDays.map((day, i) => {
          const isTodayDate = isToday(day);
          // On mobile, only show 3 days centered on current
          const hiddenOnMobile = i < 2 || i > 4;
          
          return (
            <div
              key={i}
              className={cn(
                'flex-1 py-2 text-center border-l border-border min-w-0',
                isTodayDate && 'bg-calendar-today',
                hiddenOnMobile && 'hidden md:block'
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {formatDate(day, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-lg md:text-2xl font-light mt-0.5',
                  isTodayDate && 'w-8 h-8 md:w-10 md:h-10 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center'
                )}
              >
                {formatDate(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events row */}
      <div className="flex border-b border-border shrink-0">
        <div className="w-12 md:w-16 shrink-0 text-[10px] md:text-xs text-muted-foreground p-1">
          Todo el día
        </div>
        {weekDays.map((day, i) => {
          const allDayEvents = getEventsForDay(events, day, visibleCalendarIds)
            .filter(e => e.allDay);
          const hiddenOnMobile = i < 2 || i > 4;
          
          return (
            <div 
              key={i} 
              className={cn(
                "flex-1 border-l border-border min-h-[2rem] p-0.5",
                hiddenOnMobile && 'hidden md:block'
              )}
            >
              {allDayEvents.slice(0, 2).map((event) => (
                <button
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="event-chip w-full text-left text-white mb-0.5 text-[10px] md:text-xs"
                  style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                >
                  {event.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid with drag & drop support */}
      <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-thin">
        <div ref={gridRef} className="flex relative">
          {/* Time labels */}
          <div className="w-12 md:w-16 shrink-0">
            {HOURS.map((hour) => (
              <div key={hour} className="h-12 relative">
                <span className="absolute -top-2.5 right-1 md:right-2 text-[10px] md:text-xs text-muted-foreground">
                  {settings.timeFormat === '24h' 
                    ? `${hour.toString().padStart(2, '0')}:00`
                    : `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'p' : 'a'}`
                  }
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(events, day, visibleCalendarIds)
              .filter(e => !e.allDay);
            const isTodayDate = isToday(day);
            const hiddenOnMobile = dayIndex < 2 || dayIndex > 4;

            return (
              <div
                key={dayIndex}
                className={cn(
                  'flex-1 relative border-l border-border min-w-0',
                  isTodayDate && 'bg-calendar-today/30',
                  hiddenOnMobile && 'hidden md:block'
                )}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                {/* Hour slots - clickable to create events */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-border time-slot cursor-pointer"
                    onClick={() => {
                      const clickDate = new Date(day);
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
                {dayEvents.map((event) => (
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
                      "absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded px-1 py-0.5 text-xs text-white overflow-hidden cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity z-20 group",
                      draggingEvent?.id === event.id && 'opacity-50 ring-2 ring-primary'
                    )}
                    style={{
                      ...getEventStyle(event),
                      backgroundColor: getCalendarColor(event.calendarId),
                    }}
                  >
                    {/* Drag handle indicator */}
                    <GripVertical className="absolute right-0.5 top-0.5 w-3 h-3 opacity-0 group-hover:opacity-60 pointer-events-none" />
                    <div className="font-medium truncate text-[10px] md:text-xs">{event.title}</div>
                    <div className="text-white/80 text-[9px] md:text-[10px] hidden md:block">
                      {formatTime(event.start, settings.timeFormat === '24h')}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
