export interface XPEvent {
  task_id: string;
  xp_gained: number;
  timestamp: string;
}

export interface LevelUpEvent {
  new_level: number;
  total_xp: number;
}

export interface GamificationState {
  xp_total: number;
  current_level: number;
  level_progress: number; // 0–1 float
  xp_to_next_level: number;
}
