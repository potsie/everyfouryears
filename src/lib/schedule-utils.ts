import { nowET, toISODate, isoToETDate } from '@/lib/dates';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';

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
  dateISO: string;
  score: [number, number] | null;
  home: ScheduleTeam | SeedTeam;
  away: ScheduleTeam | SeedTeam;
  venue: string;
  city: string;
  broadcaster: string;
  koAbbr?: string;
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

  return {
    id: m.eventId,
    groupLetter: m.groupLetter,
    seasonTypeId: m.seasonTypeId,
    state: m.status.state,
    clock: m.status.clock,
    isHalftime: m.status.isHalftime,
    dateISO: m.date,
    score,
    home: toScheduleTeam(m.home),
    away: toScheduleTeam(m.away),
    venue: m.venue,
    city: m.venueCity,
    broadcaster: m.broadcaster,
    koAbbr: !isGroup ? KO_ABBR[m.seasonTypeId] : undefined,
  };
}

export function groupMatchesByDay(matches: WorldCupMatchNormalized[]): ScheduleDay[] {
  const todayKey = toISODate(nowET());

  const byDate = new Map<string, WorldCupMatchNormalized[]>();
  for (const m of matches) {
    const key = isoToETDate(m.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(m);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dayMatches]) => {
      const [y, mo, d] = key.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, mo - 1, d, 12));
      const dateLabel = `${DAYS[dateObj.getUTCDay()]}, ${MONTHS[dateObj.getUTCMonth()]} ${d}`;

      const stages = [...new Set(dayMatches.map(m => m.stage))];
      const isGroup = dayMatches[0].seasonTypeId === 1;
      const stageLabel = stages.length === 1 ? stages[0] : (isGroup ? 'Group Stage' : 'Knockout');

      return {
        key,
        dateLabel,
        stageLabel,
        isToday: key === todayKey,
        matches: dayMatches.map(toScheduleMatch),
      };
    });
}
