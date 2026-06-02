// ESPN API response shapes for the World Cup

export interface ESPNWorldCupCompetitor {
  homeAway: 'home' | 'away';
  winner?: boolean;
  score: string;
  team: {
    id: string;
    displayName: string;
    name: string;
    location: string;
    abbreviation: string;
    logo?: string;
  };
}

export interface ESPNMatchDetail {
  type: { id?: string; text?: string };
  clock?: { displayValue: string };
  team?: { id: string };
  athletesInvolved?: {
    id: string;
    displayName: string;
    team?: { id: string };
  }[];
  scoringPlay?: boolean;
  shootout?: boolean;
}

export interface ESPNWorldCupCompetition {
  date: string;
  competitors: ESPNWorldCupCompetitor[];
  status: {
    clock: number;
    displayClock: string;
    type: { name: string; completed: boolean; state: 'pre' | 'in' | 'post' };
  };
  geoBroadcasts?: {
    media?: { shortName: string };
    type?: { shortName: string };
  }[];
  venue?: {
    fullName?: string;
    address?: { city?: string; state?: string };
  };
  groups?: { shortName?: string };
  season?: { type?: { id?: number; name?: string } };
  details?: ESPNMatchDetail[];
}

export interface ESPNSoccerTeamStat {
  name: string;
  displayValue: string;
  label: string;
}

export interface ESPNSoccerTeamEntry {
  team: { id: string; abbreviation: string; displayName: string };
  homeAway: 'home' | 'away';
  statistics: ESPNSoccerTeamStat[];
}

export interface ESPNKeyEvent {
  id: string;
  type: { text: string };
  clock: { displayValue: string };
  team?: { id: string };
  participants?: {
    athlete: { id: string; displayName: string };
  }[];
  text?: string;
  shootout?: boolean;
}

export interface ESPNWorldCupRosterPlayer {
  starter: boolean;
  jersey: string;
  position?: { name: string; abbreviation: string };
  athlete: {
    id: string;
    displayName: string;
    shortName: string;
    headshot?: { href: string };
    flag?: { href: string };
  };
  stats?: { name: string; value: string }[];
}

export interface ESPNWorldCupRosterTeam {
  team: { id: string; displayName: string };
  roster: ESPNWorldCupRosterPlayer[];
}

export interface ESPNWorldCupCommentary {
  text: string;
  clock?: { displayValue: string };
  type?: { text: string };
}

export interface ESPNWorldCupSummaryResponse {
  header: {
    competitions: ESPNWorldCupCompetition[];
    season?: { type: { id: string; name: string } };
  };
  boxscore: {
    teams: ESPNSoccerTeamEntry[];
  };
  rosters?: ESPNWorldCupRosterTeam[];
  keyEvents?: ESPNKeyEvent[];
  commentary?: ESPNWorldCupCommentary[];
  standings?: unknown;
  gameInfo: {
    attendance?: number;
    venue?: { fullName?: string; address?: { city?: string } };
  };
}

// Extended summary response — full match center data
export interface ESPNCommentaryEntry {
  text: string;
  clock?: { displayValue: string };
  type?: { text: string };
  athletesInvolved?: { id: string; displayName: string }[];
}

export interface ESPNPickcenterEntry {
  provider?: { name: string };
  homeTeamOdds?: { moneyLine?: number };
  awayTeamOdds?: { moneyLine?: number };
  drawOdds?: { moneyLine?: number };
  overUnder?: number;
  spread?: number;
  awayTeamSpread?: number;
}

export interface ESPNHeadToHeadGame {
  competitions?: {
    date: string;
    competitors: { homeAway: string; team: { abbreviation: string }; score: string; winner?: boolean }[];
    status?: { type?: { completed: boolean } };
    notes?: { text: string }[];
  }[];
}

export interface ESPNLeader {
  team?: { abbreviation: string; logo?: string };
  leaders?: {
    displayName: string;
    leaders?: {
      athlete: { displayName: string; headshot?: { href: string }; id: string };
      value: number;
      displayValue: string;
    }[];
  }[];
}

// Extended summary response shape
export interface ESPNMatchSummaryFull extends ESPNWorldCupSummaryResponse {
  commentary?: ESPNCommentaryEntry[];
  pickcenter?: ESPNPickcenterEntry[];
  headToHeadGames?: { events?: ESPNHeadToHeadGame[] };
  leaders?: ESPNLeader[];
  article?: { story?: string };
  videos?: { source?: { HD?: { href: string } }; thumbnail?: string; description?: string; duration?: number }[];
  winprobability?: { homeWinPercentage: number; tiePercentage: number; awayWinPercentage?: number; playId?: string }[];
}
