import React from 'react';
import { EventType, RecurrenceType } from '../types';
import { EVENT_TYPE_LABELS, RECURRENCE_LABELS, CALENDAR_COLORS } from '../constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '../types';
import { cn } from '@/lib/utils';
import { Search, X, Filter, CalendarIcon } from 'lucide-react';

export interface SearchFilters {
  query: string;
  dateFrom: string;
  dateTo: string;
  eventType: EventType | 'all';
  calendarId: string | 'all';
  recurrence: RecurrenceType | 'all';
  includeDeleted: boolean;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  calendars: Calendar[];
  onFiltersChange: (filters: SearchFilters) => void;
  onClear: () => void;
  resultCount?: number;
}

export const defaultFilters: SearchFilters = {
  query: '',
  dateFrom: '',
  dateTo: '',
  eventType: 'all',
  calendarId: 'all',
  recurrence: 'all',
  includeDeleted: false,
};

const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
  filters,
  calendars,
  onFiltersChange,
  onClear,
  resultCount,
}) => {
  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = 
    filters.query !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.eventType !== 'all' ||
    filters.calendarId !== 'all' ||
    filters.recurrence !== 'all' ||
    filters.includeDeleted;

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="pl-10 pr-10"
        />
        {filters.query && (
          <button
            onClick={() => updateFilter('query', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date range */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            Desde
          </Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            Hasta
          </Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>

        {/* Event type */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tipo de evento</Label>
          <Select
            value={filters.eventType}
            onValueChange={(v) => updateFilter('eventType', v as EventType | 'all')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {EVENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calendar */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Calendario</Label>
          <Select
            value={filters.calendarId}
            onValueChange={(v) => updateFilter('calendarId', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los calendarios</SelectItem>
              {calendars.map((cal) => (
                <SelectItem key={cal.id} value={cal.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: cal.color }}
                    />
                    {cal.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recurrence */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Recurrencia</Label>
          <Select
            value={filters.recurrence}
            onValueChange={(v) => updateFilter('recurrence', v as RecurrenceType | 'all')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier recurrencia</SelectItem>
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Include deleted */}
        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Switch
              id="include-deleted"
              checked={filters.includeDeleted}
              onCheckedChange={(v) => updateFilter('includeDeleted', v)}
            />
            <Label htmlFor="include-deleted" className="text-sm cursor-pointer">
              Incluir eliminados
            </Label>
          </div>
        </div>
      </div>

      {/* Actions and result count */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="text-sm text-muted-foreground">
          {resultCount !== undefined && (
            <span>
              {resultCount === 0 
                ? 'No se encontraron eventos' 
                : `${resultCount} evento${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''}`
              }
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFiltersComponent;
