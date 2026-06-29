// 'advanced-third' — a third-placed team confirmed as one of the best-8 thirds
// (derived from the seeded Round of 32, not from ESPN, which keeps every third on
// the generic "Best 8 advance" note). See normalizeGroupStandings.
export type AdvancementStatus =
  | 'clinched'
  | 'advancing'
  | 'advanced-third'
  | 'eliminated'
  | 'bubble'
  | 'pending';

export interface WorldCupTeamStanding {
  teamId: string;
  rank: number;
  teamName: string;
  teamAbbr: string;
  logo: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  status: AdvancementStatus;
  statusNote?: string;
}

export interface WorldCupGroupTable {
  groupId: string;
  groupName: string;
  standings: WorldCupTeamStanding[];
}
