create table public.routines (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.user_profiles(user_id) on delete cascade,
  name                     text not null,
  time_pattern             jsonb not null,
  default_duration_minutes integer not null default 30,
  category_id              uuid references public.categories(id) on delete set null,
  is_active                boolean not null default true,
  created_at               timestamptz not null default now()
);

alter table public.routines enable row level security;

create policy "Users can manage own routines"
  on public.routines for all using (auth.uid() = user_id);

alter table public.tasks
  add constraint tasks_routine_id_fk
  foreign key (routine_id) references public.routines(id) on delete set null;
