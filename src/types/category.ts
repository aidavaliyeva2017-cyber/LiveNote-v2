export interface Category {
  id: string;
  user_id: string;
  name: string;
  color_code: string;
  emoji?: string;
  is_custom: boolean;
  is_system: boolean;
  created_at: string;
}
