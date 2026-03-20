/**
 * Family Calendar — Supabase service
 *
 * Required SQL (run once in Supabase SQL editor):
 * ─────────────────────────────────────────────────────────────────────────────
 * create table families (
 *   id          uuid primary key default gen_random_uuid(),
 *   name        text not null,
 *   invite_code char(6) not null unique,
 *   created_by  text not null,
 *   created_at  timestamptz default now()
 * );
 *
 * create table family_members (
 *   id           uuid primary key default gen_random_uuid(),
 *   family_id    uuid references families(id) on delete cascade not null,
 *   member_email text not null,
 *   role         text not null default 'member',
 *   joined_at    timestamptz default now(),
 *   unique(family_id, member_email)
 * );
 *
 * create table shared_events (
 *   id          uuid primary key default gen_random_uuid(),
 *   family_id   uuid references families(id) on delete cascade not null,
 *   title       text not null,
 *   description text,
 *   start_time  timestamptz not null,
 *   end_time    timestamptz not null,
 *   all_day     boolean default false,
 *   category    text not null default 'personal',
 *   priority    text not null default 'medium',
 *   completed   boolean default false,
 *   created_by  text not null,
 *   created_at  timestamptz default now()
 * );
 *
 * -- Enable RLS (open read/write for now; tighten later)
 * alter table families       enable row level security;
 * alter table family_members enable row level security;
 * alter table shared_events  enable row level security;
 * create policy "open" on families       for all using (true) with check (true);
 * create policy "open" on family_members for all using (true) with check (true);
 * create policy "open" on shared_events  for all using (true) with check (true);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../config/supabase';
import { Family, FamilyMember, SharedEvent, MEMBER_COLORS } from '../types/family';
import { EventCategory, EventPriority } from '../types/event';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function memberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

function rowToFamily(row: any): Family {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function rowToMember(row: any, index: number): FamilyMember {
  return {
    id: row.id,
    familyId: row.family_id,
    memberEmail: row.member_email,
    displayName: row.member_email.split('@')[0],
    role: row.role as 'owner' | 'member',
    color: memberColor(index),
    joinedAt: row.joined_at,
  };
}

function rowToSharedEvent(row: any): SharedEvent {
  return {
    id: row.id,
    familyId: row.family_id,
    title: row.title,
    description: row.description ?? undefined,
    start: row.start_time,
    end: row.end_time,
    allDay: row.all_day ?? false,
    category: row.category as EventCategory,
    priority: row.priority as EventPriority,
    completed: row.completed ?? false,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createFamily(name: string, createdBy: string): Promise<Family> {
  const invite_code = generateCode();
  const { data, error } = await supabase
    .from('families')
    .insert({ name, invite_code, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('family_members').insert({
    family_id: data.id,
    member_email: createdBy,
    role: 'owner',
  });

  return rowToFamily(data);
}

export async function joinFamilyByCode(code: string, memberEmail: string): Promise<Family> {
  const { data: family, error } = await supabase
    .from('families')
    .select()
    .eq('invite_code', code.toUpperCase())
    .single();
  if (error) throw new Error('Family not found. Check the code and try again.');

  const { error: memberError } = await supabase.from('family_members').insert({
    family_id: family.id,
    member_email: memberEmail,
    role: 'member',
  });
  if (memberError && !memberError.message.includes('duplicate')) throw memberError;

  return rowToFamily(family);
}

export async function getFamilyById(id: string): Promise<Family | null> {
  const { data, error } = await supabase.from('families').select().eq('id', id).single();
  if (error) return null;
  return rowToFamily(data);
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select()
    .eq('family_id', familyId)
    .order('joined_at', { ascending: true });
  if (error) return [];
  return (data ?? []).map((row, i) => rowToMember(row, i));
}

export async function getSharedEvents(familyId: string): Promise<SharedEvent[]> {
  const { data, error } = await supabase
    .from('shared_events')
    .select()
    .eq('family_id', familyId)
    .order('start_time', { ascending: true });
  if (error) return [];
  return (data ?? []).map(rowToSharedEvent);
}

export async function addSharedEvent(
  familyId: string,
  event: Omit<SharedEvent, 'id' | 'familyId' | 'createdAt'>,
): Promise<SharedEvent> {
  const { data, error } = await supabase
    .from('shared_events')
    .insert({
      family_id: familyId,
      title: event.title,
      description: event.description,
      start_time: event.start,
      end_time: event.end,
      all_day: event.allDay ?? false,
      category: event.category,
      priority: event.priority,
      completed: event.completed ?? false,
      created_by: event.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToSharedEvent(data);
}

export async function updateSharedEvent(id: string, patch: Partial<SharedEvent>): Promise<void> {
  const dbPatch: any = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.start !== undefined) dbPatch.start_time = patch.start;
  if (patch.end !== undefined) dbPatch.end_time = patch.end;
  if (patch.allDay !== undefined) dbPatch.all_day = patch.allDay;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.priority !== undefined) dbPatch.priority = patch.priority;
  if (patch.completed !== undefined) dbPatch.completed = patch.completed;

  const { error } = await supabase.from('shared_events').update(dbPatch).eq('id', id);
  if (error) throw error;
}

export async function deleteSharedEvent(id: string): Promise<void> {
  const { error } = await supabase.from('shared_events').delete().eq('id', id);
  if (error) throw error;
}

export async function removeMember(familyId: string, memberEmail: string): Promise<void> {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('family_id', familyId)
    .eq('member_email', memberEmail);
  if (error) throw error;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToFamily(
  familyId: string,
  onEventsChange: (events: SharedEvent[]) => void,
  onMembersChange: (members: FamilyMember[]) => void,
) {
  const channel = supabase
    .channel(`family-${familyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shared_events', filter: `family_id=eq.${familyId}` },
      async () => {
        const events = await getSharedEvents(familyId);
        onEventsChange(events);
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'family_members', filter: `family_id=eq.${familyId}` },
      async () => {
        const members = await getFamilyMembers(familyId);
        onMembersChange(members);
      },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
