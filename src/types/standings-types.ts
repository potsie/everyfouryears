export type AdvancementStatus = 'advancing' | 'eliminated' | 'bubble' | 'pending';

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
