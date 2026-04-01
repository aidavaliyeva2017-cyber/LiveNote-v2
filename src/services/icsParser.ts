export interface ICSEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
  allDay: boolean;
}

/** Unfold RFC 5545 folded lines (CRLF + space/tab = continuation). */
function unfoldLines(raw: string): string[] {
  return raw
    .replace(/\r\n[ \t]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

/** Unescape ICS text values (\\n → newline, \\, → comma, etc.). */
function unescape(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

const UTC_TZIDS = new Set(['utc', 'gmt', 'etc/utc', 'etc/gmt', 'utc+0', 'gmt+0']);

function parseDateTime(value: string, tzid?: string): { date: Date; allDay: boolean } {
  // DATE-only format: YYYYMMDD
  if (!value.includes('T')) {
    const y = parseInt(value.slice(0, 4), 10);
    const m = parseInt(value.slice(4, 6), 10) - 1;
    const d = parseInt(value.slice(6, 8), 10);
    return { date: new Date(y, m, d, 0, 0, 0), allDay: true };
  }

  // DATETIME format: YYYYMMDDTHHmmss[Z]
  const y   = parseInt(value.slice(0, 4), 10);
  const mo  = parseInt(value.slice(4, 6), 10) - 1;
  const d   = parseInt(value.slice(6, 8), 10);
  const h   = parseInt(value.slice(9, 11), 10);
  const min = parseInt(value.slice(11, 13), 10);
  const s   = parseInt(value.slice(13, 15), 10);

  // Treat as UTC if: Z suffix, or TZID is a known UTC alias
  const isUTC = value.endsWith('Z') || (tzid ? UTC_TZIDS.has(tzid.toLowerCase()) : false);

  const date = isUTC
    ? new Date(Date.UTC(y, mo, d, h, min, s))
    : new Date(y, mo, d, h, min, s);
  return { date, allDay: false };
}

/** Parse an ICS duration string (e.g. PT1H30M, P1D) into milliseconds. */
function parseDuration(duration: string): number {
  let ms = 0;
  const match = duration.match(/P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/);
  if (!match) return 0;
  const [, weeks, days, hours, minutes, seconds] = match;
  if (weeks)   ms += parseInt(weeks, 10)   * 7 * 24 * 3600 * 1000;
  if (days)    ms += parseInt(days, 10)    * 24 * 3600 * 1000;
  if (hours)   ms += parseInt(hours, 10)   * 3600 * 1000;
  if (minutes) ms += parseInt(minutes, 10) * 60 * 1000;
  if (seconds) ms += parseInt(seconds, 10) * 1000;
  return ms;
}

export function parseICS(content: string): ICSEvent[] {
  const lines = unfoldLines(content);
  const events: ICSEvent[] = [];

  let inEvent = false;
  let uid         = '';
  let title       = '';
  let description = '';
  let location    = '';
  let startDate: Date | null = null;
  let endDate:   Date | null = null;
  let duration:  number | null = null;
  let allDay      = false;

  const resetCurrent = () => {
    uid = title = description = location = '';
    startDate = endDate = null;
    duration = null;
    allDay = false;
  };

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; resetCurrent(); continue; }
    if (line === 'END:VEVENT') {
      if (title && startDate) {
        // If no DTEND, derive from DURATION or default to 1 hour / 1 day
        if (!endDate) {
          if (duration !== null) {
            endDate = new Date(startDate.getTime() + duration);
          } else {
            endDate = allDay
              ? new Date(startDate.getTime() + 86400000)
              : new Date(startDate.getTime() + 3600000);
          }
        }
        events.push({
          id: uid || Math.random().toString(36).slice(2),
          title,
          startDate,
          endDate,
          description: description || undefined,
          location: location || undefined,
          allDay,
        });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    // Split property name (+ optional params) from value at first unescaped colon
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propFull = line.slice(0, colonIdx);
    const rawValue = line.slice(colonIdx + 1);

    // Extract property name (before first semicolon) and parse params
    const semiIdx  = propFull.indexOf(';');
    const propName = semiIdx === -1 ? propFull : propFull.slice(0, semiIdx);
    const paramStr = semiIdx === -1 ? '' : propFull.slice(semiIdx + 1);

    // Extract TZID from params (e.g. "TZID=Europe/Berlin")
    const tzidMatch = paramStr.match(/(?:^|;)TZID=([^;]+)/i);
    const tzid      = tzidMatch ? tzidMatch[1] : undefined;

    switch (propName.toUpperCase()) {
      case 'UID':
        uid = rawValue;
        break;
      case 'SUMMARY':
        title = unescape(rawValue);
        break;
      case 'DESCRIPTION':
        description = unescape(rawValue);
        break;
      case 'LOCATION':
        location = unescape(rawValue);
        break;
      case 'DTSTART': {
        const parsed = parseDateTime(rawValue, tzid);
        startDate = parsed.date;
        allDay    = parsed.allDay;
        break;
      }
      case 'DTEND': {
        const parsed = parseDateTime(rawValue, tzid);
        endDate = parsed.date;
        break;
      }
      case 'DURATION':
        duration = parseDuration(rawValue);
        break;
    }
  }

  return events;
}
