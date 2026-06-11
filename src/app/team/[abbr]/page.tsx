import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { fetchAllMatches, fetchAllGroupStandings, fetchTeamColors, fetchFifaRankings, fetchFifaTeamBio, fetchFifaCoaches, fetchFifaSquads } from '@/lib/espn/wc-fetchers';
import { fetchTeamNewsMerged } from '@/lib/news';
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

  // FIFA squads — live, one call for all 48 teams
  const allSquads = await fetchFifaSquads();
  const teamSquad = allSquads.find(t => t.countryCode === upperAbbr);
  if (!teamSquad) notFound();

  // Supplemental lookup — ESPN abbreviations match FIFA country codes for all 48 teams
  // except a few edge cases handled here
  const ABBR_TO_SUPP: Record<string, string> = {
    USA: 'United States', ENG: 'England', GER: 'Germany', NED: 'Netherlands',
    KOR: 'South Korea', CIV: 'Ivory Coast', COD: 'Congo DR', CPV: 'Cape Verde',
    KSA: 'Saudi Arabia', RSA: 'South Africa', NZL: 'New Zealand',
    BIH: 'Bosnia-Herzegovina', CUW: 'Curacao', HAI: 'Haiti',
  };
  const suppName = ABBR_TO_SUPP[upperAbbr] ?? upperAbbr;
  const suppTeamActual =
    supplemental.find(s => s.team_name === suppName) ??
    supplemental.find(s => s.team_name.includes(suppName)) ??
    supplemental.find(s => suppName.includes(s.team_name));

  const clubsRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/players-clubs.json'), 'utf-8'
  );
  const clubsMap: Record<string, { photoUrl: string | null }> = JSON.parse(clubsRaw);
  const { matches, teamDict } = await fetchAllMatches();

  // Resolve ESPN team ID from teamDict (keyed by ESPN ID, values have abbr)
  // Falls back to supplemental espn_id if not found in scoreboard data
  const espnTeamEntry = Object.entries(teamDict).find(([, t]) => t.abbr.toUpperCase() === upperAbbr);
  const espnId = espnTeamEntry?.[0] ?? suppTeamActual?.espn_id ?? '';

  const [allStandings, teamColors, fifaRankings, fifaCoaches, teamNews] = await Promise.all([
    fetchAllGroupStandings(teamDict),
    fetchTeamColors(espnId),
    fetchFifaRankings(),
    fetchFifaCoaches(),
    fetchTeamNewsMerged(espnId, {
      abbr: upperAbbr,
      teamName: suppName,
      nickname: suppTeamActual?.nickname,
    }),
  ]);

  const fifaRanking = fifaRankings[upperAbbr] ?? null;
  const fifaBio = fifaRanking?.fifaTeamId
    ? await fetchFifaTeamBio(fifaRanking.fifaTeamId)
    : null;

  // Find team in teamDict by abbreviation
  const espnTeam = Object.values(teamDict).find(
    t => t.abbr.toUpperCase() === upperAbbr
  );

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

  // Squad from FIFA
  const squad = teamSquad.players.map(p => ({
    id: p.fifaId,
    name: p.name,
    pos: p.position,
    age: p.age ?? 0,
    height: p.displayHeight ?? '',
    photoUrl: clubsMap[p.fifaId]?.photoUrl ?? null,
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
          teamName={suppTeamActual?.team_name ?? espnTeam?.name ?? upperAbbr}
          logo={espnTeam?.logo ?? ''}
          fifaRank={fifaRanking?.rank ?? suppTeamActual?.fifa_ranking ?? null}
          rankingMovement={fifaRanking?.movement ?? null}
          rankingPrev={fifaRanking?.prevRank ?? null}
          ratedMatches={fifaRanking?.ratedMatches ?? null}
          foundationYear={fifaBio?.foundationYear ?? null}
          confederation={suppTeamActual?.confederation ?? ''}
          coach={fifaCoaches[upperAbbr] ?? suppTeamActual?.head_coach ?? null}
          groupLetter={groupLetter}
          groupRank={teamStanding?.rank ?? null}
          pts={teamStanding?.points ?? 0}
          played={teamStanding?.gamesPlayed ?? 0}
          wcApps={suppTeamActual?.world_cup_appearances ?? null}
          nickname={suppTeamActual?.nickname ?? null}
          form={form}
          nextMatch={nextMatchData}
          squad={squad}
          groupStandings={groupStandings}
          teamColorPrimary={teamColors?.primary ?? null}
          teamColorAlt={teamColors?.alt ?? null}
          teamNews={teamNews}
        />
      </div>
    </>
  );
}
