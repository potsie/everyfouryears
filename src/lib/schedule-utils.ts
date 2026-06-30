import { isoToDateKey, todayKeyInZone } from '@/lib/dates';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';

const SITE_TZ = 'America/New_York';

export interface ScheduleTeam {
  abbr: string;
  logo: string;
  name: string;
}

export interface SeedTeam {
  tbd: true;
  seed: string;
}

export interface ScheduleMatch {
  id: string;
  groupLetter: string;
  seasonTypeId: number;
  state: 'pre' | 'in' | 'post';
  clock: string;
  isHalftime: boolean;
  // ESPN STATUS_DELAYED — play stopped, clock frozen, state still 'in'.
  isDelayed: boolean;
  // ESPN STATUS_SHOOTOUT — tie being decided on penalties; UI shows "PENALTIES".
  isShootout: boolean;
  stage: string;
  dateISO: string;
  score: [number, number] | null;
  home: ScheduleTeam | SeedTeam;
  away: ScheduleTeam | SeedTeam;
  venue: string;
  city: string;
  broadcaster: string;
  koAbbr?: string;
  // Penalty-shootout score [home, away] when a knockout tie was decided on
  // penalties; null otherwise. The goal score stays level, so this is what
  // determines the winner.
  shootout: [number, number] | null;
}

export interface ScheduleDay {
  key: string;
  dateLabel: string;
  stageLabel: string;
  isToday: boolean;
  matches: ScheduleMatch[];
}

const KO_ABBR: Record<number, string> = {
  2: 'R32', 3: 'R16', 4: 'QF', 5: 'SF', 6: '3rd', 7: 'Final',
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toScheduleTeam(team: { abbr: string; logo: string; name: string }): ScheduleTeam | SeedTeam {
  if (!team.abbr && !team.name) return { tbd: true, seed: '?' };
  return { abbr: team.abbr, logo: team.logo, name: team.name };
}

function toScheduleMatch(m: WorldCupMatchNormalized): ScheduleMatch {
  const isGroup = m.seasonTypeId === 1;
  const homeScore = m.status.state !== 'pre' && m.home.score ? parseInt(m.home.score, 10) : NaN;
  const awayScore = m.status.state !== 'pre' && m.away.score ? parseInt(m.away.score, 10) : NaN;
  const score = !isNaN(homeScore) && !isNaN(awayScore) ? [homeScore, awayScore] as [number, number] : null;
  const shootout = m.home.shootout && m.away.shootout
    ? [m.home.shootout.score, m.away.shootout.score] as [number, number]
    : null;

  return {
    id: m.eventId,
    groupLetter: m.groupLetter,
    seasonTypeId: m.seasonTypeId,
    state: m.status.state,
    clock: m.status.clock,
    isHalftime: m.status.isHalftime,
    isDelayed: m.status.isDelayed,
    isShootout: m.status.isShootout,
    stage: m.stage,
    dateISO: m.date,
    score,
    home: toScheduleTeam(m.home),
    away: toScheduleTeam(m.away),
    venue: m.venue,
    city: m.venueCity,
    broadcaster: m.broadcaster,
    koAbbr: !isGroup ? KO_ABBR[m.seasonTypeId] : undefined,
    shootout,
  };
}

function buildDay(key: string, dayMatches: ScheduleMatch[], todayKey: string): ScheduleDay {
  const [, mo, d] = key.split('-').map(Number);
  const dateObj = new Date(Date.UTC(parseInt(key.slice(0, 4)), mo - 1, d, 12));
  const dateLabel = `${DAYS[dateObj.getUTCDay()]}, ${MONTHS[dateObj.getUTCMonth()]} ${d}`;

  const stages = [...new Set(dayMatches.map(m => m.stage))];
  const isGroup = dayMatches[0].seasonTypeId === 1;
  const stageLabel = stages.length === 1 ? stages[0] : (isGroup ? 'Group Stage' : 'Knockout');

  return { key, dateLabel, stageLabel, isToday: key === todayKey, matches: dayMatches };
}

// Bucket already-mapped ScheduleMatch[] into calendar days in a given timezone.
// Omit `timeZone` to bucket in the runtime's local zone (the viewer's browser
// zone on the client), so day grouping matches the local kickoff times shown.
export function groupScheduleMatches(
  scheduleMatches: ScheduleMatch[],
  timeZone?: string,
): ScheduleDay[] {
  const todayKey = todayKeyInZone(timeZone);

  const byDate = new Map<string, ScheduleMatch[]>();
  for (const m of scheduleMatches) {
    const key = isoToDateKey(m.dateISO, timeZone);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(m);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dayMatches]) => buildDay(key, dayMatches, todayKey));
}

// Server-side grouping (Eastern reference zone). Used at build/request time to
// produce the SSR seed; the client re-buckets into the viewer's zone on mount.
export function groupMatchesByDay(matches: WorldCupMatchNormalized[]): ScheduleDay[] {
  return groupScheduleMatches(matches.map(toScheduleMatch), SITE_TZ);
}

// Client-side: re-bucket a server-grouped ScheduleDay[] into the viewer's local
// zone. Flattens the day buckets back to matches (each carries dateISO) and
// regroups with no fixed timeZone, so a late-Saturday-local match that crossed
// into Sunday Eastern files under Saturday for a Central viewer.
export function regroupDaysLocal(days: ScheduleDay[]): ScheduleDay[] {
  return groupScheduleMatches(days.flatMap(d => d.matches));
}
