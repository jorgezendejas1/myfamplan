import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../App';
import { ViewType } from '../types';
import { 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Trash2, 
  Search,
  HelpCircle,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenTrash: () => void;
  onShowInstructions: () => void;
}

const VIEW_LABELS: Record<ViewType, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
  agenda: 'Agenda',
};

const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onToggleSidebar,
  onOpenSettings,
  onOpenTrash,
  onShowInstructions,
}) => {
  const { currentDate, view, setView } = useApp();

  const getTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, "d 'de' MMMM yyyy", { locale: es });
      case 'week':
        return format(currentDate, "MMMM yyyy", { locale: es });
      case 'month':
        return format(currentDate, "MMMM yyyy", { locale: es });
      case 'agenda':
        return 'Agenda';
      default:
        return format(currentDate, "MMMM yyyy", { locale: es });
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card flex items-center px-2 sm:px-4 gap-1 sm:gap-2 shrink-0">
      {/* Menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Logo */}
      <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
        </div>
        <span className="text-lg sm:text-xl font-display font-medium hidden md:block">Calendario</span>
      </div>

      {/* Today button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate('today')}
        className="hidden md:flex h-8 text-xs sm:text-sm"
      >
        Hoy
      </Button>

      {/* Navigation */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('prev')}
          aria-label="Anterior"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('next')}
          aria-label="Siguiente"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Current period title */}
      <h1 className="text-sm sm:text-lg md:text-xl font-display font-medium capitalize ml-1 sm:ml-2 truncate">
        {getTitle()}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
            {VIEW_LABELS[view]}
            <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(VIEW_LABELS) as ViewType[]).map((v) => (
            <DropdownMenuItem
              key={v}
              onClick={() => setView(v)}
              className={view === v ? 'bg-accent' : ''}
            >
              {VIEW_LABELS[v]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile view selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Calendar className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onNavigate('today')}>
            Hoy
          </DropdownMenuItem>
          {(Object.keys(VIEW_LABELS) as ViewType[]).map((v) => (
            <DropdownMenuItem
              key={v}
              onClick={() => setView(v)}
              className={view === v ? 'bg-accent' : ''}
            >
              {VIEW_LABELS[v]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowInstructions}
          aria-label="Ayuda"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenTrash}
          aria-label="Papelera"
          className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Configuración"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
