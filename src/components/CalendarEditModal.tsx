import React, { useState, useEffect } from 'react';
import { Calendar } from '../types';
import { CALENDAR_COLORS } from '../constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface CalendarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: Calendar | null;
  onSave: (calendar: Calendar) => void;
  onDelete?: (calendarId: string) => void;
}

const CalendarEditModal: React.FC<CalendarEditModalProps> = ({
  isOpen,
  onClose,
  calendar,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CALENDAR_COLORS[0]);
  const [isDefault, setIsDefault] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Populate form when calendar changes
  useEffect(() => {
    if (calendar) {
      setName(calendar.name);
      setColor(calendar.color);
      setIsDefault(calendar.isDefault);
      setIsVisible(calendar.isVisible);
    } else {
      // Reset for new calendar
      setName('');
      setColor(CALENDAR_COLORS[Math.floor(Math.random() * CALENDAR_COLORS.length)]);
      setIsDefault(false);
      setIsVisible(true);
    }
  }, [calendar, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;

    const calendarData: Calendar = {
      id: calendar?.id || crypto.randomUUID(),
      name: name.trim(),
      color,
      isDefault,
      isVisible,
    };

    onSave(calendarData);
    onClose();
  };

  const handleDelete = () => {
    if (calendar && onDelete) {
      if (calendar.isDefault) {
        alert('No puedes eliminar el calendario predeterminado');
        return;
      }
      
      if (confirm(`¿Estás seguro de eliminar el calendario "${calendar.name}"?`)) {
        onDelete(calendar.id);
        onClose();
      }
    }
  };

  const isEditing = !!calendar;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar calendario' : 'Nuevo calendario'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="calendar-name">Nombre</Label>
            <Input
              id="calendar-name"
              placeholder="Mi calendario"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CALENDAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all duration-150',
                    'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                    color === c && 'ring-2 ring-offset-2 ring-primary scale-110'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Vista previa</Label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium">
                {name || 'Nombre del calendario'}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="is-visible" className="cursor-pointer">
                Mostrar en el calendario
              </Label>
              <Switch
                id="is-visible"
                checked={isVisible}
                onCheckedChange={setIsVisible}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-default" className="cursor-pointer">
                  Calendario predeterminado
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Los nuevos eventos se crearán aquí
                </p>
              </div>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && !calendar?.isDefault && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="sm:mr-auto"
            >
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? 'Guardar cambios' : 'Crear calendario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEditModal;
