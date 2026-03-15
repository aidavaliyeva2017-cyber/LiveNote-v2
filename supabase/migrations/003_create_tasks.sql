create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.user_profiles(user_id) on delete cascade,
  title             text not null,
  description       text,
  category_id       uuid references public.categories(id) on delete set null,
  priority          text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  scheduled_time    timestamptz,
  end_time          timestamptz,
  duration_minutes  integer,
  recurrence_rule   jsonb,
  completion_status boolean not null default false,
  completed_at      timestamptz,
  xp_awarded        boolean not null default false,
  routine_id        uuid,
  created_at        timestamptz not null default now()
);

create index tasks_user_id_scheduled_time on public.tasks (user_id, scheduled_time);

alter table public.tasks enable row level security;

create policy "Users can read own tasks"
  on public.tasks for select using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete using (auth.uid() = user_id);
