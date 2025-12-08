import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../App';
import { Calendar } from '../types';
import { CALENDAR_COLORS } from '../constants';
import { cn } from '@/lib/utils';
import { Plus, ChevronDown, ChevronRight, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SidebarProps {
  isOpen: boolean;
  onCreateEvent: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCreateEvent }) => {
  const { currentDate, setCurrentDate, setView, calendars, setCalendars } = useApp();
  const [calendarsOpen, setCalendarsOpen] = useState(true);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState(CALENDAR_COLORS[0]);

  // Mini calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get first day of week offset
  const firstDayOfWeek = monthStart.getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday start

  const toggleCalendarVisibility = (calendarId: string) => {
    setCalendars(prev => 
      prev.map(c => c.id === calendarId ? { ...c, isVisible: !c.isVisible } : c)
    );
  };

  const handleSaveCalendar = () => {
    if (!newCalendarName.trim()) return;

    if (editingCalendar) {
      setCalendars(prev =>
        prev.map(c => c.id === editingCalendar.id
          ? { ...c, name: newCalendarName, color: newCalendarColor }
          : c
        )
      );
    } else {
      const newCalendar: Calendar = {
        id: crypto.randomUUID(),
        name: newCalendarName,
        color: newCalendarColor,
        isVisible: true,
        isDefault: false,
      };
      setCalendars(prev => [...prev, newCalendar]);
    }

    setEditingCalendar(null);
    setNewCalendarName('');
    setNewCalendarColor(CALENDAR_COLORS[0]);
  };

  const handleDeleteCalendar = (calendarId: string) => {
    setCalendars(prev => prev.filter(c => c.id !== calendarId));
    setEditingCalendar(null);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-64 border-r border-border bg-card shrink-0 flex flex-col overflow-hidden">
      {/* Create button */}
      <div className="p-4">
        <Button
          onClick={onCreateEvent}
          className="w-full gap-2 shadow-calendar hover:shadow-calendar-lg transition-shadow"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Crear
        </Button>
      </div>

      {/* Mini calendar */}
      <div className="px-4 pb-4">
        <div className="text-sm font-medium mb-2 text-center">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-xs">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="text-center text-muted-foreground py-1 font-medium">
              {day}
            </div>
          ))}
          {/* Offset for first day */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}
          {monthDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => {
                setCurrentDate(day);
                setView('day');
              }}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors',
                'hover:bg-calendar-hover',
                isToday(day) && 'bg-primary text-primary-foreground hover:bg-primary',
                isSameMonth(day, currentDate) ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {format(day, 'd')}
            </button>
          ))}
        </div>
      </div>

      {/* Calendars list */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        <Collapsible open={calendarsOpen} onOpenChange={setCalendarsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium hover:text-primary transition-colors">
            {calendarsOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Mis calendarios
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/50 group cursor-pointer"
                onClick={() => {
                  setEditingCalendar(calendar);
                  setNewCalendarName(calendar.name);
                  setNewCalendarColor(calendar.color);
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCalendarVisibility(calendar.id);
                  }}
                  className="shrink-0"
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                      calendar.isVisible ? 'border-transparent' : 'border-muted-foreground'
                    )}
                    style={{ backgroundColor: calendar.isVisible ? calendar.color : 'transparent' }}
                  >
                    {calendar.isVisible && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
                <span className="text-sm flex-1 truncate">{calendar.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCalendarVisibility(calendar.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {calendar.isVisible ? (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setEditingCalendar(null);
                setNewCalendarName('');
                setNewCalendarColor(CALENDAR_COLORS[Math.floor(Math.random() * CALENDAR_COLORS.length)]);
                setEditingCalendar({ id: 'new', name: '', color: '', isVisible: true, isDefault: false });
              }}
              className="flex items-center gap-2 py-1.5 px-2 text-sm text-primary hover:bg-secondary/50 rounded-lg w-full"
            >
              <Plus className="w-4 h-4" />
              Añadir calendario
            </button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Calendar edit dialog */}
      <Dialog open={!!editingCalendar} onOpenChange={() => setEditingCalendar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCalendar?.id === 'new' ? 'Nuevo calendario' : 'Editar calendario'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendar-name">Nombre</Label>
              <Input
                id="calendar-name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                placeholder="Mi calendario"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {CALENDAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCalendarColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-transform hover:scale-110',
                      newCalendarColor === color && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              {editingCalendar?.id !== 'new' && !editingCalendar?.isDefault && (
                <Button
                  variant="destructive"
                  onClick={() => editingCalendar && handleDeleteCalendar(editingCalendar.id)}
                >
                  Eliminar
                </Button>
              )}
              <Button variant="outline" onClick={() => setEditingCalendar(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCalendar}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default Sidebar;
