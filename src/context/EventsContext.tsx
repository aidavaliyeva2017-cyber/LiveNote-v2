import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { CalendarEvent, EventCategory, EventPriority } from '../types/event';

interface EventsContextValue {
  events: CalendarEvent[];
  loading: boolean;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleComplete: (id: string) => void;
  refetch: () => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

// ── DB row → CalendarEvent ────────────────────────────────────────────────────
function rowToEvent(row: any): CalendarEvent {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description ?? undefined,
    start:       new Date(row.start_date),
    end:         new Date(row.end_date),
    category:    (row.category as EventCategory) ?? 'personal',
    priority:    (row.priority as EventPriority)  ?? 'medium',
    completed:   row.completed ?? false,
  };
}

// ── CalendarEvent → DB row (only persisted columns) ──────────────────────────
function eventToRow(event: Omit<CalendarEvent, 'id'>, userId: string) {
  return {
    user_id:     userId,
    title:       event.title,
    description: event.description ?? null,
    start_date:  event.start.toISOString(),
    end_date:    event.end.toISOString(),
  };
}

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [events,  setEvents]  = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) { setEvents([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, start_date, end_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('[EventsContext] fetch error:', error.message);
        return;
      }
      setEvents((data ?? []).map(rowToEvent));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  // ── addEvent ────────────────────────────────────────────────────────────────
  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('events')
      .insert(eventToRow(event, user.id))
      .select('id, title, description, start_date, end_date')
      .single();
    if (error) throw error;
    const newEvent = rowToEvent(data);
    setEvents(prev => [...prev, newEvent].sort((a, b) => a.start.getTime() - b.start.getTime()));
    return newEvent;
  }, [user]);

  // ── updateEvent ─────────────────────────────────────────────────────────────
  const updateEvent = useCallback(async (id: string, patch: Partial<CalendarEvent>): Promise<void> => {
    const dbPatch: Record<string, any> = {};
    if (patch.title       !== undefined) dbPatch.title       = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description ?? null;
    if (patch.start       !== undefined) dbPatch.start_date  = patch.start.toISOString();
    if (patch.end         !== undefined) dbPatch.end_date    = patch.end.toISOString();

    if (Object.keys(dbPatch).length > 0) {
      const { error } = await supabase.from('events').update(dbPatch).eq('id', id);
      if (error) throw error;
    }
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  // ── deleteEvent ─────────────────────────────────────────────────────────────
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── toggleComplete (local only — no `completed` column in DB) ───────────────
  const toggleComplete = useCallback((id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  }, []);

  const value = useMemo(() => ({
    events, loading, addEvent, updateEvent, deleteEvent, toggleComplete, refetch: fetchEvents,
  }), [events, loading, addEvent, updateEvent, deleteEvent, toggleComplete, fetchEvents]);

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = (): EventsContextValue => {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
};
