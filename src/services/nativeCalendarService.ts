import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { NativeCalendarEvent } from '../types/nativeCalendar';

// ─── Permission ───────────────────────────────────────────────────────────────

export async function getCalendarPermissionStatus(): Promise<Calendar.PermissionStatus> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status;
}

export async function requestCalendarPermission(): Promise<Calendar.PermissionStatus> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status;
}

// ─── Fetch events ─────────────────────────────────────────────────────────────

/**
 * Reads all events from all native calendars for the given date range.
 * Returns an empty array if permission is not granted or on error.
 */
export async function fetchNativeEvents(
  startDate: Date,
  endDate: Date,
): Promise<NativeCalendarEvent[]> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    if (status !== 'granted') return [];

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    const results: NativeCalendarEvent[] = [];

    for (const cal of calendars) {
      // Skip "Birthdays" calendar — it adds noise and can't be interacted with
      if (cal.title === 'Birthdays' || cal.title === 'Geburtstage') continue;

      let events: Calendar.Event[] = [];
      try {
        events = await Calendar.getEventsAsync([cal.id], startDate, endDate);
      } catch {
        continue;
      }

      for (const evt of events) {
        if (!evt.title || !evt.startDate || !evt.endDate) continue;
        results.push({
          id: `native-${evt.id}`,
          nativeId: evt.id,
          title: evt.title,
          notes: evt.notes ?? undefined,
          start: new Date(evt.startDate),
          end: new Date(evt.endDate),
          allDay: evt.allDay ?? false,
          calendarId: cal.id,
          calendarName: cal.title,
          calendarColor: cal.color ?? '#3B82F6',
        });
      }
    }

    // Sort by start time
    results.sort((a, b) => a.start.getTime() - b.start.getTime());
    return results;
  } catch {
    return [];
  }
}
