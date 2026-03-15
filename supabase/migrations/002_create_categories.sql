create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.user_profiles(user_id) on delete cascade,
  name       text not null,
  color_code text not null,
  emoji      text,
  is_custom  boolean not null default true,
  is_system  boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users can read own and system categories"
  on public.categories for select
  using (auth.uid() = user_id or is_system = true);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id and is_system = false);

create policy "Users can update own custom categories"
  on public.categories for update
  using (auth.uid() = user_id and is_system = false);

create policy "Users can delete own custom categories"
  on public.categories for delete
  using (auth.uid() = user_id and is_system = false);
