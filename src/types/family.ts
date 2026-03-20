import { EventCategory, EventPriority, CalendarEvent } from './event';

export const MEMBER_COLORS = [
  '#00BFA6', // teal (primary)
  '#7C3AED', // purple
  '#F59E0B', // amber
  '#EC4899', // pink
  '#3B82F6', // blue
  '#10B981', // green
  '#EF4444', // red
  '#8B5CF6', // violet
] as const;

export interface FamilyMember {
  id: string;
  familyId: string;
  memberEmail: string;
  displayName: string;
  role: 'owner' | 'member';
  color: string;
  joinedAt: string;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

export interface SharedEvent {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  allDay?: boolean;
  category: EventCategory;
  priority: EventPriority;
  completed?: boolean;
  createdBy: string; // email
  createdAt: string;
}

// CalendarEvent extended with source info for display
export interface DisplayEvent extends CalendarEvent {
  source: 'personal' | 'family' | 'native';
  // family fields
  creatorEmail?: string;
  memberColor?: string;
  sharedEventId?: string;
  // native calendar fields
  calendarName?: string;
  calendarColor?: string;
  nativeId?: string;
}
