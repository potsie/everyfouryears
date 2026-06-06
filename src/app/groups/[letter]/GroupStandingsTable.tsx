'use client';

import { Flag } from '@/components/Flag';
import { useMyTeam } from '@/contexts/my-team-context';
import type { WorldCupTeamStanding } from '@/types/standings-types';

function rowClass(s: WorldCupTeamStanding): string {
  const base = 'gw-row';
  if (s.status === 'advancing') return `${base} adv`;
  if (s.status === 'bubble') return `${base} best3`;
  return base;
}

function FormDots({ dots }: { dots: Array<'w' | 'd' | 'l'> }) {
  if (!dots.length) return <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>—</span>;
  return (
    <>
      {dots.slice(-4).map((r, i) => (
        <span key={i} className={`fdot ${r}`}>{r.toUpperCase()}</span>
      ))}
    </>
  );
}

interface GroupStandingsTableProps {
  standings: WorldCupTeamStanding[];
  form: Record<string, Array<'w' | 'd' | 'l'>>;
}

export function GroupStandingsTable({ standings, form }: GroupStandingsTableProps) {
  const { myTeam } = useMyTeam();

  return (
    <>
      {standings.map(s => {
        const isMyTeam = myTeam != null && s.teamAbbr.toUpperCase() === myTeam.toUpperCase();
        return (
          <div
            key={s.teamId}
            className={rowClass(s)}
            style={isMyTeam ? { boxShadow: 'inset 3px 0 0 var(--accent)' } : undefined}
          >
            <span className="rk tnum">{s.rank}</span>
            <span className="tm">
              <Flag logo={s.logo} abbr={s.teamAbbr} size={26} />
              <span>
                <span className="c">{s.teamAbbr}</span>
                <span className="n">{s.teamName}</span>
              </span>
            </span>
            <span className="num tnum">{s.gamesPlayed}</span>
            <span className="num tnum">{s.wins}</span>
            <span className="num tnum">{s.draws}</span>
            <span className="num tnum">{s.losses}</span>
            <span className="num tnum hide-s">{s.goalsFor}</span>
            <span className="num tnum hide-s">{s.goalsAgainst}</span>
            <span className="num tnum">{s.goalDiff > 0 ? '+' : ''}{s.goalDiff}</span>
            <span className="form hide-s">
              <FormDots dots={form[s.teamAbbr] ?? []} />
            </span>
            <span className="pts tnum">{s.points}</span>
          </div>
        );
      })}
    </>
  );
}
