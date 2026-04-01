import { supabase } from '../config/supabase';
import { ICSEvent } from './icsParser';

export interface ImportResult {
  imported: number;
  failed: number;
}

const CHUNK_SIZE = 100; // Supabase handles ~100 rows per insert comfortably

function icsEventToRow(event: ICSEvent, userId: string) {
  return {
    user_id:                userId,
    title:                  event.title,
    description:            event.description || null,
    location:               event.location    || null,
    start_date:             event.startDate.toISOString(),
    end_date:               event.endDate.toISOString(),
    all_day:                event.allDay,
    category:               'personal' as const,
    priority:               'medium'   as const,
    completed:              false,
    event_type:             'event'    as const,
    travel_time:            null,
    repeat_:                null,
    repeat_end_date:        null,
    custom_repeat_interval: null,
    alert:                  null,
    url:                    null,
  };
}

async function countEventsInDB(userId: string, label: string) {
  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    console.error(`[ICSEventService] count(${label}) error:`, error.message);
  } else {
    console.log(`[ICSEventService] count(${label}) for user_id="${userId}":`, count);
  }
}

export async function importICSEventsToSupabase(
  events: ICSEvent[],
  userId: string,
): Promise<ImportResult> {
  if (events.length === 0) return { imported: 0, failed: 0 };

  console.log('[ICSEventService] ══ START IMPORT ══════════════════════════════');
  console.log('[ICSEventService] user_id:', userId);
  console.log('[ICSEventService] events to import:', events.length);
  console.log('[ICSEventService] first event:', JSON.stringify({
    title:     events[0].title,
    startDate: events[0].startDate.toISOString(),
    endDate:   events[0].endDate.toISOString(),
    allDay:    events[0].allDay,
    location:  events[0].location,
  }));

  // Verify DB connection + show row count before insert
  await countEventsInDB(userId, 'BEFORE');

  // Test single insert first to catch column/constraint errors early
  const testRow = icsEventToRow(events[0], userId);
  console.log('[ICSEventService] test row columns:', Object.keys(testRow).join(', '));
  const { data: testData, error: testError } = await supabase
    .from('events')
    .insert(testRow)
    .select('id')
    .single();

  if (testError) {
    console.error('[ICSEventService] ── TEST INSERT FAILED ──────────────────');
    console.error('  code:   ', testError.code);
    console.error('  message:', testError.message);
    console.error('  details:', testError.details);
    console.error('  hint:   ', testError.hint);
    console.error('  row sent:', JSON.stringify(testRow, null, 2));
    console.error('────────────────────────────────────────────────────────────');
    return { imported: 0, failed: events.length };
  }
  console.log('[ICSEventService] test insert OK, id:', testData?.id);

  // Insert remaining events in chunks
  const remaining = events.slice(1);
  const rows = remaining.map(e => icsEventToRow(e, userId));
  const chunks: typeof rows[] = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + CHUNK_SIZE));
  }

  console.log('[ICSEventService] Inserting', chunks.length, 'chunks for remaining', remaining.length, 'events');

  let totalImported = 1; // count the test insert
  let totalFailed   = 0;

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const { data, error } = await supabase.from('events').insert(chunk).select('id');

    if (error) {
      console.error(`[ICSEventService] Chunk ${ci + 1}/${chunks.length} FAILED:`);
      console.error('  code:   ', error.code);
      console.error('  message:', error.message);
      console.error('  details:', error.details);
      console.error('  hint:   ', error.hint);
      totalFailed += chunk.length;
    } else {
      console.log(`[ICSEventService] Chunk ${ci + 1}/${chunks.length} OK — ${data?.length ?? 0} rows`);
      totalImported += data?.length ?? chunk.length;
    }
  }

  // Verify final count
  await countEventsInDB(userId, 'AFTER');

  console.log('[ICSEventService] ══ DONE ══ imported:', totalImported, '| failed:', totalFailed);
  return { imported: totalImported, failed: totalFailed };
}
