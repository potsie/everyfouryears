import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import RosterClient from './RosterClient';

export const revalidate = 300;

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

interface SupplementalTeam {
  espn_id: string;
  team_name: string;
  fifa_ranking: number | null;
  confederation: string | null;
  head_coach: string | null;
  nickname: string | null;
  world_cup_appearances: number | null;
  fifa_points: number | null;
}

export default async function RosterPage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const { abbr } = await params;
  const upperAbbr = abbr.toUpperCase();

  const rostersRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/world_cup_2026_rosters.json'),
    'utf-8'
  );
  const allRosters: TeamRosterEntry[] = JSON.parse(rostersRaw);

  const teamRoster = allRosters.find(
    t => t.teamAbbreviation.toUpperCase() === upperAbbr
  );
  if (!teamRoster) notFound();

  const supplementalRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/teams-supplemental.json'),
    'utf-8'
  );
  const supplemental: SupplementalTeam[] = JSON.parse(supplementalRaw);
  const suppTeam =
    supplemental.find(s => s.team_name === teamRoster.teamName) ??
    supplemental.find(s => teamRoster.teamName.includes(s.team_name)) ??
    supplemental.find(s => s.team_name.includes(teamRoster.teamName));

  const { teamDict } = await fetchAllMatches();
  const espnTeam = Object.values(teamDict).find(
    t => t.abbr.toUpperCase() === upperAbbr
  );

  const squad = (teamRoster.roster ?? []).map(p => ({
    id: p.id,
    name: p.displayName,
    pos: p.position,
    age: p.age,
    height: p.displayHeight,
    headshotUrl: p.headshot_url
      ? p.headshot_url
      : `https://a.espncdn.com/i/headshots/soccer/players/full/${p.id}.png`,
  }));

  return (
    <>
      <Nav activePath="/teams" />
      <div className="page">
        <div className="pagehead">
          <div className="eyebrow">{suppTeam?.confederation ?? ''} · 2026 World Cup</div>
          <h1>{teamRoster.teamName} — Squad</h1>
          <div className="sub">
            <a
              href={`/team/${upperAbbr.toLowerCase()}`}
              style={{
                color: 'var(--ink-2)',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Flag logo={espnTeam?.logo ?? ''} abbr={upperAbbr} size={18} /> Team profile
            </a>
            <span className="sep">·</span>
            <span className="b tnum">{squad.length}</span> players
            {suppTeam?.head_coach && (
              <>
                <span className="sep">·</span>
                Coach <span className="b">{suppTeam.head_coach}</span>
              </>
            )}
          </div>
        </div>

        <RosterClient
          abbr={upperAbbr}
          squad={squad}
        />
      </div>
    </>
  );
}
