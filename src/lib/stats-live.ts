import type { ESPNMatchSummaryFull } from '@/types/world-cup-types';

export interface TallyItem { k: string; v: string; sub: string; }
export interface ScorerEntry { p: string; t: string; g: number; a: number; pens: number; mp: number; }
export interface LeadEntry { p: string; t: string; v: number; }
export interface DisciplineEntry { p: string; t: string; y: number; r: number; }
export interface YoungEntry { p: string; t: string; age: number; g: number; a: number; }
export interface TeamStatEntry { t: string; gf: number; ga: number; poss: number; shots: number; }

export interface TournamentStats {
  tallies: TallyItem[];
  goldenBoot: ScorerEntry[];
  assists: LeadEntry[];
  cleanSheets: LeadEntry[];
  saves: LeadEntry[];
  discipline: DisciplineEntry[];
  young: YoungEntry[];
  teamStats: TeamStatEntry[];
}

interface PlayerAcc {
  name: string;
  abbr: string;
  pos: string;
  goals: number;
  assists: number;
  pens: number;
  saves: number;
  cleanSheets: number;
  yellows: number;
  reds: number;
  matches: number;
  dob: string | null;
}

// Born after this date = under 21 on Jun 11 2026
const YOUNG_CUTOFF = new Date('2005-06-11T00:00:00Z');

function playerStat(stats: { name: string; value: string }[] | undefined, name: string): number {
  return Number(stats?.find(s => s.name === name)?.value ?? 0);
}

function teamStatNum(stats: { name: string; displayValue: string }[] | undefined, name: string): number {
  return Number(stats?.find(s => s.name === name)?.displayValue ?? 0);
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const ref = new Date('2026-06-11');
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

export function buildTournamentStats(
  summaries: ESPNMatchSummaryFull[],
  dobMap: Map<string, string>,
  totalGoalsFromScoreboard: number,
): TournamentStats {
  const players = new Map<string, PlayerAcc>();
  const teamAccum = new Map<string, { gf: number; ga: number; poss: number; shots: number; matches: number }>();
  let totalPens = 0;
  let totalRedCards = 0;
  let totalCleanSheets = 0;
  let hatTricks = 0;

  for (const summary of summaries) {
    const comp = summary.header?.competitions?.[0];
    if (!comp) continue;

    // teamId → abbr from header competitors
    const teamAbbrMap = new Map<string, string>();
    for (const c of comp.competitors ?? []) {
      teamAbbrMap.set(c.team.id, c.team.abbreviation);
    }

    // Penalties per player in this match (from keyEvents)
    const playerPens = new Map<string, number>();
    let matchPens = 0;
    for (const evt of summary.keyEvents ?? []) {
      if (evt.type.text === 'Penalty Kick Goal' && !evt.shootout) {
        matchPens++;
        const id = evt.participants?.[0]?.athlete.id;
        if (id) playerPens.set(id, (playerPens.get(id) ?? 0) + 1);
      }
    }
    totalPens += matchPens;

    // Per-player from rosters
    for (const teamRoster of summary.rosters ?? []) {
      const teamId = teamRoster.team.id;
      const abbr = teamAbbrMap.get(teamId) ?? '';

      for (const player of teamRoster.roster) {
        const stats = player.stats ?? [];
        if (playerStat(stats, 'appearances') === 0) continue;

        const id = player.athlete.id;
        const goals = playerStat(stats, 'totalGoals');
        const assists = playerStat(stats, 'goalAssists');
        const saves = playerStat(stats, 'saves');
        const goalsConceded = playerStat(stats, 'goalsConceded');
        const yellows = playerStat(stats, 'yellowCards');
        const reds = playerStat(stats, 'redCards');
        const posAbbr = (player.position?.abbreviation ?? '').toUpperCase();
        const isGK = posAbbr === 'GK' || posAbbr === 'G';
        const cleanSheet = isGK && goalsConceded === 0 ? 1 : 0;
        const pens = playerPens.get(id) ?? 0;

        if (!players.has(id)) {
          players.set(id, {
            name: player.athlete.displayName,
            abbr,
            pos: posAbbr,
            goals: 0, assists: 0, pens: 0, saves: 0,
            cleanSheets: 0, yellows: 0, reds: 0, matches: 0,
            dob: dobMap.get(id) ?? null,
          });
        }

        const p = players.get(id)!;
        p.goals += goals;
        p.assists += assists;
        p.pens += pens;
        p.saves += saves;
        p.cleanSheets += cleanSheet;
        p.yellows += yellows;
        p.reds += reds;
        p.matches++;

        if (cleanSheet) totalCleanSheets++;
        if (reds > 0) totalRedCards += reds;
        // Hat-trick: 3+ goals in a single match for this player
        if (goals >= 3) hatTricks++;
      }
    }

    // Team stats from boxscore
    for (const teamEntry of summary.boxscore?.teams ?? []) {
      const abbr = teamEntry.team.abbreviation;
      const selfComp = comp.competitors.find(c => c.homeAway === teamEntry.homeAway);
      const oppComp = comp.competitors.find(c => c.homeAway !== teamEntry.homeAway);
      const gf = Number(selfComp?.score ?? 0);
      const ga = Number(oppComp?.score ?? 0);
      const poss = teamStatNum(teamEntry.statistics, 'possessionPct');
      const shots = teamStatNum(teamEntry.statistics, 'totalShots');

      if (!teamAccum.has(abbr)) teamAccum.set(abbr, { gf: 0, ga: 0, poss: 0, shots: 0, matches: 0 });
      const t = teamAccum.get(abbr)!;
      t.gf += gf;
      t.ga += ga;
      t.poss += poss;
      t.shots += shots;
      t.matches++;
    }
  }

  const pa = Array.from(players.values());
  const matchCount = summaries.length;
  const goalsPerMatch = matchCount > 0
    ? (totalGoalsFromScoreboard / matchCount).toFixed(2)
    : '—';

  const tallies: TallyItem[] = [
    { k: 'Goals scored',  v: matchCount > 0 ? String(totalGoalsFromScoreboard) : '—', sub: 'this tournament' },
    { k: 'Goals / match', v: matchCount > 0 ? goalsPerMatch : '—',                   sub: 'avg' },
    { k: 'Penalties',     v: matchCount > 0 ? String(totalPens) : '—',               sub: 'scored' },
    { k: 'Clean sheets',  v: matchCount > 0 ? String(totalCleanSheets) : '—',        sub: 'by goalkeepers' },
    { k: 'Red cards',     v: matchCount > 0 ? String(totalRedCards) : '—',           sub: 'this tournament' },
    { k: 'Hat-tricks',    v: matchCount > 0 ? String(hatTricks) : '—',              sub: 'this tournament' },
  ];

  const goldenBoot: ScorerEntry[] = pa
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, 15)
    .map(p => ({ p: p.name, t: p.abbr, g: p.goals, a: p.assists, pens: p.pens, mp: p.matches }));

  const assists: LeadEntry[] = pa
    .filter(p => p.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .slice(0, 8)
    .map(p => ({ p: p.name, t: p.abbr, v: p.assists }));

  const cleanSheets: LeadEntry[] = pa
    .filter(p => p.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets)
    .slice(0, 8)
    .map(p => ({ p: p.name, t: p.abbr, v: p.cleanSheets }));

  const saves: LeadEntry[] = pa
    .filter(p => p.saves > 0)
    .sort((a, b) => b.saves - a.saves)
    .slice(0, 8)
    .map(p => ({ p: p.name, t: p.abbr, v: p.saves }));

  const discipline: DisciplineEntry[] = pa
    .filter(p => p.yellows > 0 || p.reds > 0)
    .sort((a, b) => (b.yellows + b.reds * 3) - (a.yellows + a.reds * 3))
    .slice(0, 8)
    .map(p => ({ p: p.name, t: p.abbr, y: p.yellows, r: p.reds }));

  const young: YoungEntry[] = pa
    .filter(p => {
      if (!p.dob) return false;
      return new Date(p.dob) > YOUNG_CUTOFF && (p.goals > 0 || p.assists > 0);
    })
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists) || b.goals - a.goals)
    .slice(0, 6)
    .map(p => ({ p: p.name, t: p.abbr, age: calcAge(p.dob!), g: p.goals, a: p.assists }));

  const teamStats: TeamStatEntry[] = Array.from(teamAccum.entries())
    .filter(([, t]) => t.matches > 0)
    .sort(([, a], [, b]) => b.gf - a.gf || a.ga - b.ga)
    .slice(0, 12)
    .map(([abbr, t]) => ({
      t: abbr,
      gf: t.gf,
      ga: t.ga,
      poss: Math.round(t.poss / t.matches),
      shots: t.shots,
    }));

  return { tallies, goldenBoot, assists, cleanSheets, saves, discipline, young, teamStats };
}
