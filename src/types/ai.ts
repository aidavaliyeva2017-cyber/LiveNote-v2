import { Priority } from './task';
import { RecurrenceRule } from './task';

export type AIRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: AIRole;
  content: string;
  timestamp: string;
}

export interface ParsedEventDraft {
  title: string;
  scheduled_time?: string;
  duration_minutes?: number;
  priority?: Priority;
  category_name?: string;
  recurrence_rule?: RecurrenceRule;
  confidence: number; // 0–1
}

export interface StudySession {
  title: string;
  scheduled_time: string;
  duration_minutes: number;
  description?: string;
}

export interface StudyPlan {
  goal: string;
  deadline: string;
  sessions: StudySession[];
}
