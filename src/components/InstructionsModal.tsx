import React from 'react';
import { KEYBOARD_SHORTCUTS } from '../constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Atajos de teclado
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="grid gap-3">
            {Object.entries(KEYBOARD_SHORTCUTS).map(([key, description]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{description}</span>
                <kbd className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-sm font-mono">
                  {key.toUpperCase()}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center border-t border-border pt-4">
          Presiona <kbd className="px-1 py-0.5 rounded bg-secondary text-[10px]">?</kbd> en cualquier momento para ver estos atajos
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsModal;
