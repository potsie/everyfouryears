import './roster.css';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { fetchAllMatches, fetchFifaSquads, fetchFifaCoaches, fetchTeamColors } from '@/lib/espn/wc-fetchers';

interface PlayerClubEntry {
  club: string | null;
  photoUrl: string | null;
}
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import RosterClient from './RosterClient';

export const revalidate = 300;

interface SupplementalTeam {
  espn_id: string;
  team_name: string;
  confederation: string | null;
  head_coach: string | null;
}

const ABBR_TO_SUPP: Record<string, string> = {
  USA: 'United States', ENG: 'England', GER: 'Germany', NED: 'Netherlands',
  KOR: 'South Korea', CIV: 'Ivory Coast', COD: 'Congo DR', CPV: 'Cape Verde',
  KSA: 'Saudi Arabia', RSA: 'South Africa', NZL: 'New Zealand',
  BIH: 'Bosnia-Herzegovina', CUW: 'Curacao', HAI: 'Haiti',
};

export default async function RosterPage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const { abbr } = await params;
  const upperAbbr = abbr.toUpperCase();

  const [allSquads, { teamDict }, fifaCoaches] = await Promise.all([
    fetchFifaSquads(),
    fetchAllMatches(),
    fetchFifaCoaches(),
  ]);

  const teamSquad = allSquads.find(t => t.countryCode === upperAbbr);
  if (!teamSquad) notFound();

  const supplementalRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/teams-supplemental.json'),
    'utf-8'
  );
  const supplemental: SupplementalTeam[] = JSON.parse(supplementalRaw);
  const suppName = ABBR_TO_SUPP[upperAbbr] ?? upperAbbr;
  const suppTeam =
    supplemental.find(s => s.team_name === suppName) ??
    supplemental.find(s => s.team_name.includes(suppName)) ??
    supplemental.find(s => suppName.includes(s.team_name));

  const espnTeam = Object.values(teamDict).find(
    t => t.abbr.toUpperCase() === upperAbbr
  );

  const teamName = suppTeam?.team_name ?? upperAbbr;
  const coach = fifaCoaches[upperAbbr] ?? suppTeam?.head_coach ?? null;

  const espnId = Object.entries(teamDict).find(([, t]) => t.abbr.toUpperCase() === upperAbbr)?.[0] ?? suppTeam?.espn_id ?? '';
  const teamColors = espnId ? await fetchTeamColors(espnId) : null;
  const heroBackground = teamColors
    ? `linear-gradient(135deg, color-mix(in srgb, ${teamColors.primary} 55%, #0a2240) 0%, #0a2240 100%)`
    : undefined;

  const clubsRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/players-clubs.json'), 'utf-8'
  );
  const clubsMap: Record<string, PlayerClubEntry> = JSON.parse(clubsRaw);

  const squad = teamSquad.players.map(p => ({
    id: p.fifaId,
    name: p.name,
    pos: p.position,
    posCode: p.positionCode,
    jerseyNum: p.jerseyNum,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    displayHeight: p.displayHeight,
    preferredFoot: p.preferredFoot,
    club: clubsMap[p.fifaId]?.club ?? null,
    photoUrl: clubsMap[p.fifaId]?.photoUrl ?? null,
  }));

  return (
    <>
      <Nav activePath="/teams" />
      <div className="page">
        <div className="th" style={heroBackground ? { background: heroBackground } : undefined}>
          <div className="th-grain" />
          <div className="th-in">
            <div className="th-top">
              <a href={`/team/${upperAbbr.toLowerCase()}`} className="th-back">
                ← Team profile
              </a>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }}>
                {suppTeam?.confederation ?? ''} · 2026 World Cup
              </span>
            </div>
            <div className="th-id">
              <div className="flagwrap">
                <Flag logo={espnTeam?.logo ?? ''} abbr={upperAbbr} size={64} />
              </div>
              <div className="titles">
                <div className="eyebrow2">{upperAbbr} — Squad</div>
                <h1 style={{ fontSize: 32 }}>{teamName}</h1>
                <div className="subline">
                  <span><b className="tnum">{squad.length}</b> players</span>
                  {coach && (
                    <>
                      <span className="sep">·</span>
                      <span>Coach <b>{coach}</b></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <RosterClient abbr={upperAbbr} teamName={teamName} squad={squad} />
      </div>
    </>
  );
}
