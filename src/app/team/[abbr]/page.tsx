import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { fetchAllMatches, fetchAllGroupStandings } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import TeamClient from './TeamClient';
import type { GroupMiniRow } from '@/components/GroupMini';

export const revalidate = 300;

interface SupplementalTeam {
  espn_id: string;
  team_name: string;
  fifa_ranking: number | null;
  fifa_points: number | null;
  confederation: string | null;
  world_cup_appearances: number | null;
  head_coach: string | null;
  nickname: string | null;
}

interface RosterPlayer {
  id: string;
  displayName: string;
  shortName: string;
  position: string;
  age: number;
  height_inches: number | null;
  displayHeight: string;
  displayWeight: string;
  dateOfBirth: string;
  citizenship: string;
  headshot_url: string | null;
  flag_url: string | null;
  status: string;
}

interface TeamRosterEntry {
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  roster: RosterPlayer[];
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const { abbr } = await params;
  const upperAbbr = abbr.toUpperCase();

  // Load static data
  const supplementalRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/teams-supplemental.json'),
    'utf-8'
  );
  const supplemental: SupplementalTeam[] = JSON.parse(supplementalRaw);

  const rostersRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/world_cup_2026_rosters.json'),
    'utf-8'
  );
  const allRosters: TeamRosterEntry[] = JSON.parse(rostersRaw);

  const teamRoster = allRosters.find(
    t => t.teamAbbreviation.toUpperCase() === upperAbbr
  );
  if (!teamRoster) notFound();

  // ESPN data
  const { matches, teamDict } = await fetchAllMatches();
  const allStandings = await fetchAllGroupStandings(teamDict);

  // Find team in teamDict by abbreviation
  const espnTeam = Object.values(teamDict).find(
    t => t.abbr.toUpperCase() === upperAbbr
  );

  // Supplemental data — try exact match first, then partial
  const suppTeam =
    supplemental.find(s => s.team_name === teamRoster.teamName) ??
    supplemental.find(s => teamRoster.teamName.includes(s.team_name)) ??
    supplemental.find(s => s.team_name.includes(teamRoster.teamName));

  // Find group standings for this team
  const teamStanding = allStandings
    .flatMap(g => g.standings)
    .find(s => s.teamAbbr.toUpperCase() === upperAbbr);

  const groupTable = allStandings.find(g =>
    g.standings.some(s => s.teamAbbr.toUpperCase() === upperAbbr)
  );

  // Compute form from completed matches
  const teamMatches = matches.filter(
    m =>
      m.home.abbr.toUpperCase() === upperAbbr ||
      m.away.abbr.toUpperCase() === upperAbbr
  );
  const completedMatches = teamMatches
    .filter(m => m.status.state === 'post')
    .sort((a, b) => a.date.localeCompare(b.date));

  const form = completedMatches.slice(-5).map(m => {
    const isHome = m.home.abbr.toUpperCase() === upperAbbr;
    const ts = Number(isHome ? m.home.score : m.away.score);
    const os = Number(isHome ? m.away.score : m.home.score);
    const res: 'W' | 'L' | 'D' = ts > os ? 'W' : ts < os ? 'L' : 'D';
    return {
      res,
      score: `${ts}–${os}`,
      opp: isHome ? m.away.abbr : m.home.abbr,
    };
  });

  // Next match
  const nextMatch = teamMatches.find(m => m.status.state === 'pre');
  const nextMatchData = nextMatch
    ? {
        oppAbbr:
          nextMatch.home.abbr.toUpperCase() === upperAbbr
            ? nextMatch.away.abbr
            : nextMatch.home.abbr,
        oppLogo:
          nextMatch.home.abbr.toUpperCase() === upperAbbr
            ? nextMatch.away.logo
            : nextMatch.home.logo,
        date: nextMatch.date,
        venue: nextMatch.venue,
        venueCity: nextMatch.venueCity,
      }
    : null;

  // Squad
  const squad = (teamRoster.roster ?? []).map(p => ({
    id: p.id,
    name: p.displayName,
    pos: p.position,
    age: p.age,
    height: p.displayHeight,
  }));

  // Group standings for mini table
  const groupLetter = groupTable?.groupName.replace('Group ', '').trim() ?? '';
  const groupStandings: GroupMiniRow[] =
    groupTable?.standings.map(s => ({
      abbr: s.teamAbbr,
      logo: s.logo,
      played: s.gamesPlayed,
      gd: (s.goalDiff > 0 ? '+' : '') + s.goalDiff,
      pts: s.points,
      status:
        s.status === 'advancing'
          ? ('advancing' as const)
          : s.status === 'bubble'
          ? ('bubble' as const)
          : s.status === 'eliminated'
          ? ('out' as const)
          : ('' as const),
      isMyTeam: s.teamAbbr.toUpperCase() === upperAbbr,
    })) ?? [];

  return (
    <>
      <Nav activePath="/teams" />
      <div className="page">
        <TeamClient
          abbr={upperAbbr}
          teamName={teamRoster.teamName}
          logo={espnTeam?.logo ?? ''}
          fifaRank={suppTeam?.fifa_ranking ?? null}
          confederation={suppTeam?.confederation ?? ''}
          coach={suppTeam?.head_coach ?? null}
          groupLetter={groupLetter}
          groupRank={teamStanding?.rank ?? null}
          pts={teamStanding?.points ?? 0}
          played={teamStanding?.gamesPlayed ?? 0}
          wcApps={suppTeam?.world_cup_appearances ?? null}
          form={form}
          nextMatch={nextMatchData}
          squad={squad}
          groupStandings={groupStandings}
        />
      </div>
    </>
  );
}
