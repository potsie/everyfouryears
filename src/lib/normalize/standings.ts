import type { WorldCupTeamStanding, AdvancementStatus, WorldCupGroupTable } from '@/types/standings-types';

function getStat(stats: { name: string; displayValue: string }[], name: string): number {
  const stat = stats.find(s => s.name === name);
  return stat ? parseInt(stat.displayValue, 10) : 0;
}

// ESPN's advancement note. The `color` is a hex value (e.g. "#81D6AC"), so we
// map off the human-readable `description`, falling back to color buckets.
function parseAdvancementStatus(note?: { color?: string; description?: string }): AdvancementStatus {
  const desc = (note?.description ?? '').toLowerCase();
  if (desc.includes('eliminat')) return 'eliminated';
  if (desc.includes('best')) return 'bubble';        // "Best 8 advance"
  if (desc.includes('advance')) return 'advancing';  // "Advance to Round of 32"

  const c = (note?.color ?? '').toLowerCase();
  if (c.includes('ff7') || c === 'red') return 'eliminated';
  if (c.includes('b5e7') || c.includes('light')) return 'bubble';
  if (c.includes('81d6') || c === 'green') return 'advancing';
  return 'pending';
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
    // Stats live under records[0] (type "total"), not directly on the entry.
    const stats: { name: string; displayValue: string }[] =
      entry.records?.find((r: any) => r.type === 'total')?.stats ??
      entry.records?.[0]?.stats ??
      entry.stats ??
      [];

    return {
      teamId,
      rank: getStat(stats, 'rank'),
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
      status: parseAdvancementStatus(entry.note),
      statusNote: entry.note?.description,
    };
  });

  // ESPN returns entries in team-id order, not standings order — sort by the
  // official rank (falling back to points / goal difference), then renumber.
  standings.sort((a, b) => {
    const ra = a.rank || 99, rb = b.rank || 99;
    if (ra !== rb) return ra - rb;
    if (b.points !== a.points) return b.points - a.points;
    return b.goalDiff - a.goalDiff;
  });
  standings.forEach((s, i) => {
    s.rank = i + 1;
    if (s.status === 'advancing' && s.gamesPlayed === 3) s.status = 'clinched';
  });

  return { groupId, groupName, standings };
}
