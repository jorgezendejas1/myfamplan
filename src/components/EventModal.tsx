import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { CalendarEvent, EventType, RecurrenceType, EventNotification } from '../types';
import { formatDate, parseISO } from '../utils/dateUtils';
import { EVENT_TYPE_LABELS, RECURRENCE_LABELS, EVENT_TYPE_ICONS } from '../constants';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, MapPin, Clock, Repeat, Trash2, Bell } from 'lucide-react';
import NotificationEditor from './NotificationEditor';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  initialDate: Date | null;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  initialDate,
}) => {
  const { calendars, addEvent, updateEvent, deleteEvent } = useApp();

  const getDefaultStartDate = () => {
    const date = initialDate || new Date();
    return formatDate(date, "yyyy-MM-dd'T'HH:mm");
  };

  const getDefaultEndDate = () => {
    const date = initialDate || new Date();
    date.setHours(date.getHours() + 1);
    return formatDate(date, "yyyy-MM-dd'T'HH:mm");
  };

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(getDefaultStartDate());
  const [end, setEnd] = useState(getDefaultEndDate());
  const [allDay, setAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState(calendars[0]?.id || '');
  const [eventType, setEventType] = useState<EventType>('event');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [location, setLocation] = useState('');
  const [notifications, setNotifications] = useState<EventNotification[]>([]);

  // Reset form when modal opens/closes or event changes
  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title);
        setDescription(event.description);
        setStart(formatDate(event.start, "yyyy-MM-dd'T'HH:mm"));
        setEnd(formatDate(event.end, "yyyy-MM-dd'T'HH:mm"));
        setAllDay(event.allDay);
        setCalendarId(event.calendarId);
        setEventType(event.type);
        setRecurrence(event.recurrence);
        setLocation(event.location || '');
        setNotifications(event.notifications || []);
      } else {
        setTitle('');
        setDescription('');
        setStart(getDefaultStartDate());
        setEnd(getDefaultEndDate());
        setAllDay(false);
        setCalendarId(calendars.find(c => c.isDefault)?.id || calendars[0]?.id || '');
        setEventType('event');
        setRecurrence('none');
        setLocation('');
        // Default notification for new events
        setNotifications([{
          id: crypto.randomUUID(),
          type: 'push',
          time: 30,
          unit: 'minutes',
        }]);
      }
    }
  }, [isOpen, event, initialDate, calendars]);

  const handleSave = () => {
    if (!title.trim()) return;

    const now = new Date().toISOString();
    const eventData: CalendarEvent = {
      id: event?.id || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      allDay,
      calendarId,
      type: eventType,
      recurrence,
      location: location.trim() || undefined,
      notifications: notifications.length > 0 ? notifications : undefined,
      isDeleted: false,
      createdAt: event?.createdAt || now,
      updatedAt: now,
    };

    if (event) {
      updateEvent(eventData);
    } else {
      addEvent(eventData);
    }

    onClose();
  };

  const handleDelete = () => {
    if (event) {
      deleteEvent(event.id);
      onClose();
    }
  };

  const selectedCalendar = calendars.find(c => c.id === calendarId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: selectedCalendar?.color || '#4285F4' }}
            />
            {event ? 'Editar evento' : 'Nuevo evento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Input
              placeholder="Añadir título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium border-0 border-b rounded-none focus-visible:ring-0 px-0"
              autoFocus
            />
          </div>

          {/* Event type */}
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => (
              <Button
                key={type}
                variant={eventType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEventType(type)}
                className="flex-1 min-w-[80px]"
              >
                {EVENT_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>

          {/* Date/Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    type={allDay ? 'date' : 'datetime-local'}
                    value={allDay ? start.split('T')[0] : start}
                    onChange={(e) => setStart(allDay ? `${e.target.value}T00:00` : e.target.value)}
                    className="flex-1 min-w-[140px]"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type={allDay ? 'date' : 'datetime-local'}
                    value={allDay ? end.split('T')[0] : end}
                    onChange={(e) => setEnd(allDay ? `${e.target.value}T23:59` : e.target.value)}
                    className="flex-1 min-w-[140px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="all-day"
                    checked={allDay}
                    onCheckedChange={setAllDay}
                  />
                  <Label htmlFor="all-day" className="text-sm">Todo el día</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="flex items-center gap-3">
            <Repeat className="w-5 h-5 text-muted-foreground shrink-0" />
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {RECURRENCE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Añadir ubicación"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Notifications */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground shrink-0" />
              <Label className="text-sm font-medium">Notificaciones</Label>
            </div>
            <div className="pl-8">
              <NotificationEditor
                notifications={notifications}
                onChange={setNotifications}
              />
            </div>
          </div>

          {/* Calendar */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

          {/* Description */}
          <div>
            <Textarea
              placeholder="Añadir descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-2">
          {event ? (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
