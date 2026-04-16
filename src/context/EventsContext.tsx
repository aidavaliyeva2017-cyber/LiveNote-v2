import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { addDays, addMonths, format } from 'date-fns';
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
  'id, title, description, location, start_date, end_date, all_day, category, priority, ' +
  'completed, event_type, travel_time, repeat_, repeat_end_date, custom_repeat_interval, alert, url';

// Strip _r<n> suffix from virtual recurring IDs to get the real DB id
const sourceId = (id: string) => id.replace(/_r\d+$/, '');

// ── DB row → CalendarEvent ────────────────────────────────────────────────────
function rowToEvent(row: any): CalendarEvent {
  console.log(
    '[rowToEvent] start_date raw:', row.start_date,
    '→ local:', new Date(row.start_date).toString(),
    '| end_date raw:', row.end_date,
    '→ local:', new Date(row.end_date).toString(),
  );
  return {
    id:          row.id,
    title:       row.title,
    description: row.description ?? undefined,
    location:    row.location    ?? undefined,
    start:       new Date(row.start_date),
    end:         new Date(row.end_date),
    allDay:      row.all_day      ?? false,
    category:    (row.category    as EventCategory) ?? 'personal',
    priority:    (row.priority    as EventPriority)  ?? 'medium',
    completed:   row.completed    ?? false,
    eventType:   (row.event_type  as 'event' | 'reminder') ?? 'event',
    travelTime:           row.travel_time           ?? undefined,
    repeat:               row.repeat_               ?? undefined,
    repeatEndDate:        row.repeat_end_date
                            ? new Date(row.repeat_end_date)
                            : undefined,
    customRepeatInterval: row.custom_repeat_interval ?? undefined,
    alert:                row.alert                 ?? undefined,
    url:                  row.url                   ?? undefined,
  };
}

// ── CalendarEvent → DB row ────────────────────────────────────────────────────
function eventToRow(event: Omit<CalendarEvent, 'id'>, userId: string) {
  console.log(
    '[eventToRow] start local:', event.start.toString(),
    '→ ISO:', event.start.toISOString(),
    '| end local:', event.end.toString(),
    '→ ISO:', event.end.toISOString(),
  );
  return {
    user_id:     userId,
    title:       event.title,
    description: event.description ?? null,
    location:    event.location    ?? null,
    start_date:  event.start.toISOString(),
    end_date:    event.end.toISOString(),
    all_day:     event.allDay      ?? false,
    category:    event.category,
    priority:    event.priority,
    completed:   event.completed   ?? false,
    event_type:  event.eventType   ?? 'event',
    travel_time:            event.travelTime           ?? null,
    repeat_:                event.repeat               ?? null,
    // Store at noon UTC so any UTC±12 timezone reads back the same calendar date
    repeat_end_date:        event.repeatEndDate
                              ? `${format(event.repeatEndDate, 'yyyy-MM-dd')}T12:00:00Z`
                              : null,
    custom_repeat_interval: event.customRepeatInterval ?? null,
    alert:                  event.alert                ?? null,
    url:                    event.url                  ?? null,
  };
}

// ── Expand recurring events into virtual instances ────────────────────────────
const toDateKey = (d: Date) => format(d, 'yyyy-MM-dd');

function expandRecurringEvents(baseEvents: CalendarEvent[]): CalendarEvent[] {
  console.log(`[expandRecurring] START — ${baseEvents.length} DB events`);
  const result: CalendarEvent[] = [...baseEvents];

  for (const evt of baseEvents) {
    if (!evt.repeat || evt.repeat === 'Nie' || !evt.repeatEndDate) continue;

    const durationMs = evt.end.getTime() - evt.start.getTime();
    // Compare as locale date strings to avoid DST/timezone edge cases
    const endKey = toDateKey(evt.repeatEndDate);

    console.log(
      `[expandRecurring] "${evt.title}" | repeat="${evt.repeat}"` +
      ` | start=${toDateKey(evt.start)} | repeatEndDate=${endKey}`,
    );

    let current = evt.start;
    let i = 1;

    while (i <= 730) {
      let next: Date;
      if (evt.repeat === 'Täglich') {
        next = addDays(current, 1);
      } else if (evt.repeat === 'Mo–Fr') {
        next = addDays(current, 1);
        if (next.getDay() === 6) next = addDays(next, 2); // Saturday → Monday
        else if (next.getDay() === 0) next = addDays(next, 1); // Sunday → Monday
      } else if (evt.repeat === 'Wöchentlich') {
        next = addDays(current, 7);
      } else if (evt.repeat === 'Alle 2 Wochen') {
        next = addDays(current, 14);
      } else if (evt.repeat === 'Monatlich') {
        next = addMonths(current, 1);
      } else if (evt.repeat === 'Jährlich') {
        next = addMonths(current, 12);
      } else if (evt.repeat === 'Benutzerdefiniert') {
        const interval = evt.customRepeatInterval ?? 'Jeden Tag';
        if (interval === 'Jeden Tag')       next = addDays(current, 1);
        else if (interval === 'Jede Woche') next = addDays(current, 7);
        else if (interval === 'Alle 2 Wochen') next = addDays(current, 14);
        else if (interval === 'Jeden Monat')   next = addMonths(current, 1);
        else if (interval === 'Jedes Jahr')    next = addMonths(current, 12);
        else break;
      } else {
        break;
      }

      if (toDateKey(next) > endKey) break;

      result.push({
        ...evt,
        id:    `${evt.id}_r${i}`,
        start: next,
        end:   new Date(next.getTime() + durationMs),
      });

      current = next;
      i++;
    }

    console.log(
      `[expandRecurring] "${evt.title}" — ${i - 1} instances added` +
      ` (days: ${Array.from({ length: i - 1 }, (_, k) => toDateKey(addDays(evt.start, k + 1))).join(', ')})`,
    );
  }

  console.log(`[expandRecurring] END — ${result.length} total (${result.length - baseEvents.length} virtual)`);
  return result;
}

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // rawEvents = events exactly as stored in DB (no virtual recurring copies)
  const [rawEvents, setRawEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // events exposed to consumers includes expanded virtual recurring instances
  const events = useMemo(() => expandRecurringEvents(rawEvents), [rawEvents]);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      console.log('[fetchEvents] user=null — skipping fetch (guest mode or not logged in)');
      setRawEvents([]);
      return;
    }
    console.log('[fetchEvents] querying for user_id:', user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(SELECT_COLS)
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('[fetchEvents] Supabase error:', error.message, '| code:', error.code);
        return;
      }
      console.log('[fetchEvents] got', data?.length ?? 0, 'rows from Supabase');
      if (data && data.length > 0) {
        console.log('[fetchEvents] first row:', JSON.stringify({
          id: data[0].id, title: data[0].title,
          start_date: data[0].start_date, end_date: data[0].end_date,
        }));
      }
      setRawEvents((data ?? []).map(rowToEvent));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  // ── addEvent ────────────────────────────────────────────────────────────────
  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    if (!user) throw new Error('Not authenticated');
    const row = eventToRow(event, user.id);
    const { data, error } = await supabase
      .from('events')
      .insert(row)
      .select(SELECT_COLS)
      .single();
    if (error) throw error;
    const newEvent = rowToEvent(data);
    setRawEvents(prev => [...prev, newEvent].sort((a, b) => a.start.getTime() - b.start.getTime()));
    return newEvent;
  }, [user]);

  // ── updateEvent ─────────────────────────────────────────────────────────────
  const updateEvent = useCallback(async (id: string, patch: Partial<CalendarEvent>): Promise<void> => {
    const dbId = sourceId(id);
    const dbPatch: Record<string, any> = {};
    if (patch.title       !== undefined) dbPatch.title       = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description ?? null;
    if (patch.location    !== undefined) dbPatch.location    = patch.location    ?? null;
    if (patch.start       !== undefined) dbPatch.start_date  = patch.start.toISOString();
    if (patch.end         !== undefined) dbPatch.end_date    = patch.end.toISOString();
    if (patch.allDay      !== undefined) dbPatch.all_day     = patch.allDay;
    if (patch.category    !== undefined) dbPatch.category    = patch.category;
    if (patch.priority    !== undefined) dbPatch.priority    = patch.priority;
    if (patch.completed   !== undefined) dbPatch.completed   = patch.completed;
    if (patch.eventType   !== undefined) dbPatch.event_type  = patch.eventType;
    if (patch.travelTime           !== undefined) dbPatch.travel_time            = patch.travelTime           ?? null;
    if (patch.repeat               !== undefined) dbPatch.repeat_                = patch.repeat               ?? null;
    if (patch.repeatEndDate        !== undefined) dbPatch.repeat_end_date        = patch.repeatEndDate ? `${format(patch.repeatEndDate, 'yyyy-MM-dd')}T12:00:00Z` : null;
    if (patch.customRepeatInterval !== undefined) dbPatch.custom_repeat_interval = patch.customRepeatInterval  ?? null;
    if (patch.alert                !== undefined) dbPatch.alert                  = patch.alert                ?? null;
    if (patch.url                  !== undefined) dbPatch.url                    = patch.url                  ?? null;

    if (Object.keys(dbPatch).length > 0) {
      const { error } = await supabase.from('events').update(dbPatch).eq('id', dbId);
      if (error) throw error;
    }
    setRawEvents(prev => prev.map(e => e.id === dbId ? { ...e, ...patch } : e));
  }, []);

  // ── deleteEvent ─────────────────────────────────────────────────────────────
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    const dbId = sourceId(id);
    const { error } = await supabase.from('events').delete().eq('id', dbId);
    if (error) throw error;
    setRawEvents(prev => prev.filter(e => e.id !== dbId));
  }, []);

  // ── toggleComplete ──────────────────────────────────────────────────────────
  const toggleComplete = useCallback((id: string) => {
    const dbId = sourceId(id);
    setRawEvents(prev => {
      const evt = prev.find(e => e.id === dbId);
      if (!evt) return prev;
      const newCompleted = !evt.completed;
      supabase.from('events').update({ completed: newCompleted }).eq('id', dbId)
        .then(({ error }) => {
          if (error) console.error('[EventsContext] toggleComplete error:', error.message);
        });
      return prev.map(e => e.id === dbId ? { ...e, completed: newCompleted } : e);
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
