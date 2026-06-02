import type { WorldCupTeamStanding, AdvancementStatus, WorldCupGroupTable } from '@/types/standings-types';

function getStat(stats: { name: string; displayValue: string }[], name: string): number {
  const stat = stats.find(s => s.name === name);
  return stat ? parseInt(stat.displayValue, 10) : 0;
}

function parseAdvancementStatus(color?: string): AdvancementStatus {
  if (!color) return 'pending';
  switch (color.toLowerCase()) {
    case 'green': return 'advancing';
    case 'red': return 'eliminated';
    case 'light green': return 'bubble';
    default: return 'pending';
  }
}

export function normalizeGroupStandings(
  groupId: string,
  groupName: string,
  espnStandingsData: any[],
  teamDictionary: Record<string, { name: string; abbr: string; logo: string }>
): WorldCupGroupTable {
  const standings: WorldCupTeamStanding[] = espnStandingsData.map((entry, index) => {
    const teamRef: string = entry.team?.$ref ?? '';
    const teamIdMatch = teamRef.match(/teams\/(\d+)/);
    const teamId = teamIdMatch ? teamIdMatch[1] : String(index);

    const teamInfo = teamDictionary[teamId] ?? { name: 'TBD', abbr: 'TBD', logo: '' };
    const stats: { name: string; displayValue: string }[] = entry.stats ?? [];

    return {
      teamId,
      rank: index + 1,
      teamName: teamInfo.name,
      teamAbbr: teamInfo.abbr,
      logo: teamInfo.logo,
      gamesPlayed: getStat(stats, 'gamesPlayed'),
      wins: getStat(stats, 'wins'),
      draws: getStat(stats, 'ties'),
      losses: getStat(stats, 'losses'),
      goalsFor: getStat(stats, 'pointsFor'),
      goalsAgainst: getStat(stats, 'pointsAgainst'),
      goalDiff: getStat(stats, 'pointDifferential'),
      points: getStat(stats, 'points'),
      status: parseAdvancementStatus(entry.note?.color),
      statusNote: entry.note?.description,
    };
  });

  return { groupId, groupName, standings };
}
