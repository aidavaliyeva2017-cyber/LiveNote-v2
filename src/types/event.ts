export type EventCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'social'
  | 'errands'
  | 'hobbies';

export type EventPriority = 'high' | 'medium' | 'low';

export interface EventReminder {
  id: string;
  eventId: string;
  minutesBefore: number;
  reminderTime: Date;
  sent: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  category: EventCategory;
  priority: EventPriority;
  completed?: boolean;
  eventType?: 'event' | 'reminder';
  travelTime?: string;
  repeat?: string;
  repeatEndDate?: Date;
  customRepeatInterval?: string;
  alert?: string;
  url?: string;
}

