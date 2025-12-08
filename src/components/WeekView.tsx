import React, { useMemo, useRef } from 'react';
import { useApp } from '../App';
import { CalendarEvent } from '../types';
import { 
  getWeekDays, 
  getEventsForDay, 
  isToday, 
  formatDate,
  formatTime,
  parseISO,
  getHours,
  differenceInMinutes,
  startOfDay,
} from '../utils/dateUtils';
import { HOURS } from '../constants';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  visibleCalendarIds: string[];
  onSelectTime: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
  visibleCalendarIds,
  onSelectTime,
  onSelectEvent,
}) => {
  const { currentDate, events, calendars, settings } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(
    () => getWeekDays(currentDate, settings.weekStartsOn),
    [currentDate, settings.weekStartsOn]
  );

  const getCalendarColor = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.color || '#4285F4';
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    const dayStart = startOfDay(start);
    
    const topMinutes = differenceInMinutes(start, dayStart);
    const durationMinutes = differenceInMinutes(end, start);
    
    const top = (topMinutes / 60) * 48; // 48px per hour
    const height = Math.max((durationMinutes / 60) * 48, 20); // min 20px

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
      const scrollPosition = Math.max(0, (currentHour - 1) * 48);
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with days */}
      <div className="flex border-b border-border shrink-0">
        {/* Time gutter */}
        <div className="w-16 shrink-0" />
        
        {/* Day headers */}
        {weekDays.map((day, i) => {
          const isTodayDate = isToday(day);
          return (
            <div
              key={i}
              className={cn(
                'flex-1 py-2 text-center border-l border-border',
                isTodayDate && 'bg-calendar-today'
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {formatDate(day, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-2xl font-light mt-0.5',
                  isTodayDate && 'w-10 h-10 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center'
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
        <div className="w-16 shrink-0 text-xs text-muted-foreground p-1">
          Todo el día
        </div>
        {weekDays.map((day, i) => {
          const allDayEvents = getEventsForDay(events, day, visibleCalendarIds)
            .filter(e => e.allDay);
          
          return (
            <div key={i} className="flex-1 border-l border-border min-h-[2rem] p-0.5">
              {allDayEvents.slice(0, 2).map((event) => (
                <button
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="event-chip w-full text-left text-white mb-0.5"
                  style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                >
                  {event.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-thin">
        <div className="flex relative">
          {/* Time labels */}
          <div className="w-16 shrink-0">
            {HOURS.map((hour) => (
              <div key={hour} className="h-12 relative">
                <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground">
                  {settings.timeFormat === '24h' 
                    ? `${hour.toString().padStart(2, '0')}:00`
                    : `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`
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

            return (
              <div
                key={dayIndex}
                className={cn(
                  'flex-1 relative border-l border-border',
                  isTodayDate && 'bg-calendar-today/30'
                )}
              >
                {/* Hour slots */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-border time-slot"
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
                      top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 48}px`,
                    }}
                  >
                    <div className="w-3 h-3 rounded-full bg-destructive -mt-1.5 -ml-1.5" />
                  </div>
                )}

                {/* Events */}
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(event);
                    }}
                    className="absolute left-1 right-1 rounded px-1 py-0.5 text-xs text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-20"
                    style={{
                      ...getEventStyle(event),
                      backgroundColor: getCalendarColor(event.calendarId),
                    }}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-white/80 text-[10px]">
                      {formatTime(event.start, settings.timeFormat === '24h')}
                    </div>
                  </button>
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
