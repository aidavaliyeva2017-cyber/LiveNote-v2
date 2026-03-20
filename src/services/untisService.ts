/**
 * WebUntis JSON-RPC service — read-only
 *
 * Server:  https://neilo.webuntis.com
 * School:  hegel-gymnasium-stuttgart
 * API doc: https://untis-sr.ch/wp-content/uploads/2019/11/2018-09-20-WebUntis_JSON_RPC_API.pdf
 */

import { UntisLesson, UntisSession, UntisSubject } from '../types/untis';

const BASE    = 'https://neilo.webuntis.com/WebUntis/jsonrpc.do';
const SCHOOL  = 'hegel-gymnasium-stuttgart';
const CLIENT  = 'LiveNote';
const ENDPOINT = `${BASE}?school=${SCHOOL}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cookieHeader(sessionId: string): string {
  return `JSESSIONID=${sessionId}; schoolname=${encodeURIComponent('"' + SCHOOL + '"')}`;
}

async function rpc<T>(method: string, params: unknown, sessionId?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sessionId) headers['Cookie'] = cookieHeader(sessionId);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: method, method, params, jsonrpc: '2.0' }),
  });

  if (!res.ok) throw new Error(`Network error: ${res.status}`);

  const json = await res.json();
  if (json.error) {
    const msg: string = json.error.message ?? 'WebUntis error';
    // -8520 = not authenticated / session expired
    throw new Error(msg);
  }
  return json.result as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<UntisSession> {
  const result = await rpc<{
    sessionId: string;
    personType: number;
    personId: number;
    klasseId: number;
  }>('authenticate', { user: username, password, client: CLIENT });

  return {
    sessionId:  result.sessionId,
    personId:   result.personId,
    personType: result.personType,
    klasseId:   result.klasseId,
  };
}

export async function logout(sessionId: string): Promise<void> {
  try {
    await rpc('logout', {}, sessionId);
  } catch {
    // ignore errors on logout
  }
}

// ─── Timetable ────────────────────────────────────────────────────────────────

export function toUntisDate(date: Date): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`, 10);
}

export function fromUntisDate(n: number): Date {
  const s = String(n);
  return new Date(parseInt(s.slice(0, 4)), parseInt(s.slice(4, 6)) - 1, parseInt(s.slice(6, 8)));
}

export function formatUntisTime(t: number): string {
  const h = Math.floor(t / 100);
  const m = t % 100;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function getTimetable(
  session: UntisSession,
  startDate: Date,
  endDate: Date,
): Promise<UntisLesson[]> {
  return rpc<UntisLesson[]>(
    'getTimetable',
    {
      options: {
        element: { id: session.personId, type: session.personType },
        startDate: toUntisDate(startDate),
        endDate:   toUntisDate(endDate),
        showLsText:      1,
        showStudentgroup: 1,
        showLsNumber:    1,
        showSubstText:   1,
        showInfo:        1,
        showBooking:     1,
        klasseFields:   ['id', 'name', 'longname'],
        roomFields:     ['id', 'name', 'longname'],
        subjectFields:  ['id', 'name', 'longname'],
        teacherFields:  ['id', 'name', 'longname'],
      },
    },
    session.sessionId,
  );
}

// ─── Subjects (for colors) ────────────────────────────────────────────────────

export async function getSubjects(sessionId: string): Promise<UntisSubject[]> {
  try {
    return await rpc<UntisSubject[]>('getSubjects', {}, sessionId);
  } catch {
    return [];
  }
}

// ─── Subject color helpers ────────────────────────────────────────────────────

const FALLBACK_COLORS = [
  '#00BFA6', '#7C3AED', '#F59E0B', '#EC4899', '#3B82F6',
  '#10B981', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316',
  '#84CC16', '#A855F7', '#14B8A6', '#F43F5E', '#6366F1',
];

function hashColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return FALLBACK_COLORS[h % FALLBACK_COLORS.length];
}

export function buildSubjectColorMap(subjects: UntisSubject[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const s of subjects) {
    const hex = s.backColor && s.backColor !== 'ffffff' && s.backColor !== 'FFFFFF'
      ? `#${s.backColor}`
      : hashColor(s.name);
    map[s.name] = hex;
  }
  return map;
}

export function getSubjectColor(subjectName: string, colorMap: Record<string, string>): string {
  return colorMap[subjectName] ?? hashColor(subjectName);
}
