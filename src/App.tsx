import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CalendarEvent, Calendar, Settings, ViewType, ChatMessage } from './types';
import { STORAGE_KEYS, DEFAULT_CALENDARS, DEFAULT_SETTINGS } from './constants';
import { addMonths, addWeeks, addDays } from './utils/dateUtils';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import AgendaView from './components/AgendaView';
import EventModal from './components/EventModal';
import SettingsModal from './components/SettingsModal';
import TrashModal from './components/TrashModal';
import ChatBot from './components/ChatBot';
import InstructionsModal from './components/InstructionsModal';
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

// Load from localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Save to localStorage
const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

function App() {
  // State
  const [events, setEvents] = useState<CalendarEvent[]>(() => 
    loadFromStorage(STORAGE_KEYS.EVENTS, [])
  );
  const [calendars, setCalendars] = useState<Calendar[]>(() => 
    loadFromStorage(STORAGE_KEYS.CALENDARS, DEFAULT_CALENDARS)
  );
  const [settings, setSettings] = useState<Settings>(() => 
    loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => 
    loadFromStorage(STORAGE_KEYS.CHAT_HISTORY, [])
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>(settings.defaultView);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);

  // Persist to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EVENTS, events);
  }, [events]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CALENDARS, calendars);
  }, [calendars]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CHAT_HISTORY, chatMessages);
  }, [chatMessages]);

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

  // CRUD operations
  const addEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
  }, []);

  const updateEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
  }, []);

  const deleteEvent = useCallback((id: string, permanent = false) => {
    if (permanent) {
      setEvents(prev => prev.filter(e => e.id !== id));
    } else {
      setEvents(prev => prev.map(e => 
        e.id === id ? { ...e, isDeleted: true, deletedAt: new Date().toISOString() } : e
      ));
    }
  }, []);

  const restoreEvent = useCallback((id: string) => {
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, isDeleted: false, deletedAt: undefined } : e
    ));
  }, []);

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
    setCurrentDate,
    setView,
    setSelectedEvent,
    setChatMessages,
    addEvent,
    updateEvent,
    deleteEvent,
    restoreEvent,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <Header 
          onNavigate={navigatePeriod}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenTrash={() => setShowTrashModal(true)}
          onShowInstructions={() => setShowInstructions(true)}
        />

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar 
            isOpen={sidebarOpen}
            onCreateEvent={() => handleCreateEvent()}
          />

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

        {/* Chat FAB */}
        <button
          onClick={() => setShowChatBot(!showChatBot)}
          className="fixed bottom-6 right-24 w-12 h-12 rounded-full shadow-calendar flex items-center justify-center bg-card text-foreground hover:shadow-calendar-lg transition-all duration-200 hover:scale-105 active:scale-95 z-40"
          aria-label="Abrir asistente"
        >
          <MessageCircle className="w-5 h-5" />
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
