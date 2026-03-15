export interface TimePattern {
  hour: number;
  minute: number;
  weekdays: number[]; // 0=Mon, 6=Sun; empty = every day
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  time_pattern: TimePattern;
  default_duration_minutes: number;
  category_id?: string;
  is_active: boolean;
  created_at: string;
}
