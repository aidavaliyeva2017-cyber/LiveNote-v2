export interface NativeCalendarEvent {
  id: string;          // 'native-{nativeId}' — unique within LiveNote
  nativeId: string;    // original expo-calendar event id
  title: string;
  notes?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  calendarId: string;
  calendarName: string;
  calendarColor: string; // hex from the iOS calendar
}
