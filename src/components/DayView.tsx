import React, { useMemo, useRef } from 'react';
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
} from '../utils/dateUtils';
import { HOURS } from '../constants';
import { cn } from '@/lib/utils';

interface DayViewProps {
  visibleCalendarIds: string[];
  onSelectTime: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const DayView: React.FC<DayViewProps> = ({
  visibleCalendarIds,
  onSelectTime,
  onSelectEvent,
}) => {
  const { currentDate, events, calendars, settings } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const getCalendarColor = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.color || '#4285F4';
  };

  const dayEvents = useMemo(
    () => getEventsForDay(events, currentDate, visibleCalendarIds),
    [events, currentDate, visibleCalendarIds]
  );

  const allDayEvents = dayEvents.filter(e => e.allDay);
  const timedEvents = dayEvents.filter(e => !e.allDay);

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    const dayStart = startOfDay(start);
    
    const topMinutes = differenceInMinutes(start, dayStart);
    const durationMinutes = differenceInMinutes(end, start);
    
    const top = (topMinutes / 60) * 64; // 64px per hour
    const height = Math.max((durationMinutes / 60) * 64, 24); // min 24px

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  // Scroll to current hour on mount
  React.useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = Math.max(0, (currentHour - 1) * 64);
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const isTodayDate = isToday(currentDate);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex border-b border-border shrink-0 py-4 px-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase">
            {formatDate(currentDate, 'EEEE')}
          </div>
          <div
            className={cn(
              'text-4xl font-light mt-1',
              isTodayDate && 'w-14 h-14 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center'
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

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-thin">
        <div className="flex relative min-h-full">
          {/* Time labels */}
          <div className="w-20 shrink-0">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 relative">
                <span className="absolute -top-2.5 right-3 text-xs text-muted-foreground">
                  {settings.timeFormat === '24h' 
                    ? `${hour.toString().padStart(2, '0')}:00`
                    : `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`
                  }
                </span>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className={cn(
            'flex-1 relative border-l border-border',
            isTodayDate && 'bg-calendar-today/30'
          )}>
            {/* Hour slots */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-border time-slot"
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
                  top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 64}px`,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-destructive -mt-1.5 -ml-1.5" />
              </div>
            )}

            {/* Events */}
            {timedEvents.map((event) => (
              <button
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent(event);
                }}
                className="absolute left-2 right-2 rounded-lg px-3 py-2 text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm z-20"
                style={{
                  ...getEventStyle(event),
                  backgroundColor: getCalendarColor(event.calendarId),
                }}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-white/80 text-sm">
                  {formatTime(event.start, settings.timeFormat === '24h')} - {formatTime(event.end, settings.timeFormat === '24h')}
                </div>
                {event.location && (
                  <div className="text-white/70 text-sm truncate">{event.location}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;
