import { RecurrenceFrequency } from '../constants/recurrence';

export type Priority = 'high' | 'medium' | 'low';
export type CompletionStatus = 'pending' | 'completed' | 'overdue';

export interface RecurrenceRule {
  freq: RecurrenceFrequency;
  interval?: number;
  byweekday?: number[]; // 0=Mon, 6=Sun
  until?: string;       // ISO date string
  count?: number;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority: Priority;
  scheduled_time?: string;    // ISO datetime
  end_time?: string;
  duration_minutes?: number;
  recurrence_rule?: RecurrenceRule;
  completion_status: boolean;
  completed_at?: string;
  xp_awarded: boolean;
  routine_id?: string;
  created_at: string;
}
