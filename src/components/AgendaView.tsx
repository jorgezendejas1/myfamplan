import React, { useMemo } from 'react';
import { useApp } from '../App';
import { CalendarEvent } from '../types';
import { 
  groupEventsByDate, 
  formatDate, 
  formatTime,
  addDays,
} from '../utils/dateUtils';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, Clock, CalendarOff } from 'lucide-react';

interface AgendaViewProps {
  visibleCalendarIds: string[];
  onSelectEvent: (event: CalendarEvent) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({
  visibleCalendarIds,
  onSelectEvent,
}) => {
  const { currentDate, events, calendars, settings } = useApp();

  const getCalendarColor = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.color || '#4285F4';
  };

  const getCalendarName = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.name || 'Calendario';
  };

  // Group events for the next 30 days
  const agendaGroups = useMemo(() => {
    return groupEventsByDate(events, currentDate, 30, visibleCalendarIds);
  }, [events, currentDate, visibleCalendarIds]);

  const hasNoEvents = agendaGroups.length === 0;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header info */}
      <div className="p-3 sm:p-4 border-b border-border bg-card shrink-0">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Próximos 30 días desde {formatDate(currentDate, "d 'de' MMMM")}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto scrollbar-thin pb-24 sm:pb-20">{/* Empty state */}
      {hasNoEvents && (
        <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
              <CalendarOff className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-display font-medium mb-2">
              No hay eventos programados
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              No tienes eventos en los próximos 30 días. ¡Crea uno nuevo usando el botón + o presiona C!
            </p>
          </div>
        </div>
      )}

      {/* Agenda list */}
      {!hasNoEvents && (
        <div>
          {agendaGroups.map((group, groupIndex) => (
            <div key={group.date.toISOString()} className="animate-fade-in">
              {/* Date header - sticky */}
              <div className="sticky-date-header px-3 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn(
                    'text-xl sm:text-2xl font-light',
                    group.label === 'Hoy' && 'text-primary font-medium'
                  )}>
                    {formatDate(group.date, 'd')}
                  </div>
                  <div>
                    <div className={cn(
                      'text-xs sm:text-sm font-medium',
                      group.label === 'Hoy' && 'text-primary'
                    )}>
                      {group.label}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                      {formatDate(group.date, 'MMMM yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Events for this date */}
              <div className="divide-y divide-border">
                {group.events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-secondary/50 transition-colors flex gap-2 sm:gap-4 group active:bg-secondary/70"
                  >
                    {/* Time column */}
                    <div className="w-14 sm:w-16 shrink-0 text-xs sm:text-sm text-muted-foreground">
                      {event.allDay ? (
                        <span className="text-[10px] sm:text-xs uppercase font-medium">Todo el día</span>
                      ) : (
                        formatTime(event.start, settings.timeFormat === '24h')
                      )}
                    </div>

                    {/* Color indicator */}
                    <div 
                      className="w-1 rounded-full shrink-0 self-stretch"
                      style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                    />

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h4 className="font-medium text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </h4>
                      </div>
                      
                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
                        {!event.allDay && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.start, settings.timeFormat === '24h')} - {formatTime(event.end, settings.timeFormat === '24h')}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-none">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {event.location}
                          </span>
                        )}
                        <span className="hidden sm:flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {getCalendarName(event.calendarId)}
                        </span>
                      </div>

                      {/* Description preview - hidden on mobile */}
                      {event.description && (
                        <p className="hidden sm:block mt-1 text-sm text-muted-foreground line-clamp-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default AgendaView;
