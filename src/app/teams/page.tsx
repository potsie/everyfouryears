import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import { MyTeamTeamCard } from '@/components/MyTeamTeamCard';

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

const CONFEDERATION_ORDER = ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

const CONF_LABELS: Record<string, string> = {
  UEFA: 'UEFA — Europe',
  CONMEBOL: 'CONMEBOL — South America',
  CONCACAF: 'CONCACAF — North & Central America',
  CAF: 'CAF — Africa',
  AFC: 'AFC — Asia',
  OFC: 'OFC — Oceania',
};

export default async function TeamsPage() {
  const supplementalRaw = fs.readFileSync(
    path.join(process.cwd(), 'data/teams-supplemental.json'),
    'utf-8'
  );
  const supplemental: SupplementalTeam[] = JSON.parse(supplementalRaw);

  const { teamDict } = await fetchAllMatches();

  // Build merged team list
  interface MergedTeam {
    abbr: string;
    name: string;
    logo: string;
    fifaRank: number | null;
    confederation: string;
    espnId: string;
  }

  // Map by ESPN ID from teamDict
  const teamById: Record<string, { name: string; abbr: string; logo: string }> = {};
  for (const [id, t] of Object.entries(teamDict)) {
    teamById[id] = t;
  }

  const merged: MergedTeam[] = supplemental.map(s => {
    const espnTeam = teamById[s.espn_id];
    return {
      abbr: espnTeam?.abbr ?? '',
      name: espnTeam?.name ?? s.team_name,
      logo: espnTeam?.logo ?? '',
      fifaRank: s.fifa_ranking,
      confederation: s.confederation ?? 'UEFA',
      espnId: s.espn_id,
    };
  }).filter(t => t.abbr !== '');

  // Group by confederation
  const byConf: Record<string, MergedTeam[]> = {};
  for (const team of merged) {
    const conf = team.confederation;
    if (!byConf[conf]) byConf[conf] = [];
    byConf[conf].push(team);
  }

  // Sort each group by FIFA rank
  for (const conf of Object.keys(byConf)) {
    byConf[conf].sort((a, b) => {
      if (a.fifaRank == null && b.fifaRank == null) return 0;
      if (a.fifaRank == null) return 1;
      if (b.fifaRank == null) return -1;
      return a.fifaRank - b.fifaRank;
    });
  }

  return (
    <>
      <Nav activePath="/teams" />
      <div className="page">
        <div className="pagehead">
          <div className="eyebrow">2026 FIFA World Cup</div>
          <h1>48 Teams</h1>
          <div className="sub">
            <span>6 confederations</span>
            <span className="sep">·</span>
            <span>48 nations</span>
            <span className="sep">·</span>
            <span>12 groups</span>
          </div>
        </div>

        {CONFEDERATION_ORDER.map(conf => {
          const teams = byConf[conf];
          if (!teams || teams.length === 0) return null;
          return (
            <section key={conf} style={{ marginTop: 32 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--line)',
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 700,
                    fontSize: 16,
                    margin: 0,
                    color: 'var(--ink)',
                  }}
                >
                  {CONF_LABELS[conf] ?? conf}
                </h2>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    fontWeight: 600,
                  }}
                >
                  {teams.length} teams
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 10,
                }}
              >
                {teams.map(team => (
                  <MyTeamTeamCard
                    key={team.espnId}
                    abbr={team.abbr}
                    href={`/team/${team.abbr.toLowerCase()}`}
                  >
                    <Flag logo={team.logo} abbr={team.abbr} size={32} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'var(--display)',
                          fontWeight: 700,
                          fontSize: 14,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {team.abbr}
                      </div>
                      {team.fifaRank != null && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--ink-3)',
                            fontWeight: 600,
                            marginTop: 2,
                          }}
                        >
                          #{team.fifaRank}
                        </div>
                      )}
                    </div>
                  </MyTeamTeamCard>
                ))}
              </div>
            </section>
          );
        })}

        <div className="foot-note" style={{ marginTop: 40 }}>
          <span>48 qualified teams · 2026 FIFA World Cup</span>
          <span>Rankings: FIFA World Rankings</span>
        </div>
      </div>
    </>
  );
}
