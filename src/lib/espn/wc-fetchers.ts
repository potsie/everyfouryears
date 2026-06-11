import { espnFetch } from '@/lib/espn/core';
import { normalizeScoreboardEvent, normalizeMatchDetail, type WorldCupMatchNormalized, type MatchCenterData, type MatchCenterTeam, type MatchOfficial } from '@/lib/normalize/world-cup-normalizer';
import { normalizeGroupStandings } from '@/lib/normalize/standings';
import type { WorldCupGroupTable } from '@/types/standings-types';
import type { ESPNMatchSummaryFull } from '@/types/world-cup-types';

type TeamDictionary = Record<string, { name: string; abbr: string; logo: string }>;

function buildTeamDictionary(events: any[]): TeamDictionary {
  const dict: TeamDictionary = {};
  for (const event of events) {
    for (const comp of event.competitions ?? []) {
      for (const competitor of comp.competitors ?? []) {
        const { id, displayName, abbreviation, logo } = competitor.team ?? {};
        if (id && !dict[id]) {
          dict[id] = { name: displayName ?? '', abbr: abbreviation ?? '', logo: logo ?? '' };
        }
      }
    }
  }
  return dict;
}

export interface ScoreboardResult {
  matches: WorldCupMatchNormalized[];
  teamDict: TeamDictionary;
}

export async function fetchAllMatches(): Promise<ScoreboardResult> {
  const url =
    'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard' +
    '?dates=20260611-20260720&limit=200';

  const data = await espnFetch<any>(url, 'wc-scoreboard-all', 60);
  const events: any[] = data.events ?? [];

  return {
    matches: events.map(normalizeScoreboardEvent),
    teamDict: buildTeamDictionary(events),
  };
}

async function fetchGroupById(
  groupId: string,
  teamDict: TeamDictionary,
): Promise<WorldCupGroupTable | null> {
  try {
    const base =
      'https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1/groups';

    const [groupData, standingsData] = await Promise.all([
      espnFetch<any>(`${base}/${groupId}`, `wc-group-${groupId}`, 300),
      espnFetch<any>(`${base}/${groupId}/standings/0`, `wc-standings-${groupId}`, 300),
    ]);

    const groupName: string =
      groupData.name ?? groupData.shortName ?? `Group ${groupId}`;

    const rawEntries =
      standingsData.standings ??
      standingsData.entries ??
      (Array.isArray(standingsData) ? standingsData : []);

    return normalizeGroupStandings(groupId, groupName, rawEntries, teamDict);
  } catch {
    return null;
  }
}

export async function fetchAllGroupStandings(
  teamDict: TeamDictionary,
): Promise<WorldCupGroupTable[]> {
  const url =
    'https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1/groups?limit=20';

  const data = await espnFetch<any>(url, 'wc-groups-list', 300);

  const refs: string[] = (data.items ?? [])
    .map((item: any) => item.$ref ?? '')
    .filter(Boolean);

  const groupIds = refs
    .map(ref => ref.match(/\/groups\/(\d+)/)?.[1])
    .filter((id): id is string => Boolean(id));

  if (groupIds.length === 0) return [];

  const results = await Promise.all(groupIds.map(id => fetchGroupById(id, teamDict)));
  return results.filter((g): g is WorldCupGroupTable => g !== null);
}

export interface NewsArticle {
  id: string;
  headline: string;
  description: string;
  published: string;
  premium: boolean;
  section: string;
  byline: string;
  imageUrl: string | null;
  href: string;
}

const SECTION_MAP: Record<string, string> = {
  'match-recap': 'Match Report',
  'recap': 'Match Report',
  'analysis': 'Analysis',
  'feature': 'Feature',
  'opinion': 'Opinion',
  'team-news': 'Team News',
  'preview': 'Preview',
  'video': 'Video',
};

function deriveSection(categories: any[]): string {
  if (!Array.isArray(categories)) return 'News';
  for (const cat of categories) {
    const slug = (cat.slug ?? cat.name ?? '').toLowerCase().replace(/\s+/g, '-');
    if (SECTION_MAP[slug]) return SECTION_MAP[slug];
    const desc = (cat.description ?? '').toLowerCase();
    for (const [key, label] of Object.entries(SECTION_MAP)) {
      if (desc.includes(key.replace('-', ' '))) return label;
    }
  }
  return 'News';
}

export interface FifaRankingEntry {
  rank: number;
  prevRank: number;
  movement: number;
  points: number;
  ratedMatches: number;
  fifaTeamId: string;
}

export async function fetchFifaRankings(): Promise<Record<string, FifaRankingEntry>> {
  const url =
    'https://api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule' +
    '?rankingScheduleId=FRS_Male_Football_20260119&language=en';
  const data = await espnFetch<any>(url, 'fifa-rankings', 86400);
  const results: any[] = data?.Results ?? [];
  const map: Record<string, FifaRankingEntry> = {};
  for (const r of results) {
    if (!r.IdCountry) continue;
    map[r.IdCountry] = {
      rank: r.Rank,
      prevRank: r.PrevRank,
      movement: r.RankingMovement,
      points: r.TotalPoints,
      ratedMatches: r.RatedMatches,
      fifaTeamId: r.IdTeam,
    };
  }
  return map;
}

export interface FifaSquadPlayer {
  fifaId: string;
  name: string;
  shortName: string;
  jerseyNum: number | null;
  position: string;        // 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'
  positionCode: string;    // 'GK' | 'DEF' | 'MID' | 'FWD'
  birthDate: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  displayHeight: string | null;
  displayWeight: string | null;
  preferredFoot: string | null;
  nationality: string;
  pictureUrl: string | null;
}

export interface FifaTeamSquad {
  fifaTeamId: string;
  countryCode: string;
  players: FifaSquadPlayer[];
}

const FIFA_POS: Record<number, [string, string]> = {
  0: ['Goalkeeper', 'GK'],
  1: ['Defender', 'DEF'],
  2: ['Midfielder', 'MID'],
  3: ['Forward', 'FWD'],
};

const FIFA_FOOT: Record<number, string> = { 1: 'Right', 2: 'Left', 3: 'Both' };

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function normalizeFifaPlayer(p: any): FifaSquadPlayer {
  const posNum: number = p.Position ?? 0;
  const [position, positionCode] = FIFA_POS[posNum] ?? ['Unknown', '?'];
  const hCm: number | null = p.Height ?? null;
  const wKg: number | null = p.Weight ?? null;
  return {
    fifaId: String(p.IdPlayer),
    name: p.PlayerName?.[0]?.Description ?? '',
    shortName: p.ShortName?.[0]?.Description ?? '',
    jerseyNum: p.JerseyNum ?? null,
    position,
    positionCode,
    birthDate: p.BirthDate ?? null,
    age: calcAge(p.BirthDate ?? null),
    heightCm: hCm,
    weightKg: wKg,
    displayHeight: hCm ? `${hCm} cm` : null,
    displayWeight: wKg ? `${wKg} kg` : null,
    preferredFoot: p.PreferredFoot != null ? (FIFA_FOOT[p.PreferredFoot] ?? null) : null,
    nationality: p.IdCountry ?? '',
    pictureUrl: p.PlayerPicture?.PictureUrl ?? null,
  };
}

export async function fetchFifaSquads(): Promise<FifaTeamSquad[]> {
  const url = 'https://api.fifa.com/api/v3/teams/squads/all/17/285023?language=en';
  const data = await espnFetch<any>(url, 'fifa-wc2026-squads', 86400);
  const teams: any[] = data?.Results ?? data ?? [];
  return teams.map((t: any) => ({
    fifaTeamId: String(t.IdTeam),
    countryCode: t.IdCountry ?? '',
    players: (t.Players ?? []).map(normalizeFifaPlayer),
  }));
}

export async function fetchFifaCoaches(): Promise<Record<string, string>> {
  const squadsUrl = 'https://api.fifa.com/api/v3/teams/squads/all/17/285023?language=en';
  const coachesUrl = 'https://api.fifa.com/api/v3/coaches/season/285023?language=en&count=200';

  const [squadsData, coachesData] = await Promise.all([
    espnFetch<any>(squadsUrl, 'fifa-wc2026-squads-meta', 86400),
    espnFetch<any>(coachesUrl, 'fifa-wc2026-coaches', 86400),
  ]);

  const squads: any[] = squadsData?.Results ?? squadsData ?? [];
  const coaches: any[] = coachesData?.Results ?? coachesData ?? [];

  const teamIdToCountry: Record<string, string> = {};
  for (const t of squads) {
    if (t.IdTeam && t.IdCountry) teamIdToCountry[t.IdTeam] = t.IdCountry;
  }

  const result: Record<string, string> = {};
  for (const c of coaches) {
    if (c.Role !== 0) continue; // Role=0 is head coach
    const country = teamIdToCountry[c.IdTeam];
    if (!country) continue;
    const name = c.Name?.[0]?.Description ?? '';
    if (name) result[country] = name;
  }
  return result;
}

export async function fetchFifaTeamBio(fifaTeamId: string): Promise<{ foundationYear: number | null } | null> {
  try {
    const url = `https://api.fifa.com/api/v3/teams/${fifaTeamId}?language=en`;
    const data = await espnFetch<any>(url, `fifa-team-bio-${fifaTeamId}`, 86400);
    return { foundationYear: data?.FoundationYear ?? null };
  } catch {
    return null;
  }
}

export async function fetchTeamColors(espnId: string): Promise<{ primary: string; alt: string } | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/${espnId}`;
    const data = await espnFetch<any>(url, `wc-team-colors-${espnId}`, 86400);
    const team = data?.team;
    if (!team?.color) return null;
    return {
      primary: `#${team.color}`,
      alt: team.alternateColor ? `#${team.alternateColor}` : `#${team.color}`,
    };
  } catch {
    return null;
  }
}

export async function fetchTeamNews(espnId: string): Promise<NewsArticle[]> {
  if (!espnId) return [];
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news?team=${espnId}&limit=5`;
  const data = await espnFetch<any>(url, `wc-team-news-${espnId}`, 600);
  const articles: any[] = data.articles ?? [];
  return articles.map((a: any, i: number) => ({
    id: String(a.id ?? a.dataSourceIdentifier ?? i),
    headline: a.headline ?? '',
    description: a.description ?? '',
    published: a.published ?? new Date().toISOString(),
    premium: a.premium ?? false,
    section: deriveSection(a.categories ?? []),
    byline: a.byline ?? 'ESPN Staff',
    imageUrl: a.images?.[0]?.url ?? null,
    href: a.links?.web?.href ?? 'https://www.espn.com/soccer/fifa-world-cup/',
  }));
}

export async function fetchNews(): Promise<NewsArticle[]> {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news?limit=20';
  const data = await espnFetch<any>(url, 'wc-news', 600);
  const articles: any[] = data.articles ?? [];

  return articles.map((a: any, i: number) => ({
    id: String(a.id ?? a.dataSourceIdentifier ?? i),
    headline: a.headline ?? '',
    description: a.description ?? '',
    published: a.published ?? new Date().toISOString(),
    premium: a.premium ?? false,
    section: deriveSection(a.categories ?? []),
    byline: a.byline ?? 'ESPN Staff',
    imageUrl: a.images?.[0]?.url ?? null,
    href: a.links?.web?.href ?? 'https://www.espn.com/soccer/fifa-world-cup/',
  }));
}

// Match officials (referee + crew) come from the FIFA calendar — ESPN's summary
// doesn't include them. One cached call covers all 104 matches; we key by the
// FIFA trigram pairing, which matches ESPN's team abbreviations.
export async function fetchFifaMatchOfficials(): Promise<Record<string, MatchOfficial[]>> {
  const url =
    'https://api.fifa.com/api/v3/calendar/matches' +
    '?idCompetition=17&idSeason=285023&count=200&language=en';
  const data = await espnFetch<any>(url, 'fifa-match-officials', 300);
  const results: any[] = data?.Results ?? [];
  const map: Record<string, MatchOfficial[]> = {};
  for (const m of results) {
    const home = m?.Home?.Abbreviation;
    const away = m?.Away?.Abbreviation;
    if (!home || !away) continue;
    const officials: MatchOfficial[] = (m.Officials ?? [])
      .map((o: any) => ({
        name: o?.Name?.[0]?.Description ?? o?.NameShort?.[0]?.Description ?? '',
        country: o?.IdCountry ?? '',
        role: o?.TypeLocalized?.[0]?.Description ?? '',
      }))
      .filter((o: MatchOfficial) => o.name);
    if (officials.length) map[`${home}|${away}`] = officials;
  }
  return map;
}

// ESPN marks bench players as 'SUB', so fill their position code (GK/DEF/MID/FWD)
// from the FIFA squad, joined by jersey number, and group the bench by position.
const BENCH_POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
function fillBenchPositions(team: MatchCenterTeam, squads: FifaTeamSquad[]): void {
  const squad = squads.find(s => s.countryCode === team.abbr);
  if (!squad) return;
  const byJersey = new Map<string, string>();
  for (const p of squad.players) {
    if (p.jerseyNum != null) byJersey.set(String(p.jerseyNum), p.positionCode);
  }
  team.bench = team.bench
    .map(b => ({ ...b, pos: byJersey.get(b.jersey) || b.pos }))
    .sort((a, b) => (BENCH_POS_ORDER[a.pos] ?? 9) - (BENCH_POS_ORDER[b.pos] ?? 9));
}

export async function fetchMatchSummary(eventId: string): Promise<MatchCenterData> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;
  const data = await espnFetch<ESPNMatchSummaryFull>(url, `wc-match-${eventId}`, 60);
  const match = normalizeMatchDetail(eventId, data);

  // Enrich from FIFA (best-effort — never block the page on it): match referee
  // and bench player positions. Both are independently cached, so run in parallel.
  const [officialsMap, squads] = await Promise.all([
    fetchFifaMatchOfficials().catch(() => ({} as Record<string, MatchOfficial[]>)),
    fetchFifaSquads().catch(() => [] as FifaTeamSquad[]),
  ]);
  match.officials = officialsMap[`${match.home.abbr}|${match.away.abbr}`] ?? [];
  fillBenchPositions(match.home, squads);
  fillBenchPositions(match.away, squads);

  return match;
}
