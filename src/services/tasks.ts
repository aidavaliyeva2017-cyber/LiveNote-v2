import { supabase } from '../config/supabase';
import { Task } from '../types/task';
import { SUPABASE_TABLES } from '../constants/api';

export async function fetchTasks(userId: string, from?: Date, to?: Date): Promise<Task[]> {
  let query = supabase
    .from(SUPABASE_TABLES.TASKS)
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_time', { ascending: true });

  if (from) query = query.gte('scheduled_time', from.toISOString());
  if (to)   query = query.lte('scheduled_time', to.toISOString());

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.TASKS)
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.TASKS)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from(SUPABASE_TABLES.TASKS)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function toggleComplete(task: Task): Promise<Task> {
  return updateTask(task.id, {
    completion_status: !task.completion_status,
    completed_at: !task.completion_status ? new Date().toISOString() : undefined,
  });
}
