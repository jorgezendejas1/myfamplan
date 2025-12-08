import React, { useState } from 'react';
import { useApp } from '../App';
import { Settings } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { downloadICS, importFromICS } from '../utils/icsUtils';
import { Download, Upload, Moon, Sun, Monitor, Mail, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { requestNotificationPermission } from '../services/notificationService';
import { GoogleAccountsManager } from './GoogleAccountsManager';
import type { CalendarEvent } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings, events, setEvents, calendars } = useApp();
  const [emailInput, setEmailInput] = useState(settings.notificationEmail || '');

  const handleThemeChange = (theme: Settings['theme']) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleEmailSave = () => {
    if (emailInput && !emailInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }
    setSettings(prev => ({ ...prev, notificationEmail: emailInput || undefined }));
    toast.success('Correo de notificaciones guardado');
  };

  const handleRequestPushPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success('Notificaciones push activadas');
    } else {
      toast.error('No se pudieron activar las notificaciones push');
    }
  };

  const handleExport = () => {
    const activeEvents = events.filter(e => !e.isDeleted);
    downloadICS(activeEvents, `calendario_${new Date().toISOString().split('T')[0]}.ics`);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ics';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          const defaultCalendar = calendars.find(c => c.isDefault) || calendars[0];
          const importedEvents = importFromICS(content, defaultCalendar?.id || 'primary');
          setEvents(prev => [...prev, ...importedEvents]);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleGoogleEventsImported = (googleEvents: CalendarEvent[]) => {
    // Merge Google events avoiding duplicates
    setEvents(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const newEvents = googleEvents.filter(e => !existingIds.has(e.id));
      return [...prev, ...newEvents];
    });
    toast.success(`${googleEvents.length} eventos de Google Calendar importados`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tema</Label>
            <div className="flex gap-2">
              <Button
                variant={settings.theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('light')}
                className="flex-1"
              >
                <Sun className="w-4 h-4 mr-2" />
                Claro
              </Button>
              <Button
                variant={settings.theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('dark')}
                className="flex-1"
              >
                <Moon className="w-4 h-4 mr-2" />
                Oscuro
              </Button>
              <Button
                variant={settings.theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('system')}
                className="flex-1"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Sistema
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificaciones
            </Label>
            
            {/* Email for notifications */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Correo para recordatorios</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleEmailSave} variant="outline">
                  Guardar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recibirás recordatorios por correo en esta dirección
              </p>
            </div>

            {/* Push notifications permission */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Notificaciones push</p>
                <p className="text-xs text-muted-foreground">
                  Recibe alertas en tu navegador
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRequestPushPermission}
              >
                Activar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Default view */}
          <div className="flex items-center justify-between">
            <Label>Vista predeterminada</Label>
            <Select 
              value={settings.defaultView} 
              onValueChange={(v) => setSettings(prev => ({ ...prev, defaultView: v as Settings['defaultView'] }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Week starts on */}
          <div className="flex items-center justify-between">
            <Label>La semana empieza el</Label>
            <Select 
              value={String(settings.weekStartsOn)} 
              onValueChange={(v) => setSettings(prev => ({ ...prev, weekStartsOn: Number(v) as 0 | 1 }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Lunes</SelectItem>
                <SelectItem value="0">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time format */}
          <div className="flex items-center justify-between">
            <Label>Formato de hora</Label>
            <Select 
              value={settings.timeFormat} 
              onValueChange={(v) => setSettings(prev => ({ ...prev, timeFormat: v as '12h' | '24h' }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="12h">12 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Google Calendar Sync */}
          <div className="space-y-3">
            <GoogleAccountsManager onEventsImported={handleGoogleEventsImported} />
          </div>

          <Separator />

          {/* Import/Export */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Datos</Label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Exportar .ics
              </Button>
              <Button variant="outline" onClick={handleImport} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Importar .ics
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
