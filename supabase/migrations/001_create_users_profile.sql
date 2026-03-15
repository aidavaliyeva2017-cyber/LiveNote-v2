create table public.user_profiles (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  name              text,
  timezone          text not null default 'UTC',
  xp_total          integer not null default 0,
  current_level     integer not null default 1,
  baseline_schedule jsonb,
  onboarding_completed boolean not null default false,
  created_at        timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);
