import { espnFetch } from '@/lib/espn/core';
import { normalizeScoreboardEvent, normalizeMatchDetail, type WorldCupMatchNormalized, type MatchCenterData } from '@/lib/normalize/world-cup-normalizer';
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

export async function fetchMatchSummary(eventId: string): Promise<MatchCenterData> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;
  const data = await espnFetch<ESPNMatchSummaryFull>(url, `wc-match-${eventId}`, 60);
  return normalizeMatchDetail(eventId, data);
}
