import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';

export const STAGE_ORDER: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
};

export const STAGE_LABELS: Record<number, string> = {
  1: 'Group Stage',
  2: 'Round of 32',
  3: 'Round of 16',
  4: 'Quarterfinals',
  5: 'Semifinals',
  6: 'Third Place',
  7: 'Final',
};

export const STAGE_SUBLABELS: Record<number, string> = {
  1: '12 groups · 72 matches',
  2: '16 matches',
  3: '8 matches',
  4: '4 matches',
  5: '2 matches',
  6: '1 match',
  7: '1 match',
};

// Returns true for ESPN placeholder abbreviations like "2A", "1C", "W73", "L88", "3rd"
export function isSeedPlaceholder(abbr: string): boolean {
  return /^\d[A-L]$/.test(abbr) || /^[WL]\d+$/.test(abbr) || abbr === '3rd' || abbr === 'TBD';
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function fmtDayOfWeek(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' });
}

export function fmtDayNum(iso: string): number {
  return new Date(iso).getDate();
}

export function fmtMonthShort(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short' });
}

// Group matches by local calendar date key "YYYY-MM-DD"
export function groupByLocalDate(
  matches: WorldCupMatchNormalized[]
): Map<string, WorldCupMatchNormalized[]> {
  const map = new Map<string, WorldCupMatchNormalized[]>();
  for (const m of matches) {
    const key = new Date(m.date).toLocaleDateString('en-CA');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.date.localeCompare(b.date));
  return map;
}

// Group matches by seasonTypeId, preserving STAGE_ORDER
export function groupByStage(
  matches: WorldCupMatchNormalized[]
): Map<number, WorldCupMatchNormalized[]> {
  const map = new Map<number, WorldCupMatchNormalized[]>();
  for (const m of matches) {
    const id = m.seasonTypeId;
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(m);
  }
  return new Map([...map.entries()].sort((a, b) => STAGE_ORDER[a[0]] - STAGE_ORDER[b[0]]));
}

// Score display for completed matches: "2–1"
export function fmtScore(m: WorldCupMatchNormalized): string | null {
  if (m.status.state !== 'post') return null;
  return `${m.home.score}–${m.away.score}`;
}
