/**
 * Mobile Drawer Component
 * 
 * Responsive drawer that slides from left on mobile devices.
 * Uses Sheet component for smooth animations.
 */

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Calendar } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, children }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            Calendario
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-auto h-[calc(100vh-4rem)]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileDrawer;
