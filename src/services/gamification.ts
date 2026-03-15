import { supabase } from '../config/supabase';
import { XP_PER_TASK, XP_PER_HIGH_PRIORITY_TASK, XP_PER_LEVEL } from '../constants/gamification';
import { SUPABASE_TABLES } from '../constants/api';
import { Task } from '../types/task';

export function computeLevel(xpTotal: number): number {
  return Math.floor(xpTotal / XP_PER_LEVEL) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) * XP_PER_LEVEL;
}

export function progressToNextLevel(xpTotal: number): number {
  const level = computeLevel(xpTotal);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  return (xpTotal - currentLevelXP) / (nextLevelXP - currentLevelXP);
}

export async function awardXP(userId: string, task: Task): Promise<{ newXP: number; leveledUp: boolean; newLevel: number }> {
  const xpGain = task.priority === 'high' ? XP_PER_HIGH_PRIORITY_TASK : XP_PER_TASK;

  const { data: profile, error } = await supabase
    .from(SUPABASE_TABLES.USER_PROFILES)
    .select('xp_total, current_level')
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  const oldXP = profile.xp_total;
  const newXP = oldXP + xpGain;
  const oldLevel = computeLevel(oldXP);
  const newLevel = computeLevel(newXP);

  await supabase
    .from(SUPABASE_TABLES.USER_PROFILES)
    .update({ xp_total: newXP, current_level: newLevel })
    .eq('user_id', userId);

  await supabase
    .from(SUPABASE_TABLES.TASKS)
    .update({ xp_awarded: true })
    .eq('id', task.id);

  return { newXP, leveledUp: newLevel > oldLevel, newLevel };
}
