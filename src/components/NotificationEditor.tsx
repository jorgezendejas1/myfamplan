import React from 'react';
import { EventNotification, NotificationType, NotificationTimeUnit } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, Plus, X } from 'lucide-react';

interface NotificationEditorProps {
  notifications: EventNotification[];
  onChange: (notifications: EventNotification[]) => void;
}

const NOTIFICATION_TYPE_OPTIONS: { value: NotificationType; label: string; icon: React.ReactNode }[] = [
  { value: 'email', label: 'Correo', icon: <Mail className="w-4 h-4" /> },
  { value: 'push', label: 'Notificación', icon: <Bell className="w-4 h-4" /> },
];

const TIME_UNIT_OPTIONS: { value: NotificationTimeUnit; label: string }[] = [
  { value: 'minutes', label: 'minutos' },
  { value: 'hours', label: 'horas' },
  { value: 'days', label: 'días' },
  { value: 'weeks', label: 'semanas' },
];

const NotificationEditor: React.FC<NotificationEditorProps> = ({
  notifications,
  onChange,
}) => {
  const addNotification = () => {
    const newNotification: EventNotification = {
      id: crypto.randomUUID(),
      type: 'email',
      time: 30,
      unit: 'minutes',
    };
    onChange([...notifications, newNotification]);
  };

  const updateNotification = (id: string, updates: Partial<EventNotification>) => {
    onChange(
      notifications.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      )
    );
  };

  const removeNotification = (id: string) => {
    onChange(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-2">
      {notifications.map((notification, index) => (
        <div 
          key={notification.id} 
          className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
        >
          <Select
            value={notification.type}
            onValueChange={(value: NotificationType) =>
              updateNotification(notification.id, { type: value })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            min={1}
            value={notification.time}
            onChange={(e) =>
              updateNotification(notification.id, {
                time: parseInt(e.target.value) || 1,
              })
            }
            className="w-[70px]"
          />

          <Select
            value={notification.unit}
            onValueChange={(value: NotificationTimeUnit) =>
              updateNotification(notification.id, { unit: value })
            }
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_UNIT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground whitespace-nowrap">antes</span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeNotification(notification.id)}
            className="h-8 w-8 shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addNotification}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Añadir notificación
      </Button>
    </div>
  );
};

export default NotificationEditor;
