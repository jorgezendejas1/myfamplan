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
    <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-2 shrink-0">
      {/* Menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-display font-medium hidden sm:block">Calendario</span>
      </div>

      {/* Today button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate('today')}
        className="hidden sm:flex"
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
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('next')}
          aria-label="Siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Current period title */}
      <h1 className="text-lg md:text-xl font-display font-medium capitalize ml-2">
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
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowInstructions}
          aria-label="Ayuda"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenTrash}
          aria-label="Papelera"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Configuración"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
