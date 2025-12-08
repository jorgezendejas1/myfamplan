import React from 'react';
import { useApp } from '../App';
import { formatDate } from '../utils/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, RotateCcw, XCircle } from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose }) => {
  const { events, calendars, restoreEvent, deleteEvent } = useApp();

  const deletedEvents = events.filter(e => e.isDeleted);

  const getCalendarColor = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.color || '#4285F4';
  };

  const handleRestore = (id: string) => {
    restoreEvent(id);
  };

  const handlePermanentDelete = (id: string) => {
    deleteEvent(id, true);
  };

  const handleEmptyTrash = () => {
    deletedEvents.forEach(e => deleteEvent(e.id, true));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Papelera
          </DialogTitle>
          <DialogDescription>
            Los eventos eliminados se pueden restaurar o eliminar permanentemente.
          </DialogDescription>
        </DialogHeader>

        {deletedEvents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>La papelera está vacía</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {deletedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 group"
                  >
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(event.start, "d MMM yyyy")}
                        {event.deletedAt && (
                          <> · Eliminado {formatDate(event.deletedAt, "d MMM")}</>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRestore(event.id)}
                        title="Restaurar"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePermanentDelete(event.id)}
                        title="Eliminar permanentemente"
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end pt-2">
              <Button variant="destructive" size="sm" onClick={handleEmptyTrash}>
                <Trash2 className="w-4 h-4 mr-2" />
                Vaciar papelera
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrashModal;
