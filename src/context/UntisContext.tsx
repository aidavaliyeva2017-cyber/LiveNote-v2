import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';
import { addDays, startOfWeek, endOfWeek } from 'date-fns';
import { UntisLesson, UntisSession } from '../types/untis';
import * as untisService from '../services/untisService';

// ─── SecureStore keys ─────────────────────────────────────────────────────────
const KEY_USERNAME    = 'untis_username';
const KEY_PASSWORD    = 'untis_password';
const KEY_PERSON_ID   = 'untis_person_id';
const KEY_PERSON_TYPE = 'untis_person_type';
const KEY_SESSION_ID  = 'untis_session_id';

// ─── Context types ────────────────────────────────────────────────────────────
interface UntisContextValue {
  connected: boolean;
  username: string | null;
  loading: boolean;
  connectError: string | null;
  timetable: UntisLesson[];
  subjectColorMap: Record<string, string>;
  connect: (username: string, password: string) => Promise<void>;
  disconnect: () => Promise<void>;
  fetchTimetable: (startDate: Date, endDate: Date) => Promise<void>;
}

const UntisContext = createContext<UntisContextValue | undefined>(undefined);

export const UntisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession]         = useState<UntisSession | null>(null);
  const [username, setUsername]       = useState<string | null>(null);
  const [timetable, setTimetable]     = useState<UntisLesson[]>([]);
  const [subjectColorMap, setColorMap] = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  // ── Bootstrap: restore session from SecureStore ────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedUser, storedPass, storedPersonId, storedPersonType, storedSessionId] =
          await Promise.all([
            SecureStore.getItemAsync(KEY_USERNAME),
            SecureStore.getItemAsync(KEY_PASSWORD),
            SecureStore.getItemAsync(KEY_PERSON_ID),
            SecureStore.getItemAsync(KEY_PERSON_TYPE),
            SecureStore.getItemAsync(KEY_SESSION_ID),
          ]);

        if (!storedUser || !storedPass) return;

        // Try restoring stored session first
        if (storedSessionId && storedPersonId && storedPersonType) {
          const restored: UntisSession = {
            sessionId:  storedSessionId,
            personId:   parseInt(storedPersonId, 10),
            personType: parseInt(storedPersonType, 10),
            klasseId:   0,
          };
          setSession(restored);
          setUsername(storedUser);
          await loadColorsAndTimetable(restored, storedUser);
        } else {
          // Re-authenticate with stored credentials
          await loginWithCredentials(storedUser, storedPass);
        }
      } catch {
        // Network unavailable or session invalid — will retry on next open
      }
    };
    void bootstrap();
  }, []);

  // ── Re-authenticate when app comes to foreground ──────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (username) {
          try {
            const storedPass = await SecureStore.getItemAsync(KEY_PASSWORD);
            if (storedPass) await loginWithCredentials(username, storedPass);
          } catch {
            // silently ignore
          }
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [username]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const loadColorsAndTimetable = async (sess: UntisSession, _user: string) => {
    const [subjects] = await Promise.all([
      untisService.getSubjects(sess.sessionId),
    ]);
    const colorMap = untisService.buildSubjectColorMap(subjects);
    setColorMap(colorMap);

    // Load current week
    const now   = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end   = endOfWeek(now, { weekStartsOn: 1 });
    const lessons = await untisService.getTimetable(sess, start, addDays(end, 14));
    setTimetable(lessons);
  };

  const loginWithCredentials = async (user: string, pass: string): Promise<UntisSession> => {
    const sess = await untisService.login(user, pass);
    setSession(sess);
    setUsername(user);
    await SecureStore.setItemAsync(KEY_SESSION_ID,  sess.sessionId);
    await SecureStore.setItemAsync(KEY_PERSON_ID,   String(sess.personId));
    await SecureStore.setItemAsync(KEY_PERSON_TYPE, String(sess.personType));
    return sess;
  };

  // ── Public API ────────────────────────────────────────────────────────────
  const connect = useCallback(async (user: string, pass: string) => {
    setLoading(true);
    setConnectError(null);
    try {
      const sess = await loginWithCredentials(user, pass);
      // Persist credentials securely
      await SecureStore.setItemAsync(KEY_USERNAME, user);
      await SecureStore.setItemAsync(KEY_PASSWORD, pass);
      await loadColorsAndTimetable(sess, user);
    } catch (err: any) {
      const msg: string = err?.message ?? 'Login failed';
      const friendly = msg.toLowerCase().includes('bad credentials') || msg.includes('Unauthorized')
        ? 'Login failed. Please check your credentials.'
        : msg.includes('Network') || msg.includes('fetch')
        ? 'No internet connection. Please try again.'
        : 'Login failed. Please check your credentials.';
      setConnectError(friendly);
      throw new Error(friendly);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (session) {
      await untisService.logout(session.sessionId);
    }
    await Promise.all([
      SecureStore.deleteItemAsync(KEY_USERNAME),
      SecureStore.deleteItemAsync(KEY_PASSWORD),
      SecureStore.deleteItemAsync(KEY_PERSON_ID),
      SecureStore.deleteItemAsync(KEY_PERSON_TYPE),
      SecureStore.deleteItemAsync(KEY_SESSION_ID),
    ]);
    setSession(null);
    setUsername(null);
    setTimetable([]);
    setColorMap({});
    setConnectError(null);
  }, [session]);

  const fetchTimetable = useCallback(async (startDate: Date, endDate: Date) => {
    if (!session) return;
    setLoading(true);
    try {
      const lessons = await untisService.getTimetable(session, startDate, endDate);
      setTimetable(lessons);
    } catch (err: any) {
      // Session expired — try re-login
      const storedPass = await SecureStore.getItemAsync(KEY_PASSWORD);
      const storedUser = await SecureStore.getItemAsync(KEY_USERNAME);
      if (storedUser && storedPass) {
        try {
          const newSess = await loginWithCredentials(storedUser, storedPass);
          const lessons = await untisService.getTimetable(newSess, startDate, endDate);
          setTimetable(lessons);
        } catch {
          // failed again — keep old data
        }
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  return (
    <UntisContext.Provider value={{
      connected: !!session,
      username,
      loading,
      connectError,
      timetable,
      subjectColorMap,
      connect,
      disconnect,
      fetchTimetable,
    }}>
      {children}
    </UntisContext.Provider>
  );
};

export const useUntis = () => {
  const ctx = useContext(UntisContext);
  if (!ctx) throw new Error('useUntis must be used within UntisProvider');
  return ctx;
};
