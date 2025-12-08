import React, { useMemo } from 'react';
import { useApp } from '../App';
import { CalendarEvent } from '../types';
import { 
  getMonthDays, 
  getEventsForDay, 
  isSameMonth, 
  isToday, 
  formatDate 
} from '../utils/dateUtils';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  visibleCalendarIds: string[];
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MonthView: React.FC<MonthViewProps> = ({
  visibleCalendarIds,
  onSelectDate,
  onSelectEvent,
}) => {
  const { currentDate, events, calendars, settings } = useApp();

  const monthDays = useMemo(
    () => getMonthDays(currentDate, settings.weekStartsOn),
    [currentDate, settings.weekStartsOn]
  );

  const getCalendarColor = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.color || '#4285F4';
  };

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      result.push(monthDays.slice(i, i + 7));
    }
    return result;
  }, [monthDays]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day, i) => (
          <div
            key={i}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-[repeat(auto-fill,minmax(0,1fr))]">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(events, day, visibleCalendarIds);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const displayEvents = dayEvents.slice(0, 3);
              const moreCount = dayEvents.length - 3;

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'min-h-[100px] p-1 border-r border-border last:border-r-0 day-cell cursor-pointer',
                    !isCurrentMonth && 'bg-muted/30'
                  )}
                  onClick={() => onSelectDate(day)}
                >
                  {/* Day number */}
                  <div className="flex justify-center mb-1">
                    <span
                      className={cn(
                        'w-7 h-7 flex items-center justify-center text-sm rounded-full',
                        isTodayDate && 'bg-primary text-primary-foreground font-medium',
                        !isCurrentMonth && 'text-muted-foreground'
                      )}
                    >
                      {formatDate(day, 'd')}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {displayEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        className="event-chip w-full text-left text-white"
                        style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                      >
                        {event.allDay ? (
                          event.title
                        ) : (
                          <>
                            <span className="font-medium">
                              {formatDate(event.start, settings.timeFormat === '24h' ? 'HH:mm' : 'h:mm a')}
                            </span>
                            {' '}
                            {event.title}
                          </>
                        )}
                      </button>
                    ))}
                    {moreCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could expand to show all events
                        }}
                        className="text-xs text-primary hover:underline px-2"
                      >
                        +{moreCount} más
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;
