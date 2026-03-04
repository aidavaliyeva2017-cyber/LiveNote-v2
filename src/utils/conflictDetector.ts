import { CalendarEvent } from '../types/event';

export interface Conflict {
  eventId: string;
  conflictingWithId: string;
}

export const findConflicts = (events: CalendarEvent[]): Conflict[] => {
  const conflicts: Conflict[] = [];
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (a.end <= b.start) break;
      if (a.start < b.end && b.start < a.end) {
        conflicts.push({ eventId: a.id, conflictingWithId: b.id });
      }
    }
  }

  return conflicts;
};

