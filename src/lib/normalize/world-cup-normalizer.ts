import type {
  ESPNWorldCupSummaryResponse,
  ESPNSoccerTeamStat,
  ESPNKeyEvent,
  ESPNWorldCupRosterTeam,
  ESPNMatchDetail,
  ESPNMatchSummaryFull,
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

// ESPN stores season type on event.season.slug, not comp.season.type.id
const ESPN_SLUG_TO_TYPE: Record<string, number> = {
  'group-stage': 1,
  'round-of-32': 2,
  'round-of-16': 3,
  'quarterfinals': 4,
  'semifinals': 5,
  '3rd-place-match': 6,
  'final': 7,
};

// --- Scoreboard event normalizer (for homepage, bracket, API route) ---
export function normalizeScoreboardEvent(event: any): WorldCupMatchNormalized {
  const comp = event.competitions?.[0] ?? {};
  const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home') ?? {};
  const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away') ?? {};

  const seasonTypeId = ESPN_SLUG_TO_TYPE[event.season?.slug ?? '']
    ?? Number(comp.season?.type?.id ?? 1);
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
  return (teamRoster.roster ?? []).map(player => ({
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
      logo: competitor.team.logo ?? competitor.team.logos?.[0]?.href ?? '',
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

// ---- Types for the Match Center UI ----

export interface MatchCenterTeam {
  id: string;
  abbr: string;
  name: string;
  logo: string;
  score: number | null;      // null = pre-match
  formation: string;
  coach: string;
  lines: MatchLinePlayer[][];  // grouped by position line: [GK], [DEF...], [MID...], [FWD...]
  bench: string[];
  goals: MatchGoal[];
}

export interface MatchLinePlayer {
  id: string;
  name: string;             // short name
  jersey: string;
  isCaptain: boolean;
  isStar: boolean;
  headshotUrl: string;
}

export interface MatchGoal {
  minute: string;
  player: string;
  detail: string;            // e.g. "assist McKennie" or "penalty"
}

export interface MatchKeyEvent {
  at: number;               // minute as number
  extra: number;            // stoppage time (0 if none)
  type: 'goal' | 'pen' | 'og' | 'yellow' | 'red' | 'sub' | 'var' | 'whistle';
  team: 'home' | 'away' | 'neutral';
  player: string;
  detail: string;
  scoreHome: number | null;
  scoreAway: number | null;
}

export interface MatchStat {
  label: string;
  home: number;
  away: number;
  unit?: string;
  pct?: boolean;
}

export interface CommentaryEntry {
  min: string;
  type: 'goal' | 'pen' | 'yellow' | 'red' | 'var' | 'sub' | 'note' | 'whistle';
  text: string;
}

export interface MatchOdds {
  homeMoneyline: string;
  drawMoneyline: string;
  awayMoneyline: string;
  overUnder: string;
}

export interface H2HGame {
  date: string;
  comp: string;
  homeAbbr: string;
  awayAbbr: string;
  score: string;
}

export interface MatchBroadcast {
  name: string;
  lang: string; // abbreviated: 'EN' | 'ES' | '' (unknown)
}

// Match officials come from the FIFA API (ESPN's summary doesn't surface them).
// Joined onto the ESPN-keyed match in fetchMatchSummary, so the normalizer
// defaults this to []. During a live match only the referee is present; the
// full crew (assistants, fourth official, VAR) fills in around full time.
export interface MatchOfficial {
  name: string;
  country: string; // FIFA country code, e.g. 'BRA'
  role: string;    // 'Referee', 'Assistant Referee', 'Fourth Official', 'Video Assistant Referee'
}

// US World Cup 2026 channel → language. ESPN's per-broadcast `lang` field is
// unreliable (it marks Telemundo and Peacock as "en"), so map from the known
// channel and only fall back to ESPN's field for anything unrecognized.
const CHANNEL_LANG: Record<string, 'EN' | 'ES'> = {
  FOX: 'EN', FS1: 'EN', 'FOX Sports': 'EN', Tubi: 'EN',
  Telemundo: 'ES', Universo: 'ES', Peacock: 'ES',
};
function channelLang(name: string, espnLang?: string): string {
  if (CHANNEL_LANG[name]) return CHANNEL_LANG[name];
  if (espnLang === 'es') return 'ES';
  if (espnLang === 'en') return 'EN';
  return '';
}

export interface MatchCenterData {
  eventId: string;
  state: 'pre' | 'in' | 'post';
  date: string;
  kickoffISO: string;
  group: string;
  matchday: string;
  round: string;
  venue: string;
  venueCity: string;
  broadcaster: MatchBroadcast[];
  streamer: MatchBroadcast[];
  officials: MatchOfficial[];
  attendance: number | null;
  clock: string;
  home: MatchCenterTeam;
  away: MatchCenterTeam;
  events: MatchKeyEvent[];
  stats: MatchStat[];
  commentary: CommentaryEntry[];
  odds: MatchOdds | null;
  winProbHome: number | null;    // 0-100 latest win prob for home
  winProbDraw: number | null;
  h2h: H2HGame[];
  groupStandings: { abbr: string; logo: string; played: number; gd: string; pts: number; status: 'advancing' | 'bubble' | 'out' | '' }[];
  motmName: string | null;
  motmLine: string | null;
}

function parseMinute(displayValue: string): { at: number; extra: number } {
  const m = displayValue.replace("'", '');
  if (m.includes('+')) {
    const [base, extra] = m.split('+').map(Number);
    return { at: base, extra: extra || 0 };
  }
  return { at: Number(m) || 0, extra: 0 };
}

// Returns null for events we don't surface on the timeline (kickoff, delays,
// half markers, VAR checks, anything unrecognized). Goals are keyed off ESPN's
// authoritative `scoringPlay` flag — text alone misclassifies "Start Delay" etc.
function eventType(e: ESPNKeyEvent): MatchKeyEvent['type'] | null {
  const text = e.type.text;
  const isGoal =
    !e.shootout &&
    e.scoringPlay !== false &&
    (e.scoringPlay === true || text.startsWith('Goal'));
  if (isGoal) return text === 'Penalty Kick Goal' ? 'pen' : 'goal';
  if (text === 'Yellow Card') return 'yellow';
  if (text === 'Red Card') return 'red';
  if (text === 'Substitution') return 'sub';
  if (text === 'End Match' || text === 'Full Time') return 'whistle';
  return null;
}

function commentaryType(text: string, typeText?: string): CommentaryEntry['type'] {
  const t = typeText ?? '';
  if (t.includes('Goal')) return 'goal';
  if (t.includes('Penalty')) return 'pen';
  if (t.includes('Yellow')) return 'yellow';
  if (t.includes('Red')) return 'red';
  if (t.includes('Sub')) return 'sub';
  if (t.includes('VAR')) return 'var';
  if (text.toLowerCase().includes('whistle') || text.toLowerCase().includes('full time')) return 'whistle';
  return 'note';
}

function groupRosters(
  rosters: ESPNWorldCupRosterTeam[] | undefined,
  teamId: string,
): { lines: MatchLinePlayer[][]; bench: string[] } {
  if (!rosters) return { lines: [], bench: [] };
  const teamRoster = rosters.find(r => r.team.id === teamId);
  if (!teamRoster?.roster?.length) return { lines: [], bench: [] };

  const starters = teamRoster.roster.filter(p => p.starter);
  const subs = teamRoster.roster.filter(p => !p.starter);

  // Group starters by position line
  const posOrder: Record<string, number> = { GK: 0, G: 0, DEF: 1, D: 1, MID: 2, M: 2, FWD: 3, F: 3, ATT: 3 };
  const lineMap: Record<number, MatchLinePlayer[]> = {};
  for (const p of starters) {
    const posAbbr = p.position?.abbreviation?.toUpperCase() ?? 'MID';
    const lineIdx = posOrder[posAbbr] ?? 2;
    if (!lineMap[lineIdx]) lineMap[lineIdx] = [];
    lineMap[lineIdx].push({
      id: p.athlete.id,
      name: p.athlete.shortName || p.athlete.displayName,
      jersey: p.jersey,
      isCaptain: false,
      isStar: false,
      headshotUrl: p.athlete.headshot?.href ?? `https://a.espncdn.com/i/headshots/soccer/players/full/${p.athlete.id}.png`,
    });
  }
  const lines = [0, 1, 2, 3].map(i => lineMap[i] ?? []).filter(l => l.length > 0);
  const bench = subs.map(p => p.athlete.shortName || p.athlete.displayName);
  return { lines, bench };
}

export function normalizeMatchDetail(eventId: string, data: ESPNMatchSummaryFull): MatchCenterData {
  const comp = data.header.competitions[0];
  const homeComp = comp.competitors.find(c => c.homeAway === 'home')!;
  const awayComp = comp.competitors.find(c => c.homeAway === 'away')!;
  const homeId = homeComp.team.id;
  const awayId = awayComp.team.id;

  const keyEvents = data.keyEvents ?? [];
  const state = comp.status.type.state;

  // Events for timeline. ESPN returns keyEvents in chronological order, so the
  // running score is accumulated as we walk them.
  let runningHome = 0, runningAway = 0;
  const events: MatchKeyEvent[] = keyEvents
    .map(e => {
      const type = eventType(e);
      if (type === null) return null;
      const { at, extra } = parseMinute(e.clock?.displayValue ?? '0');
      const team: 'home' | 'away' | 'neutral' = e.team?.id === homeId ? 'home' : e.team?.id === awayId ? 'away' : 'neutral';
      // participants[0] is the primary player; participants[1] is context that
      // differs by event: the assist provider on a goal, the player coming off
      // on a substitution ("X replaces Y").
      const player = e.participants?.[0]?.athlete.displayName ?? '';
      const second = e.participants?.[1]?.athlete.displayName;
      if (type === 'goal' || type === 'pen') {
        if (team === 'home') runningHome++;
        else if (team === 'away') runningAway++;
      }
      let detail = '';
      if (type === 'sub') {
        detail = second ? `for ${second}` : '';
      } else if (type === 'goal' || type === 'pen') {
        detail = second ? `assist ${second}` : e.type.text === 'Penalty Kick Goal' ? 'penalty' : '';
      }
      return {
        at, extra, type, team, player, detail,
        scoreHome: (type === 'goal' || type === 'pen') ? runningHome : null,
        scoreAway: (type === 'goal' || type === 'pen') ? runningAway : null,
      };
    })
    .filter((e): e is MatchKeyEvent => e !== null);

  // Add whistle for post
  if (state === 'post') {
    events.push({ at: 90, extra: 0, type: 'whistle', team: 'neutral', player: '', detail: 'Full Time', scoreHome: null, scoreAway: null });
  }

  // Stats
  const homeEntry = data.boxscore.teams.find(t => t.homeAway === 'home');
  const awayEntry = data.boxscore.teams.find(t => t.homeAway === 'away');
  const hStats = homeEntry?.statistics ?? [];
  const aStats = awayEntry?.statistics ?? [];
  const getStat = (stats: typeof hStats, name: string) => Number(stats.find(s => s.name === name)?.displayValue ?? 0);

  const stats: MatchStat[] = [
    { label: 'Possession', home: getStat(hStats, 'possessionPct'), away: getStat(aStats, 'possessionPct'), unit: '%', pct: true },
    { label: 'Shots', home: getStat(hStats, 'totalShots'), away: getStat(aStats, 'totalShots') },
    { label: 'Shots on target', home: getStat(hStats, 'shotsOnTarget'), away: getStat(aStats, 'shotsOnTarget') },
    { label: 'Saves', home: getStat(hStats, 'saves'), away: getStat(aStats, 'saves') },
    { label: 'Corners', home: getStat(hStats, 'wonCorners'), away: getStat(aStats, 'wonCorners') },
    { label: 'Fouls', home: getStat(hStats, 'foulsCommitted'), away: getStat(aStats, 'foulsCommitted') },
    { label: 'Offsides', home: getStat(hStats, 'offsides'), away: getStat(aStats, 'offsides') },
    { label: 'Passes', home: getStat(hStats, 'totalPasses'), away: getStat(aStats, 'totalPasses') },
    { label: 'Pass accuracy', home: getStat(hStats, 'passPct'), away: getStat(aStats, 'passPct'), unit: '%', pct: true },
    { label: 'Yellow cards', home: getStat(hStats, 'yellowCards'), away: getStat(aStats, 'yellowCards') },
    { label: 'Red cards', home: getStat(hStats, 'redCards'), away: getStat(aStats, 'redCards') },
  ].filter(s => s.home > 0 || s.away > 0 || s.pct);

  // Lineups
  const homeRoster = groupRosters(data.rosters, homeId);
  const awayRoster = groupRosters(data.rosters, awayId);

  // Commentary
  const commentary: CommentaryEntry[] = (data.commentary ?? []).map(c => ({
    min: c.time?.displayValue || c.clock?.displayValue || '—',
    type: commentaryType(c.text, c.type?.text),
    text: c.text,
  }));

  // Odds
  let odds: MatchOdds | null = null;
  const pc = data.pickcenter?.[0];
  if (pc) {
    const fmt = (n?: number) => n == null ? '—' : n > 0 ? `+${n}` : String(n);
    odds = {
      homeMoneyline: fmt(pc.homeTeamOdds?.moneyLine),
      drawMoneyline: fmt(pc.drawOdds?.moneyLine),
      awayMoneyline: fmt(pc.awayTeamOdds?.moneyLine),
      overUnder: pc.overUnder != null ? String(pc.overUnder) : '—',
    };
  }

  // Win probability (latest entry)
  const wpEntries = data.winprobability ?? [];
  const lastWP = wpEntries[wpEntries.length - 1];
  const winProbHome = lastWP ? Math.round(lastWP.homeWinPercentage * 100) : null;
  const winProbDraw = lastWP ? Math.round((lastWP.tiePercentage ?? 0) * 100) : null;

  // H2H
  const h2h: H2HGame[] = (data.headToHeadGames?.events ?? []).slice(0, 4).map(ev => {
    const c = ev.competitions?.[0];
    if (!c) return null;
    const home = c.competitors.find(t => t.homeAway === 'home');
    const away = c.competitors.find(t => t.homeAway === 'away');
    const d = new Date(c.date);
    const dateStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const comp = c.notes?.[0]?.text ?? 'Friendly';
    return {
      date: dateStr,
      comp,
      homeAbbr: home?.team.abbreviation ?? '',
      awayAbbr: away?.team.abbreviation ?? '',
      score: `${home?.score ?? 0}–${away?.score ?? 0}`,
    };
  }).filter((g): g is H2HGame => g !== null);

  // Group standings (from embedded standings in summary)
  const groupStandings: MatchCenterData['groupStandings'] = [];

  // Broadcast — summary endpoint exposes this via top-level `broadcasts`
  // (geoBroadcasts is null here, unlike the scoreboard endpoint).
  const collectChannels = (slug: string): MatchBroadcast[] => {
    const seen = new Set<string>();
    const out: MatchBroadcast[] = [];
    for (const b of data.broadcasts ?? []) {
      if (b.type?.slug !== slug) continue;
      const name = b.media?.name || b.media?.shortName || '';
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, lang: channelLang(name, b.lang) });
    }
    return out;
  };
  let broadcaster = collectChannels('television');
  const streamer = collectChannels('streaming');
  if (broadcaster.length === 0) {
    const geo = comp.geoBroadcasts?.[0]?.media?.shortName;
    if (geo) broadcaster = [{ name: geo, lang: channelLang(geo) }];
  }

  // Group info from header
  const rawGroup = (comp as any).groups?.shortName ?? (comp as any).group?.shortName ?? '';
  const groupLetter = rawGroup.replace(/^Group\s+/i, '').trim();
  const seasonTypeId = Number(data.header.season?.type?.id ?? 1);
  const roundNames: Record<number, string> = { 1: 'Group Stage', 2: 'Round of 32', 3: 'Round of 16', 4: 'Quarterfinals', 5: 'Semifinals', 6: 'Third Place', 7: 'Final' };
  const round = roundNames[seasonTypeId] ?? 'Match';
  const matchday = (comp as any).week?.number ? `Matchday ${(comp as any).week?.number}` : round;

  function buildTeam(competitor: typeof homeComp, homeAway: 'home' | 'away'): MatchCenterTeam {
    const roster = homeAway === 'home' ? homeRoster : awayRoster;
    const teamId = competitor.team.id;
    const score = state === 'pre' ? null : Number(competitor.score);
    const teamGoals = keyEvents
      .filter(e => (e.type.text.includes('Goal')) && e.team?.id === teamId)
      .map(e => ({
        minute: e.clock?.displayValue ?? '',
        player: e.participants?.[0]?.athlete.displayName ?? '',
        detail: e.participants?.[1] ? `assist ${e.participants[1].athlete.displayName}` : e.type.text === 'Penalty Kick Goal' ? 'penalty' : '',
      }));
    return {
      id: teamId,
      abbr: competitor.team.abbreviation,
      name: competitor.team.displayName,
      logo: competitor.team.logo ?? competitor.team.logos?.[0]?.href ?? '',
      score,
      formation: '',
      coach: '',
      lines: roster.lines,
      bench: roster.bench,
      goals: teamGoals,
    };
  }

  // MOTM from leaders (post-match)
  let motmName: string | null = null;
  let motmLine: string | null = null;
  if (data.leaders && state === 'post') {
    const ratingLeader = data.leaders.find(l =>
      l.leaders?.some(ll => ll.displayName?.toLowerCase().includes('rating'))
    );
    const top = ratingLeader?.leaders?.[0]?.leaders?.[0];
    if (top) {
      motmName = top.athlete.displayName;
      motmLine = `Rating: ${top.displayValue}`;
    }
  }

  return {
    eventId,
    state,
    date: comp.date,
    kickoffISO: comp.date,
    group: groupLetter,
    matchday,
    round,
    venue: data.gameInfo.venue?.fullName ?? '',
    venueCity: data.gameInfo.venue?.address?.city ?? '',
    broadcaster,
    streamer,
    officials: [], // populated from FIFA API in fetchMatchSummary
    attendance: data.gameInfo.attendance ?? null,
    clock: comp.status.displayClock,
    home: buildTeam(homeComp, 'home'),
    away: buildTeam(awayComp, 'away'),
    events,
    stats,
    commentary,
    odds,
    winProbHome,
    winProbDraw,
    h2h,
    groupStandings,
    motmName,
    motmLine,
  };
}
