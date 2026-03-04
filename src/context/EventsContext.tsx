import React, { createContext, useContext, useMemo, useState } from 'react';
import { addHours, startOfDay } from 'date-fns';
import { CalendarEvent, EventCategory, EventPriority } from '../types/event';

interface EventsContextValue {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleComplete: (id: string) => void;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

const createMockEvents = (): CalendarEvent[] => {
  const now = new Date();
  const base = startOfDay(now);
  const make = (
    title: string,
    offsetHours: number,
    durationHours: number,
    category: EventCategory,
    priority: EventPriority,
    completed?: boolean,
  ): CalendarEvent => {
    const start = addHours(base, offsetHours);
    const end = addHours(start, durationHours);
    return {
      id: `${title}-${offsetHours}`,
      title,
      start,
      end,
      category,
      priority,
      completed,
    };
  };

  return [
    make('Morning Yoga', 8, 1, 'health', 'low', true),
    make('Check Emails', 9, 1, 'work', 'medium', true),
    make('Study Chemistry — Ch. 7', 10, 2, 'work', 'high'),
    make('Grocery Shopping', 13, 1, 'errands', 'medium'),
    make('Video Call with Mom', 14.5, 0.75, 'personal', 'medium'),
  ];
};

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => createMockEvents());

  const addEvent: EventsContextValue['addEvent'] = (event) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent: EventsContextValue['updateEvent'] = (id, patch) => {
    setEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, ...patch } : evt)),
    );
  };

  const deleteEvent: EventsContextValue['deleteEvent'] = (id) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== id));
  };

  const toggleComplete: EventsContextValue['toggleComplete'] = (id) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === id ? { ...evt, completed: !evt.completed } : evt,
      ),
    );
  };

  const value = useMemo(
    () => ({ events, addEvent, updateEvent, deleteEvent, toggleComplete }),
    [events],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = () => {
  const ctx = useContext(EventsContext);
  if (!ctx) {
    throw new Error('useEvents must be used within EventsProvider');
  }
  return ctx;
};

