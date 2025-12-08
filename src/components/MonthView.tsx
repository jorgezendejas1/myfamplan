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
import { useIsMobile } from '@/hooks/use-mobile';

interface MonthViewProps {
  visibleCalendarIds: string[];
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const WEEKDAYS_FULL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const MonthView: React.FC<MonthViewProps> = ({
  visibleCalendarIds,
  onSelectDate,
  onSelectEvent,
}) => {
  const { currentDate, events, calendars, settings } = useApp();
  const isMobile = useIsMobile();

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

  // On mobile, show fewer events
  const maxEventsToShow = isMobile ? 2 : 3;
  const weekdays = isMobile ? WEEKDAYS_SHORT : WEEKDAYS_FULL;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {weekdays.map((day, i) => (
          <div
            key={i}
            className={cn(
              "py-2 text-center font-medium text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - scrollable on mobile */}
      <div className={cn(
        "flex-1 overflow-auto",
        isMobile && "pb-20" // Space for FAB on mobile
      )}>
        <div className="grid" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
          {weeks.map((week, weekIndex) => (
            <div 
              key={weekIndex} 
              className={cn(
                "grid grid-cols-7 border-b border-border last:border-b-0",
                isMobile ? "min-h-[60px]" : "min-h-[100px]"
              )}
            >
              {week.map((day, dayIndex) => {
                const dayEvents = getEventsForDay(events, day, visibleCalendarIds);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const displayEvents = dayEvents.slice(0, maxEventsToShow);
                const moreCount = dayEvents.length - maxEventsToShow;

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      'p-0.5 sm:p-1 border-r border-border last:border-r-0 day-cell cursor-pointer overflow-hidden',
                      !isCurrentMonth && 'bg-muted/30'
                    )}
                    onClick={() => onSelectDate(day)}
                  >
                    {/* Day number */}
                    <div className="flex justify-center mb-0.5 sm:mb-1">
                      <span
                        className={cn(
                          'flex items-center justify-center rounded-full',
                          isMobile ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm',
                          isTodayDate && 'bg-primary text-primary-foreground font-medium',
                          !isCurrentMonth && 'text-muted-foreground'
                        )}
                      >
                        {formatDate(day, 'd')}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="space-y-0.5 overflow-hidden">
                      {displayEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                          className={cn(
                            "event-chip w-full text-left text-white",
                            isMobile && "text-[10px] py-0 px-1"
                          )}
                          style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                        >
                          {isMobile ? (
                            <span className="truncate block">{event.title}</span>
                          ) : event.allDay ? (
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
                            onSelectDate(day);
                          }}
                          className={cn(
                            "text-primary hover:underline",
                            isMobile ? "text-[10px] px-1" : "text-xs px-2"
                          )}
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
    </div>
  );
};

export default MonthView;
