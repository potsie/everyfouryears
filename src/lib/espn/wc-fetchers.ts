import { espnFetch } from '@/lib/espn/core';
import { normalizeScoreboardEvent, type WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { normalizeGroupStandings } from '@/lib/normalize/standings';
import type { WorldCupGroupTable } from '@/types/standings-types';

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
