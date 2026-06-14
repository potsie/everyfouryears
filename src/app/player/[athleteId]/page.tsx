import './player.css';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import { Shot } from '@/components/Shot';
import Link from 'next/link';
import { fetchFifaSquads, fetchAllMatches, fetchTeamColors } from '@/lib/espn/wc-fetchers';
import { espnFetch } from '@/lib/espn/core';
import { buildPlayerWorldCupLog } from '@/lib/stats-live';
import type { ESPNMatchSummaryFull } from '@/types/world-cup-types';
import { PlayerWorldCup } from './PlayerWorldCup';

interface PlayerClubEntry {
  fifaId: string;
  name: string;
  apifId?: number;
  club: string | null;
  clubLogo: string | null;
  league: string | null;
  leagueCountry: string | null;
  photoUrl: string | null;
}

export const revalidate = 3600;

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;

  const [allSquads, { matches, teamDict }] = await Promise.all([
    fetchFifaSquads(),
    fetchAllMatches(),
  ]);


  const clubsRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/players-clubs.json'), 'utf-8'
  );
  const clubsMap: Record<string, PlayerClubEntry> = JSON.parse(clubsRaw);
  const clubData = clubsMap[athleteId] ?? null;

  // Find player across all teams
  let player = null;
  let teamCountryCode = '';
  for (const team of allSquads) {
    const found = team.players.find(p => p.fifaId === athleteId);
    if (found) {
      player = found;
      teamCountryCode = team.countryCode;
      break;
    }
  }
  if (!player) notFound();

  const espnTeamEntry = Object.entries(teamDict).find(
    ([, t]) => t.abbr.toUpperCase() === teamCountryCode
  );
  const espnTeamId = espnTeamEntry?.[0] ?? null;
  const espnTeam = espnTeamEntry?.[1] ?? null;
  const teamLogo = espnTeam?.logo ?? '';
  const teamName = espnTeam?.name ?? teamCountryCode;

  const teamColors = espnTeamId ? await fetchTeamColors(espnTeamId) : null;
  const heroBackground = teamColors?.primary
    ? `linear-gradient(135deg, color-mix(in srgb, ${teamColors.primary} 55%, #0a2240) 0%, #0a2240 100%)`
    : undefined;

  // Build this player's World Cup match log from completed team matches.
  const teamMatches = matches.filter(
    m =>
      m.status.state === 'post' &&
      (m.home.abbr.toUpperCase() === teamCountryCode || m.away.abbr.toUpperCase() === teamCountryCode),
  );
  const matchSummaries = await Promise.all(
    teamMatches.map(async m => ({
      match: m,
      summary: await espnFetch<ESPNMatchSummaryFull>(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${m.eventId}`,
        `wc-match-${m.eventId}`,
        undefined,
      ).catch(() => null),
    })),
  );
  const wcLog = buildPlayerWorldCupLog(
    matchSummaries,
    teamCountryCode,
    player.jerseyNum != null ? String(player.jerseyNum) : '',
    player.positionCode === 'GK',
  );

  const dob = player.birthDate
    ? new Date(player.birthDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

  return (
    <>
      <Nav activePath="/teams" />
      <div className="page">
        <div className="th" style={heroBackground ? { background: heroBackground } : undefined}>
          <div className="th-grain" />
          <div className="th-in">
            <div className="th-top">
              <Link href={`/team/${teamCountryCode.toLowerCase()}/roster`} className="th-back">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {teamName} squad
              </Link>
              <span className="th-rankpill">{player.position}</span>
            </div>

            <div className="ph-id">
              <div className="ph-shot">
                <Shot size={88} name={player.name} headshotUrl={clubData?.photoUrl ?? player.pictureUrl ?? undefined} dark />
              </div>
              <div className="ph-titles">
                <div className="num2">{player.positionCode} · {teamCountryCode}</div>
                <h1>{player.name}</h1>
                <div className="pos2">
                  <span className="chip">{player.position}</span>
                  {player.jerseyNum != null && (
                    <span className="chip">#{player.jerseyNum}</span>
                  )}
                  {clubData?.club && (
                    <span className="chip"><b>{clubData.club}</b></span>
                  )}
                  <span className="chip">
                    <Flag logo={teamLogo} abbr={teamCountryCode} size={15} />
                    <b>{teamName}</b>
                  </span>
                </div>
              </div>
            </div>

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
                <div className="v sm">{player.displayWeight ?? '—'}</div>
                <div className="k">Weight</div>
              </div>
              {player.preferredFoot && (
                <div className="cell">
                  <div className="v sm">{player.preferredFoot}</div>
                  <div className="k">Foot</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cols">
          <div>
            <PlayerWorldCup log={wcLog} />
          </div>

          <div className="shelf">
            <Link href={`/team/${teamCountryCode.toLowerCase()}`} className="myteam" style={{ textDecoration: 'none', display: 'block', ...(heroBackground && { background: heroBackground }) }}>
              <div className="mt-h">Country</div>
              <div className="mt-main">
                <Flag logo={teamLogo} abbr={teamCountryCode} size={36} />
                <div>
                  <div className="mt-code">{teamCountryCode}</div>
                  <div className="mt-sub">{teamName}</div>
                </div>
              </div>
              <div className="mt-next">
                <span>View team profile</span>
                <span style={{ color: 'rgba(255,255,255,.6)' }}>→</span>
              </div>
            </Link>

            <div className="panel">
              <div className="panel-head"><h3>Quick facts</h3></div>
              <div className="facts">
                <div className="fact-row">
                  <span className="k">Position</span>
                  <span className="v">{player.position}</span>
                </div>
                {clubData?.club && (
                  <div className="fact-row">
                    <span className="k">Club</span>
                    <span className="v">{clubData.club}</span>
                  </div>
                )}
                {clubData?.league && (
                  <div className="fact-row">
                    <span className="k">League</span>
                    <span className="v">{clubData.league}</span>
                  </div>
                )}
                {player.jerseyNum != null && (
                  <div className="fact-row">
                    <span className="k">Jersey</span>
                    <span className="v tnum">#{player.jerseyNum}</span>
                  </div>
                )}
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
                {player.preferredFoot && (
                  <div className="fact-row">
                    <span className="k">Preferred foot</span>
                    <span className="v">{player.preferredFoot}</span>
                  </div>
                )}
                <div className="fact-row">
                  <span className="k">Nationality</span>
                  <span className="v">{player.nationality}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
