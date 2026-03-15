-- System categories (no user_id — readable by all authenticated users)
insert into public.categories (user_id, name, color_code, emoji, is_custom, is_system) values
  (null, 'Work',     '#2563eb', '💼', false, true),
  (null, 'School',   '#7c3aed', '📚', false, true),
  (null, 'Personal', '#10b981', '🏠', false, true),
  (null, 'Health',   '#ef4444', '❤️',  false, true),
  (null, 'Social',   '#f59e0b', '👥', false, true),
  (null, 'Errands',  '#6b7280', '🛒', false, true),
  (null, 'Hobbies',  '#ec4899', '🎨', false, true);
