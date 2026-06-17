import type {
  ESPNKeyEvent,
  ESPNWorldCupRosterTeam,
  ESPNMatchDetail,
  ESPNMatchSummaryFull,
} from '@/types/world-cup-types';

export interface WorldCupGoal {
  minute: string;
  scorer: string;
  assist?: string;
  ownGoal?: boolean;
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
  linescore: { h1: number; h2: number };  // goals by half, derived from goal minutes
  cards: WorldCupCard[];
  roster: WorldCupPlayer[];
}

// Split a team's goals into first/second half from their minute (e.g. "45'+2'"
// → 45 → 1H, "67'" → 2H). ESPN's scoreboard doesn't return linescores, so we
// derive them; extra-time goals (>45) fold into the 2H bucket.
export function halvesFromGoals(goals: WorldCupGoal[]): { h1: number; h2: number } {
  let h1 = 0, h2 = 0;
  for (const g of goals) {
    const m = parseInt(g.minute, 10);
    if (Number.isNaN(m)) continue;
    if (m <= 45) h1++; else h2++;
  }
  return { h1, h2 };
}

// Display strings for the [1H, 2H, T] linescore columns, per team. A half that
// hasn't happened yet shows "–": everything for an upcoming match, and the 2H
// while a live match is still in the first half / at the break.
export function linescoreCells(match: WorldCupMatchNormalized): {
  home: [string, string, string];
  away: [string, string, string];
} {
  const { state, clock } = match.status;
  const clk = clock || '';
  const clockMin = parseInt(clk, 10);
  const atHalftime = /ht|half/i.test(clk);
  const secondHalfStarted = state === 'post' || (state === 'in' && !atHalftime && clockMin >= 46);
  const cells = (t: WorldCupTeamBoxScore): [string, string, string] => {
    if (state === 'pre') return ['–', '–', '–'];
    return [
      String(t.linescore.h1),
      secondHalfStarted ? String(t.linescore.h2) : '–',
      t.score || '0',
    ];
  };
  return { home: cells(match.home), away: cells(match.away) };
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
    isHalftime: boolean;
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
        // Key off ESPN's scoringPlay flag — the type text varies ("Goal",
        // "Goal - Header", "Penalty - Scored"...) and a strict === 'Goal'
        // check silently drops headers and other goal types.
        const isGoal = d.scoringPlay === true && !d.shootout;
        // d.team is the team the goal counts FOR — including own goals, where
        // it's the beneficiary, not the scorer's team. Trust it when present.
        // The athlete-team fallback only covers details that omit d.team, and
        // must never fire on own goals (the scorer plays for the opponent), or
        // the own goal gets double-credited to both sides.
        const teamMatch = d.team?.id
          ? d.team.id === teamId
          : !d.ownGoal && d.athletesInvolved?.[0]?.team?.id === teamId;
        return isGoal && teamMatch;
      })
      .map(d => ({
        minute: d.clock?.displayValue ?? '',
        scorer: d.athletesInvolved?.[0]?.displayName ?? '',
        assist: d.athletesInvolved?.[1]?.displayName,
        ownGoal: d.ownGoal === true,
      }));
  }

  function buildTeam(competitor: any): WorldCupTeamBoxScore {
    const teamId: string = competitor?.team?.id ?? '';
    const goals = goalsFromDetails(teamId);
    return {
      id: teamId,
      name: competitor?.team?.displayName ?? '',
      abbr: competitor?.team?.abbreviation ?? '',
      logo: competitor?.team?.logo ?? '',
      score: competitor?.score ?? '',
      stats: {},
      goals,
      linescore: halvesFromGoals(goals),
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
      isHalftime: comp.status?.type?.name === 'STATUS_HALFTIME',
    },
    venue: comp.venue?.fullName ?? '',
    venueCity: comp.venue?.address?.city ?? '',
    broadcaster: comp.geoBroadcasts?.[0]?.media?.shortName ?? '',
    home: buildTeam(homeComp),
    away: buildTeam(awayComp),
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
  bench: MatchBenchPlayer[];
  goals: MatchGoal[];
}

export interface MatchBenchPlayer {
  name: string;
  jersey: string;
  pos: string;   // GK | DEF | MID | FWD — filled from FIFA squads (ESPN marks bench as 'SUB')
}

export interface MatchLinePlayer {
  id: string;
  fifaId?: string;          // FIFA player ID — resolved post-normalize via jersey-number join against FIFA squads
  name: string;             // short name
  jersey: string;
  pos: string;              // short position code, e.g. 'GK' | 'CB' | 'LB' | 'DM' | 'CM' | 'LM' | 'ST'
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

// One past fixture in a team's recent form, from the team's perspective.
export interface FormGame {
  result: 'W' | 'D' | 'L';
  oppAbbr: string;
  homeAway: 'H' | 'A';
  score: string;   // team-perspective scoreline, e.g. '0–1'
  comp: string;    // shortened competition label
  date: string;    // e.g. 'Mar'
}
export interface TeamForm {
  games: FormGame[];   // chronological, oldest → newest (newest = last)
  w: number;
  d: number;
  l: number;
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

export interface ShotEvent {
  side: 'home' | 'away';
  outcome: 'goal' | 'attempt';
  period: 1 | 2;  // 1=first half, 2=second half
  // Normalized coords: x=0–100 where 100 is near the attacking goal; y=0–100 pitch width
  x: number;
  y: number;
  minute: string;
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
  isHalftime: boolean;
  home: MatchCenterTeam;
  away: MatchCenterTeam;
  events: MatchKeyEvent[];
  stats: MatchStat[];
  commentary: CommentaryEntry[];
  odds: MatchOdds | null;
  winProbHome: number | null;    // 0-100 latest win prob for home
  winProbDraw: number | null;
  h2h: H2HGame[];
  formHome: TeamForm | null;
  formAway: TeamForm | null;
  groupStandings: { abbr: string; logo: string; played: number; gd: string; pts: number; status: 'advancing' | 'bubble' | 'out' | '' }[];
  motmName: string | null;
  motmLine: string | null;
  shots: ShotEvent[];
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
  if (isGoal) {
    if (e.ownGoal === true || text === 'Own Goal') return 'og';
    return (text === 'Penalty - Scored' || text === 'Penalty Kick Goal') ? 'pen' : 'goal';
  }
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

// ESPN gives detailed position abbreviations like 'CD-L', 'DM', 'LB', 'CM-R'.
// Map each to a vertical band (0 = keeper, rising toward the opponent goal) so
// players land in the right row of the formation.
function posBand(abbr: string): number {
  const a = abbr.toUpperCase();
  if (a === 'G' || a === 'GK') return 0;
  // Strip the -L/-R side suffix so 'CM-L'/'CD-R' classify by their base role.
  const base = a.replace(/-[LR]$/, '');
  if (base.includes('WB') || base.endsWith('B') || base.startsWith('CD') || base === 'CB' || base === 'D' || base === 'SW') return 1; // defenders
  if (base.includes('DM')) return 2;   // defensive mid
  if (base.includes('AM')) return 4;   // attacking mid
  if (base.endsWith('M')) return 3;    // midfield (CM, LM, RM)
  return 5;                             // forwards (F, ST, CF, LW, RW, W)
}

// Horizontal rank within a band, left (1) → right (5). Used to order players
// across a row; the pitch then spreads them evenly.
function posCol(abbr: string): number {
  const a = abbr.toUpperCase();
  if (a.endsWith('-L')) return 2;   // center-left (CD-L, CM-L)
  if (a.endsWith('-R')) return 4;   // center-right
  if (a.startsWith('L')) return 1;  // far left (LB, LM, LW)
  if (a.startsWith('R')) return 5;  // far right (RB, RM, RW)
  return 3;                          // central
}

const SHORT_POS: Record<string, string> = {
  G: 'GK', GK: 'GK',
  CD: 'CB', CB: 'CB', LCB: 'CB', RCB: 'CB', D: 'CB', SW: 'SW',
  LB: 'LB', RB: 'RB', LWB: 'LWB', RWB: 'RWB',
  DM: 'DM', CDM: 'DM',
  CM: 'CM', M: 'CM',
  LM: 'LM', RM: 'RM',
  AM: 'AM', CAM: 'AM',
  LW: 'LW', RW: 'RW',
  F: 'ST', ST: 'ST', CF: 'ST', SS: 'SS',
};
function shortPos(abbr: string): string {
  const a = abbr.toUpperCase();
  if (SHORT_POS[a]) return SHORT_POS[a];
  // Fall back to the base position without the -L/-R side suffix (CF-L → ST).
  const base = a.replace(/-[LR]$/, '');
  return SHORT_POS[base] ?? base;
}

function groupRosters(
  rosters: ESPNWorldCupRosterTeam[] | undefined,
  teamId: string,
): { lines: MatchLinePlayer[][]; bench: MatchBenchPlayer[] } {
  if (!rosters) return { lines: [], bench: [] };
  const teamRoster = rosters.find(r => r.team.id === teamId);
  if (!teamRoster?.roster?.length) return { lines: [], bench: [] };

  const starters = teamRoster.roster.filter(p => p.starter);
  const subs = teamRoster.roster.filter(p => !p.starter);

  // Group starters into formation bands, ordered left→right within each band.
  const bandMap: Record<number, Array<MatchLinePlayer & { col: number }>> = {};
  for (const p of starters) {
    const abbr = p.position?.abbreviation ?? 'M';
    const band = posBand(abbr);
    (bandMap[band] ??= []).push({
      id: p.athlete.id,
      name: p.athlete.shortName || p.athlete.displayName,
      jersey: p.jersey,
      pos: shortPos(abbr),
      isCaptain: false,
      isStar: false,
      headshotUrl: p.athlete.headshot?.href ?? `https://a.espncdn.com/i/headshots/soccer/players/full/${p.athlete.id}.png`,
      col: posCol(abbr),
    });
  }
  const lines = [0, 1, 2, 3, 4, 5]
    .map(b => (bandMap[b] ?? []).sort((x, y) => x.col - y.col).map(({ col: _col, ...rest }) => rest))
    .filter(l => l.length > 0);
  // ESPN marks every bench player's position as 'SUB'; the real position code is
  // filled in later from the FIFA squads (joined by jersey number).
  const bench: MatchBenchPlayer[] = subs.map(p => ({
    name: p.athlete.shortName || p.athlete.displayName,
    jersey: p.jersey,
    pos: '',
  }));
  return { lines, bench };
}

// Collapse ESPN's verbose competition names into a compact label for form chips.
function shortComp(name?: string): string {
  if (!name) return '';
  if (/friendly/i.test(name)) return 'Friendly';
  if (/qualif/i.test(name)) return 'Qualifier';
  if (/nations league/i.test(name)) return 'Nations League';
  if (/world cup/i.test(name)) return 'World Cup';
  if (/euro/i.test(name)) return 'Euros';
  if (/copa/i.test(name)) return 'Copa América';
  return name.replace(/^\d{4}\s+/, '');
}

// Build a team's recent form from ESPN's `lastFiveGames` block. `gameResult` is
// authoritative (from the team's perspective); fall back to comparing scores.
function buildForm(blocks: ESPNMatchSummaryFull['lastFiveGames'], teamId: string): TeamForm | null {
  const blk = blocks?.find(b => b.team?.id === teamId);
  if (!blk?.events?.length) return null;
  let w = 0, d = 0, l = 0;
  const games: FormGame[] = blk.events.slice(0, 5).map(e => {
    const isHome = e.homeTeamId === teamId;
    const tg = Number(isHome ? e.homeTeamScore : e.awayTeamScore) || 0;
    const og = Number(isHome ? e.awayTeamScore : e.homeTeamScore) || 0;
    const r = e.gameResult === 'W' || e.gameResult === 'D' || e.gameResult === 'L'
      ? e.gameResult
      : tg > og ? 'W' : tg < og ? 'L' : 'D';
    if (r === 'W') w++; else if (r === 'D') d++; else l++;
    return {
      result: r as FormGame['result'],
      oppAbbr: e.opponent?.abbreviation ?? '',
      homeAway: e.atVs === '@' ? 'A' : 'H',
      score: `${tg}–${og}`,
      comp: shortComp(e.competitionName),
      date: new Date(e.gameDate).toLocaleString('en-US', { month: 'short' }),
    };
  });
  return { games, w, d, l };
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
      const isGoal = type === 'goal' || type === 'pen' || type === 'og';
      if (isGoal) {
        // team is the side the goal counts FOR — the beneficiary on an own
        // goal, even though `player` is the opponent who scored it.
        if (team === 'home') runningHome++;
        else if (team === 'away') runningAway++;
      }
      let detail = '';
      if (type === 'sub') {
        detail = second ? `for ${second}` : '';
      } else if (type === 'og') {
        detail = 'own goal';
      } else if (type === 'goal' || type === 'pen') {
        detail = second ? `assist ${second}` : (e.type.text === 'Penalty - Scored' || e.type.text === 'Penalty Kick Goal') ? 'penalty' : '';
      }
      return {
        at, extra, type, team, player, detail,
        scoreHome: isGoal ? runningHome : null,
        scoreAway: isGoal ? runningAway : null,
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

  // Recent form (last five) per team, from the team's own perspective
  const formHome = buildForm(data.lastFiveGames, homeId);
  const formAway = buildForm(data.lastFiveGames, awayId);

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
        detail: e.participants?.[1] ? `assist ${e.participants[1].athlete.displayName}` : (e.type.text === 'Penalty - Scored' || e.type.text === 'Penalty Kick Goal') ? 'penalty' : '',
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
    isHalftime: comp.status.type.name === 'STATUS_HALFTIME',
    home: buildTeam(homeComp, 'home'),
    away: buildTeam(awayComp, 'away'),
    events,
    stats,
    commentary,
    odds,
    winProbHome,
    winProbDraw,
    h2h,
    formHome,
    formAway,
    groupStandings,
    motmName,
    motmLine,
    shots: [], // populated from FIFA timeline in fetchMatchSummary
  };
}
