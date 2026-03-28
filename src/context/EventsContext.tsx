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

// Columns selected in every query
const SELECT_COLS =
  'id, title, description, start_date, end_date, all_day, category, priority, ' +
  'completed, event_type, travel_time, repeat, alert, url';

// ── DB row → CalendarEvent ────────────────────────────────────────────────────
function rowToEvent(row: any): CalendarEvent {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description  ?? undefined,
    start:       new Date(row.start_date),
    end:         new Date(row.end_date),
    allDay:      row.all_day      ?? false,
    category:    (row.category    as EventCategory) ?? 'personal',
    priority:    (row.priority    as EventPriority)  ?? 'medium',
    completed:   row.completed    ?? false,
    eventType:   (row.event_type  as 'event' | 'reminder') ?? 'event',
    travelTime:  row.travel_time  ?? undefined,
    repeat:      row.repeat       ?? undefined,
    alert:       row.alert        ?? undefined,
    url:         row.url          ?? undefined,
  };
}

// ── CalendarEvent → DB row ────────────────────────────────────────────────────
function eventToRow(event: Omit<CalendarEvent, 'id'>, userId: string) {
  return {
    user_id:     userId,
    title:       event.title,
    description: event.description ?? null,
    start_date:  event.start.toISOString(),
    end_date:    event.end.toISOString(),
    all_day:     event.allDay      ?? false,
    category:    event.category,
    priority:    event.priority,
    completed:   event.completed   ?? false,
    event_type:  event.eventType   ?? 'event',
    travel_time: event.travelTime  ?? null,
    repeat:      event.repeat      ?? null,
    alert:       event.alert       ?? null,
    url:         event.url         ?? null,
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
        .select(SELECT_COLS)
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
      .select(SELECT_COLS)
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
    if (patch.allDay      !== undefined) dbPatch.all_day     = patch.allDay;
    if (patch.category    !== undefined) dbPatch.category    = patch.category;
    if (patch.priority    !== undefined) dbPatch.priority    = patch.priority;
    if (patch.completed   !== undefined) dbPatch.completed   = patch.completed;
    if (patch.eventType   !== undefined) dbPatch.event_type  = patch.eventType;
    if (patch.travelTime  !== undefined) dbPatch.travel_time = patch.travelTime  ?? null;
    if (patch.repeat      !== undefined) dbPatch.repeat      = patch.repeat      ?? null;
    if (patch.alert       !== undefined) dbPatch.alert       = patch.alert       ?? null;
    if (patch.url         !== undefined) dbPatch.url         = patch.url         ?? null;

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

  // ── toggleComplete ──────────────────────────────────────────────────────────
  const toggleComplete = useCallback((id: string) => {
    setEvents(prev => {
      const evt = prev.find(e => e.id === id);
      if (!evt) return prev;
      const newCompleted = !evt.completed;
      supabase.from('events').update({ completed: newCompleted }).eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[EventsContext] toggleComplete error:', error.message);
        });
      return prev.map(e => e.id === id ? { ...e, completed: newCompleted } : e);
    });
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
