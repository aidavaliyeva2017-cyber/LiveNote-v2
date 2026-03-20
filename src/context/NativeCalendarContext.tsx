import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as Calendar from 'expo-calendar';
import { AppState, AppStateStatus } from 'react-native';
import { addMonths, subMonths } from 'date-fns';
import { NativeCalendarEvent } from '../types/nativeCalendar';
import {
  fetchNativeEvents,
  getCalendarPermissionStatus,
  requestCalendarPermission,
} from '../services/nativeCalendarService';

type PermissionState = 'unknown' | 'granted' | 'denied' | 'undetermined';

interface NativeCalendarContextValue {
  events: NativeCalendarEvent[];
  permissionState: PermissionState;
  loading: boolean;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NativeCalendarContext = createContext<NativeCalendarContextValue | undefined>(undefined);

export const NativeCalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<NativeCalendarEvent[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [loading, setLoading] = useState(false);
  const appState = useRef(AppState.currentState);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch a wide window: 6 months back → 12 months forward
      const start = subMonths(new Date(), 6);
      const end = addMonths(new Date(), 12);
      const fetched = await fetchNativeEvents(start, end);
      setEvents(fetched);
    } finally {
      setLoading(false);
    }
  }, []);

  // Bootstrap: check permission and load if already granted
  useEffect(() => {
    const bootstrap = async () => {
      const status = await getCalendarPermissionStatus();
      if (status === 'granted') {
        setPermissionState('granted');
        await load();
      } else if (status === 'denied') {
        setPermissionState('denied');
      } else {
        setPermissionState('undetermined');
      }
    };
    void bootstrap();
  }, []);

  // Reload when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (permissionState === 'granted') {
          await load();
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [permissionState, load]);

  const requestPermission = useCallback(async () => {
    const status = await requestCalendarPermission();
    if (status === 'granted') {
      setPermissionState('granted');
      await load();
    } else {
      setPermissionState('denied');
    }
  }, [load]);

  const refresh = useCallback(async () => {
    if (permissionState === 'granted') {
      await load();
    }
  }, [permissionState, load]);

  return (
    <NativeCalendarContext.Provider
      value={{ events, permissionState, loading, requestPermission, refresh }}
    >
      {children}
    </NativeCalendarContext.Provider>
  );
};

export const useNativeCalendar = () => {
  const ctx = useContext(NativeCalendarContext);
  if (!ctx) throw new Error('useNativeCalendar must be used within NativeCalendarProvider');
  return ctx;
};
