import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import { Shot } from '@/components/Shot';
import Link from 'next/link';

export const revalidate = 3600;

interface RosterPlayer {
  id: string;
  displayName: string;
  shortName: string;
  position: string;
  age: number | null;
  height_inches: number | null;
  displayHeight: string | null;
  displayWeight: string | null;
  dateOfBirth: string | null;
  citizenship: string | null;
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

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;

  const rostersRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/world_cup_2026_rosters.json'),
    'utf-8'
  );
  const allRosters: TeamRosterEntry[] = JSON.parse(rostersRaw);

  // Find player across all teams
  let player: RosterPlayer | null = null;
  let teamAbbr = '';
  let teamName = '';
  let teamLogo = '';

  for (const team of allRosters) {
    const found = team.roster.find((p) => p.id === athleteId);
    if (found) {
      player = found;
      teamAbbr = team.teamAbbreviation;
      teamName = team.teamName;
      teamLogo = found.flag_url ?? '';
      break;
    }
  }

  if (!player) notFound();

  const headshotUrl =
    player.headshot_url ??
    `https://a.espncdn.com/i/headshots/soccer/players/full/${athleteId}.png`;

  // Map position string to short code
  const posMap: Record<string, string> = {
    Goalkeeper: 'GK',
    Defender: 'DEF',
    Midfielder: 'MID',
    Forward: 'FWD',
  };
  const posCode = posMap[player.position] ?? player.position;

  // Format DOB
  const dob = player.dateOfBirth
    ? new Date(player.dateOfBirth).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <>
      <Nav activePath="/teams" />
      <div className="page">
        {/* Navy hero */}
        <div className="th">
          <div className="th-grain" />
          <div className="th-in">
            <div className="th-top">
              <Link
                href={`/team/${teamAbbr.toLowerCase()}/roster`}
                className="th-back"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="m15 6-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {teamName} squad
              </Link>
              <span className="th-rankpill">{player.position}</span>
            </div>

            {/* Player identity block */}
            <div className="ph-id">
              <div className="ph-shot">
                <Shot
                  size={88}
                  name={player.displayName}
                  headshotUrl={headshotUrl}
                  dark
                />
              </div>
              <div className="ph-titles">
                <div className="num2">
                  {posCode} · {teamAbbr}
                </div>
                <h1>{player.displayName}</h1>
                <div className="pos2">
                  <span className="chip">{player.position}</span>
                  <span className="chip">
                    <Flag logo={teamLogo} abbr={teamAbbr} size={15} />
                    <b>{teamName}</b>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick-stat strip */}
            <div className="th-strip">
              <div className="cell">
                <div className="v tnum">{player.age ?? '—'}</div>
                <div className="k">Age</div>
              </div>
              <div className="cell">
                <div className="v sm">{player.displayHeight ?? '—'}</div>
                <div className="k">Height</div>
              </div>
              <div className="cell">
                <div className="v sm">{player.citizenship ?? '—'}</div>
                <div className="k">Nation</div>
              </div>
              <div className="cell">
                <div className="v sm">{player.displayWeight ?? '—'}</div>
                <div className="k">Weight</div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="cols">
          <div>
            {/* At the 2026 World Cup — stat tiles */}
            <div className="t-card">
              <div className="t-card-head">
                <h3>At the 2026 World Cup</h3>
              </div>
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--ink-3)',
                  fontSize: 13,
                }}
              >
                Tournament stats update after each match.
              </div>
            </div>
          </div>

          {/* Shelf */}
          <div className="shelf">
            {/* Team card linking back to team profile */}
            <Link
              href={`/team/${teamAbbr.toLowerCase()}`}
              className="myteam"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="mt-h">Country</div>
              <div className="mt-main">
                <Flag logo={teamLogo} abbr={teamAbbr} size={36} />
                <div>
                  <div className="mt-code">{teamAbbr}</div>
                  <div className="mt-sub">{teamName}</div>
                </div>
              </div>
              <div className="mt-next">
                <span>View team profile</span>
                <span style={{ color: 'rgba(255,255,255,.6)' }}>→</span>
              </div>
            </Link>

            {/* Quick facts */}
            <div className="panel">
              <div className="panel-head">
                <h3>Quick facts</h3>
              </div>
              <div className="facts">
                <div className="fact-row">
                  <span className="k">Position</span>
                  <span className="v">{player.position}</span>
                </div>
                <div className="fact-row">
                  <span className="k">Date of birth</span>
                  <span className="v">{dob}</span>
                </div>
                <div className="fact-row">
                  <span className="k">Height</span>
                  <span className="v">{player.displayHeight ?? '—'}</span>
                </div>
                <div className="fact-row">
                  <span className="k">Weight</span>
                  <span className="v">{player.displayWeight ?? '—'}</span>
                </div>
                <div className="fact-row">
                  <span className="k">Nationality</span>
                  <span className="v">{player.citizenship ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
