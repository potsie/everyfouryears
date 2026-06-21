const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const SITE_TZ = 'America/New_York';

export function nowET(): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SITE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);

  return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
}

export function todayESPN(): string {
  return toESPNDate(nowET());
}

export function parseRouteDate(slug: string): Date | null {
  const match = slug.match(/^([a-z]+)-(\d{1,2})-(\d{4})$/);
  if (!match) return null;
  const [, monthName, dayStr, yearStr] = match;
  const monthIdx = MONTHS.indexOf(monthName);
  if (monthIdx === -1) return null;
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  const d = new Date(year, monthIdx, day);
  if (d.getMonth() !== monthIdx) return null;
  return d;
}

export function toRouteDate(date: Date): string {
  return `${MONTHS[date.getMonth()]}-${date.getDate()}-${date.getFullYear()}`;
}

export function toESPNDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Convert a UTC ISO string to a YYYY-MM-DD date key in a given IANA timezone.
// Omit `timeZone` to use the runtime's local zone — on the client that's the
// viewer's browser zone, so day-bucketing matches the local kickoff times we
// render. Pass a zone (e.g. America/New_York) for a fixed reference.
export function isoToDateKey(isoString: string, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    ...(timeZone ? { timeZone } : {}),
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(isoString));
  const y = parts.find(p => p.type === 'year')!.value;
  const mo = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  return `${y}-${mo}-${d}`;
}

// Today's YYYY-MM-DD key in a given IANA timezone (omit for local/browser zone).
export function todayKeyInZone(timeZone?: string): string {
  return isoToDateKey(new Date().toISOString(), timeZone);
}

// Convert a UTC ISO string to a YYYY-MM-DD date key in Eastern Time.
// Use this everywhere matches are bucketed by day so grouping and "today"
// detection stay in sync (both use America/New_York as the reference timezone).
export function isoToETDate(isoString: string): string {
  return isoToDateKey(isoString, SITE_TZ);
}
