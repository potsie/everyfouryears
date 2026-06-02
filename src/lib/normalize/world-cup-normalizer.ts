import type {
  ESPNWorldCupSummaryResponse,
  ESPNSoccerTeamStat,
  ESPNKeyEvent,
  ESPNWorldCupRosterTeam,
  ESPNMatchDetail,
} from '@/types/world-cup-types';

export interface WorldCupGoal {
  minute: string;
  scorer: string;
  assist?: string;
}

export interface WorldCupCard {
  minute: string;
  player: string;
  type: 'yellow' | 'red';
}

export interface WorldCupPlayer {
  id: string;
  name: string;
  jersey: string;
  isStarter: boolean;
  position: string;
}

export interface WorldCupTeamBoxScore {
  id: string;
  name: string;
  abbr: string;
  logo: string;
  score: string;
  stats: Record<string, string>;
  goals: WorldCupGoal[];
  cards: WorldCupCard[];
  roster: WorldCupPlayer[];
}

export interface WorldCupMatchNormalized {
  eventId: string;
  date: string;
  stage: string;
  groupLetter: string;
  seasonTypeId: number;
  status: {
    state: 'pre' | 'in' | 'post';
    clock: string;
  };
  venue: string;
  venueCity: string;
  broadcaster: string;
  home: WorldCupTeamBoxScore;
  away: WorldCupTeamBoxScore;
}

const STAGE_NAMES: Record<number, string> = {
  1: 'Group Stage',
  2: 'Round of 32',
  3: 'Round of 16',
  4: 'Quarterfinals',
  5: 'Semifinals',
  6: 'Third Place',
  7: 'Final',
};

// --- Scoreboard event normalizer (for homepage, bracket, API route) ---
export function normalizeScoreboardEvent(event: any): WorldCupMatchNormalized {
  const comp = event.competitions?.[0] ?? {};
  const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home') ?? {};
  const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away') ?? {};

  const seasonTypeId = Number(comp.season?.type?.id ?? 1);
  const rawGroupName: string = comp.groups?.shortName ?? comp.group?.shortName ?? '';
  const groupLetter = rawGroupName.replace(/^Group\s+/i, '').trim();

  const details: ESPNMatchDetail[] = comp.details ?? [];

  function goalsFromDetails(teamId: string): WorldCupGoal[] {
    return details
      .filter(d => {
        const isGoal = d.type?.text === 'Goal' || d.type?.id === '20';
        const notShootout = !d.shootout;
        const scoringPlay = d.scoringPlay !== false;
        const teamMatch =
          d.team?.id === teamId ||
          d.athletesInvolved?.[0]?.team?.id === teamId;
        return isGoal && notShootout && scoringPlay && teamMatch;
      })
      .map(d => ({
        minute: d.clock?.displayValue ?? '',
        scorer: d.athletesInvolved?.[0]?.displayName ?? '',
        assist: d.athletesInvolved?.[1]?.displayName,
      }));
  }

  function buildTeam(competitor: any): WorldCupTeamBoxScore {
    const teamId: string = competitor?.team?.id ?? '';
    return {
      id: teamId,
      name: competitor?.team?.displayName ?? '',
      abbr: competitor?.team?.abbreviation ?? '',
      logo: competitor?.team?.logo ?? '',
      score: competitor?.score ?? '',
      stats: {},
      goals: goalsFromDetails(teamId),
      cards: [],
      roster: [],
    };
  }

  const stage =
    seasonTypeId === 1 && groupLetter
      ? `Group ${groupLetter}`
      : (STAGE_NAMES[seasonTypeId] ?? 'Match');

  return {
    eventId: event.id,
    date: comp.date ?? event.date ?? '',
    stage,
    groupLetter,
    seasonTypeId,
    status: {
      state: comp.status?.type?.state ?? 'pre',
      clock: comp.status?.displayClock ?? '',
    },
    venue: comp.venue?.fullName ?? '',
    venueCity: comp.venue?.address?.city ?? '',
    broadcaster: comp.geoBroadcasts?.[0]?.media?.shortName ?? '',
    home: buildTeam(homeComp),
    away: buildTeam(awayComp),
  };
}

// --- Summary response normalizer (for match detail pages) ---

function teamStat(stats: ESPNSoccerTeamStat[], name: string): string {
  return stats.find(s => s.name === name)?.displayValue ?? '0';
}

function extractGoalsFromEvents(events: ESPNKeyEvent[], teamId: string): WorldCupGoal[] {
  return events
    .filter(e => e.type.text.startsWith('Goal') && e.team?.id === teamId && !e.shootout)
    .map(e => {
      const participants = e.participants ?? [];
      return {
        minute: e.clock?.displayValue ?? '',
        scorer: participants[0]?.athlete.displayName ?? 'Unknown',
        assist: participants.length > 1 ? participants[1]?.athlete.displayName : undefined,
      };
    });
}

function extractCards(events: ESPNKeyEvent[], teamId: string): WorldCupCard[] {
  return events
    .filter(e => (e.type.text === 'Yellow Card' || e.type.text === 'Red Card') && e.team?.id === teamId)
    .map(e => ({
      minute: e.clock?.displayValue ?? '',
      player: e.participants?.[0]?.athlete.displayName ?? '',
      type: e.type.text === 'Red Card' ? ('red' as const) : ('yellow' as const),
    }));
}

function extractRoster(rosters: ESPNWorldCupRosterTeam[] | undefined, teamId: string): WorldCupPlayer[] {
  if (!rosters) return [];
  const teamRoster = rosters.find(r => r.team.id === teamId);
  if (!teamRoster) return [];
  return teamRoster.roster.map(player => ({
    id: player.athlete.id,
    name: player.athlete.shortName || player.athlete.displayName,
    jersey: player.jersey,
    isStarter: player.starter,
    position: player.position?.abbreviation ?? 'SUB',
  }));
}

export function normalizeWorldCupGame(
  eventId: string,
  data: ESPNWorldCupSummaryResponse,
): WorldCupMatchNormalized {
  const comp = data.header.competitions[0];
  const keyEvents = data.keyEvents ?? [];
  const rosters = data.rosters;

  const broadcaster = comp.geoBroadcasts?.[0]?.media?.shortName ?? '';
  const venue = data.gameInfo.venue?.fullName ?? '';
  const venueCity = data.gameInfo.venue?.address?.city ?? '';
  const seasonTypeId = Number(data.header.season?.type?.id ?? 1);

  const stage = STAGE_NAMES[seasonTypeId] ?? 'Match';

  function buildTeam(homeAway: 'home' | 'away'): WorldCupTeamBoxScore {
    const competitor = comp.competitors.find(c => c.homeAway === homeAway);
    if (!competitor) throw new Error(`No ${homeAway} competitor found for event ${eventId}`);
    const teamEntry = data.boxscore.teams.find(t => t.homeAway === homeAway);
    const teamStats = teamEntry?.statistics ?? [];
    const teamId = competitor.team.id;

    return {
      id: teamId,
      name: competitor.team.displayName,
      abbr: competitor.team.abbreviation,
      logo: competitor.team.logo ?? '',
      score: competitor.score,
      stats: {
        possession: teamStat(teamStats, 'possessionPct'),
        shots: teamStat(teamStats, 'totalShots'),
        shotsOnTarget: teamStat(teamStats, 'shotsOnTarget'),
        saves: teamStat(teamStats, 'saves'),
        corners: teamStat(teamStats, 'wonCorners'),
        fouls: teamStat(teamStats, 'foulsCommitted'),
        offsides: teamStat(teamStats, 'offsides'),
        passes: teamStat(teamStats, 'totalPasses'),
        passPct: teamStat(teamStats, 'passPct'),
      },
      goals: extractGoalsFromEvents(keyEvents, teamId),
      cards: extractCards(keyEvents, teamId),
      roster: extractRoster(rosters, teamId),
    };
  }

  return {
    eventId,
    date: comp.date,
    stage,
    groupLetter: '',
    seasonTypeId,
    status: {
      state: comp.status.type.state,
      clock: comp.status.displayClock,
    },
    venue,
    venueCity,
    broadcaster,
    home: buildTeam('home'),
    away: buildTeam('away'),
  };
}
