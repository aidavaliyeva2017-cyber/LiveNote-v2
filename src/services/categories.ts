import { supabase } from '../config/supabase';
import { Category } from '../types/category';
import { SUPABASE_TABLES } from '../constants/api';

export async function fetchCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.CATEGORIES)
    .select('*')
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.CATEGORIES)
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from(SUPABASE_TABLES.CATEGORIES)
    .delete()
    .eq('id', id)
    .eq('is_system', false); // prevent deleting system categories
  if (error) throw error;
}
