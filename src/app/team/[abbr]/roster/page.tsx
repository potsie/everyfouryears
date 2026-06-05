import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { fetchAllMatches, fetchFifaSquads, fetchFifaCoaches } from '@/lib/espn/wc-fetchers';
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
  }));

  return (
    <>
      <Nav activePath="/teams" />
      <div className="page">
        <div className="pagehead">
          <div className="eyebrow">{suppTeam?.confederation ?? ''} · 2026 World Cup</div>
          <h1>{teamName} — Squad</h1>
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
            {coach && (
              <>
                <span className="sep">·</span>
                Coach <span className="b">{coach}</span>
              </>
            )}
          </div>
        </div>

        <RosterClient abbr={upperAbbr} squad={squad} />
      </div>
    </>
  );
}
