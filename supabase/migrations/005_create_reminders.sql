create table public.reminders (
  id                  uuid primary key default gen_random_uuid(),
  task_id             uuid not null references public.tasks(id) on delete cascade,
  reminder_time       timestamptz not null,
  notification_id     text,
  notification_sent   boolean not null default false,
  user_acknowledged   boolean not null default false,
  created_at          timestamptz not null default now()
);

alter table public.reminders enable row level security;

create policy "Users can manage reminders for own tasks"
  on public.reminders for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = reminders.task_id
        and tasks.user_id = auth.uid()
    )
  );
