import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CalendarEvent, Calendar, Settings, ViewType, ChatMessage } from './types';
import { addMonths, addWeeks, addDays } from './utils/dateUtils';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileDrawer from './components/MobileDrawer';
import SidebarContent from './components/SidebarContent';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import AgendaView from './components/AgendaView';
import EventModal from './components/EventModal';
import SettingsModal from './components/SettingsModal';
import TrashModal from './components/TrashModal';
import ChatBot from './components/ChatBot';
import InstructionsModal from './components/InstructionsModal';
import OnboardingModal from './components/OnboardingModal';
import { useOnboarding } from './hooks/useOnboarding';
import { useIsMobile } from './hooks/use-mobile';
import { useGoogleSync } from './hooks/useGoogleSync';
import { useCalendars } from './hooks/useCalendars';
import { useEvents } from './hooks/useEvents';
import { useSettings } from './hooks/useSettings';
import { useChatHistory } from './hooks/useChatHistory';
import { startNotificationService, stopNotificationService } from './services/notificationService';
import { Plus, MessageCircle } from 'lucide-react';

// Context for global state
interface AppContextType {
  events: CalendarEvent[];
  calendars: Calendar[];
  settings: Settings;
  currentDate: Date;
  view: ViewType;
  selectedEvent: CalendarEvent | null;
  chatMessages: ChatMessage[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setCalendars: React.Dispatch<React.SetStateAction<Calendar[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  setSelectedEvent: React.Dispatch<React.SetStateAction<CalendarEvent | null>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string, permanent?: boolean) => void;
  restoreEvent: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

function App() {
  // Cloud-synced hooks
  const { events, setEvents, addEvent, updateEvent, deleteEvent, restoreEvent, importGoogleEvents } = useEvents();
  const { calendars, setCalendars } = useCalendars();
  const { settings, setSettings } = useSettings();
  const { chatMessages, setChatMessages } = useChatHistory();

  const [currentDate, setCurrentDate] = useState(new Date());
  // Always use 'agenda' as default view
  const [view, setView] = useState<ViewType>('agenda');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);

  // Hooks
  const isMobile = useIsMobile();
  const { showOnboarding, completeOnboarding, closeOnboarding } = useOnboarding();

  // Google Calendar auto-sync
  const { manualSync } = useGoogleSync({
    onEventsImported: importGoogleEvents,
    enabled: true,
  });

  // Refs for notification service to avoid stale closures
  const eventsRef = React.useRef(events);
  const emailRef = React.useRef(settings.notificationEmail);
  
  // Keep refs updated
  React.useEffect(() => {
    eventsRef.current = events;
  }, [events]);
  
  React.useEffect(() => {
    emailRef.current = settings.notificationEmail;
  }, [settings.notificationEmail]);

  // Start notification service once
  useEffect(() => {
    startNotificationService(
      () => eventsRef.current,
      () => emailRef.current
    );

    return () => {
      stopNotificationService();
    };
  }, []);

  // Theme handling
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (settings.theme === 'dark' || (settings.theme === 'system' && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Navigation
  const navigatePeriod = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const delta = direction === 'next' ? 1 : -1;
    
    setCurrentDate(prev => {
      switch (view) {
        case 'month':
          return addMonths(prev, delta);
        case 'week':
        case 'agenda':
          return addWeeks(prev, delta);
        case 'day':
          return addDays(prev, delta);
        default:
          return prev;
      }
    });
  }, [view]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'j':
          navigatePeriod('next');
          break;
        case 'k':
          navigatePeriod('prev');
          break;
        case 't':
          navigatePeriod('today');
          break;
        case 'c':
          setNewEventDate(new Date());
          setShowEventModal(true);
          break;
        case '1':
          setView('day');
          break;
        case '2':
          setView('week');
          break;
        case '3':
          setView('month');
          break;
        case '4':
          setView('agenda');
          break;
        case '?':
          setShowInstructions(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigatePeriod]);

  // Create new event
  const handleCreateEvent = (date?: Date) => {
    setSelectedEvent(null);
    setNewEventDate(date || new Date());
    setShowEventModal(true);
  };

  // Edit event
  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setNewEventDate(null);
    setShowEventModal(true);
  };

  // Get visible calendar IDs
  const visibleCalendarIds = calendars.filter(c => c.isVisible).map(c => c.id);

  const contextValue: AppContextType = {
    events,
    calendars,
    settings,
    currentDate,
    view,
    selectedEvent,
    chatMessages,
    setEvents,
    setCalendars,
    setSettings,
    updateEvent,
    setCurrentDate,
    setView,
    setSelectedEvent,
    setChatMessages,
    addEvent,
    deleteEvent,
    restoreEvent,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <Header 
          onNavigate={navigatePeriod}
          onToggleSidebar={() => isMobile ? setMobileDrawerOpen(true) : setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenTrash={() => setShowTrashModal(true)}
          onShowInstructions={() => setShowInstructions(true)}
          onManualSync={manualSync}
        />

        {/* Mobile Drawer */}
        <MobileDrawer 
          isOpen={mobileDrawerOpen} 
          onClose={() => setMobileDrawerOpen(false)}
        >
          <SidebarContent 
            onCreateEvent={() => handleCreateEvent()}
            onCloseMobile={() => setMobileDrawerOpen(false)}
          />
        </MobileDrawer>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <Sidebar 
              isOpen={sidebarOpen}
              onCreateEvent={() => handleCreateEvent()}
            />
          )}

          {/* Calendar view */}
          <main className="flex-1 overflow-hidden">
            {view === 'month' && (
              <MonthView 
                visibleCalendarIds={visibleCalendarIds}
                onSelectDate={handleCreateEvent}
                onSelectEvent={handleEditEvent}
              />
            )}
            {view === 'week' && (
              <WeekView 
                visibleCalendarIds={visibleCalendarIds}
                onSelectTime={handleCreateEvent}
                onSelectEvent={handleEditEvent}
              />
            )}
            {view === 'day' && (
              <DayView 
                visibleCalendarIds={visibleCalendarIds}
                onSelectTime={handleCreateEvent}
                onSelectEvent={handleEditEvent}
              />
            )}
            {view === 'agenda' && (
              <AgendaView 
                visibleCalendarIds={visibleCalendarIds}
                onSelectEvent={handleEditEvent}
              />
            )}
          </main>
        </div>

        {/* FAB - Create Event */}
        <button
          onClick={() => handleCreateEvent()}
          className="fab z-40"
          aria-label="Crear evento"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Chat FAB - responsive position */}
        <button
          onClick={() => setShowChatBot(!showChatBot)}
          className="fixed bottom-20 right-20 sm:bottom-6 sm:right-24 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-calendar flex items-center justify-center bg-card text-foreground hover:shadow-calendar-lg transition-all duration-200 hover:scale-105 active:scale-95 z-40"
          aria-label="Abrir asistente"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modals */}
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
            setNewEventDate(null);
          }}
          event={selectedEvent}
          initialDate={newEventDate}
        />

        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />

        <TrashModal
          isOpen={showTrashModal}
          onClose={() => setShowTrashModal(false)}
        />

        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
        />

        {/* Onboarding */}
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={closeOnboarding}
          onComplete={completeOnboarding}
        />

        {/* ChatBot */}
        <ChatBot 
          isOpen={showChatBot}
          onClose={() => setShowChatBot(false)}
        />
      </div>
    </AppContext.Provider>
  );
}

export default App;
