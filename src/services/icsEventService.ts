import { supabase } from '../config/supabase';
import { ENV } from '../config/env';
import { ICSEvent } from './icsParser';

export interface ImportResult {
  imported: number;
  failed: number;
}

export async function importICSEventsToSupabase(
  events: ICSEvent[],
  userId: string,
): Promise<ImportResult> {
  if (events.length === 0) return { imported: 0, failed: 0 };

  // Diagnostics — visible in Metro console
  console.log('[ICSEventService] Supabase URL:', ENV.SUPABASE_URL);
  console.log('[ICSEventService] Anon key prefix:', ENV.SUPABASE_ANON_KEY.slice(0, 20) + '...');
  console.log('[ICSEventService] userId:', userId);
  console.log('[ICSEventService] events to import:', events.length);

  const rows = events.map(event => {
    const descParts: string[] = [];
    if (event.description) descParts.push(event.description);
    if (event.location)    descParts.push(`📍 ${event.location}`);

    return {
      user_id:     userId,
      title:       event.title,
      description: descParts.join('\n') || undefined,
      start_date:  event.startDate.toISOString(),
      end_date:    event.endDate.toISOString(),
    };
  });

  console.log('[ICSEventService] First row:', JSON.stringify(rows[0], null, 2));

  const { data, error } = await supabase.from('events').insert(rows).select();

  if (error) {
    console.error('[ICSEventService] ── INSERT ERROR ──────────────────────');
    console.error('  code:    ', error.code);
    console.error('  message: ', error.message);
    console.error('  details: ', error.details);
    console.error('  hint:    ', error.hint);
    console.error('─────────────────────────────────────────────────────────');
    return { imported: 0, failed: events.length };
  }

  console.log('[ICSEventService] Inserted rows:', data?.length);
  return { imported: events.length, failed: 0 };
}
