import React, { useMemo, useState } from 'react';
import { useApp } from '../App';
import { CalendarEvent } from '../types';
import SearchFiltersComponent, { SearchFilters, defaultFilters } from './SearchFilters';
import { formatDate, formatTime, parseISO } from '../utils/dateUtils';
import { EVENT_TYPE_LABELS, RECURRENCE_LABELS } from '../constants';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  Repeat,
  Trash2,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResultsViewProps {
  onSelectEvent: (event: CalendarEvent) => void;
}

const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  onSelectEvent,
}) => {
  const { events, calendars, settings, restoreEvent, deleteEvent } = useApp();
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const getCalendarColor = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.color || '#4285F4';
  };

  const getCalendarName = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.name || 'Calendario';
  };

  // Filter events based on search criteria
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Skip deleted unless explicitly included
      if (event.isDeleted && !filters.includeDeleted) {
        return false;
      }

      // Query search (title, description, location)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesQuery =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query);
        
        if (!matchesQuery) return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const eventDate = new Date(event.start);
        const fromDate = new Date(filters.dateFrom);
        if (eventDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const eventDate = new Date(event.start);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (eventDate > toDate) return false;
      }

      // Event type filter
      if (filters.eventType !== 'all' && event.type !== filters.eventType) {
        return false;
      }

      // Calendar filter
      if (filters.calendarId !== 'all' && event.calendarId !== filters.calendarId) {
        return false;
      }

      // Recurrence filter
      if (filters.recurrence !== 'all' && event.recurrence !== filters.recurrence) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by date, newest first
      return new Date(b.start).getTime() - new Date(a.start).getTime();
    });
  }, [events, filters]);

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleRestoreEvent = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    restoreEvent(eventId);
  };

  const handleDeletePermanently = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (confirm('¿Eliminar este evento permanentemente?')) {
      deleteEvent(eventId, true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <h2 className="text-xl font-display font-medium flex items-center gap-2">
          <Search className="w-5 h-5" />
          Buscar Eventos
        </h2>
      </div>

      {/* Filters */}
      <div className="p-4 shrink-0">
        <SearchFiltersComponent
          filters={filters}
          calendars={calendars}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          resultCount={filteredEvents.length}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No se encontraron eventos</h3>
            <p className="text-muted-foreground max-w-sm">
              Intenta ajustar los filtros o buscar con otros términos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={cn(
                  'w-full text-left p-4 hover:bg-secondary/50 transition-colors flex gap-4 group',
                  event.isDeleted && 'opacity-60'
                )}
              >
                {/* Color indicator */}
                <div
                  className="w-1 rounded-full shrink-0 self-stretch"
                  style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                />

                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        'font-medium group-hover:text-primary transition-colors',
                        event.isDeleted && 'line-through'
                      )}>
                        {event.title}
                      </h4>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {EVENT_TYPE_LABELS[event.type]}
                      </span>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(event.start, "d MMM yyyy")}
                      {!event.allDay && (
                        <> · {formatTime(event.start, settings.timeFormat === '24h')}</>
                      )}
                    </span>
                    
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {event.location}
                      </span>
                    )}
                    
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getCalendarName(event.calendarId)}
                    </span>

                    {event.recurrence !== 'none' && (
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {RECURRENCE_LABELS[event.recurrence]}
                      </span>
                    )}
                  </div>

                  {/* Description preview */}
                  {event.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                      {event.description}
                    </p>
                  )}

                  {/* Deleted event actions */}
                  {event.isDeleted && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleRestoreEvent(e, event.id)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restaurar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => handleDeletePermanently(e, event.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsView;
