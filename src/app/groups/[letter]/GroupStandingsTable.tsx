'use client';

import { Flag } from '@/components/Flag';
import { useMyTeam } from '@/contexts/my-team-context';
import type { WorldCupTeamStanding } from '@/types/standings-types';

function rowClass(s: WorldCupTeamStanding): string {
  const base = 'gfrow';
  if (s.status === 'clinched') return `${base} clinched`;
  if (s.status === 'advancing') return `${base} adv`;
  if (s.status === 'bubble') return `${base} best3`;
  return base;
}

interface GroupStandingsTableProps {
  standings: WorldCupTeamStanding[];
}

export function GroupStandingsTable({ standings }: GroupStandingsTableProps) {
  const { myTeam } = useMyTeam();

  return (
    <>
      {standings.map(s => {
        const isMyTeam = myTeam != null && s.teamAbbr.toUpperCase() === myTeam.toUpperCase();
        // Don't override the clinched accent border for a favorite team that's
        // also clinched — clinched wins, matching the homepage group cards.
        const showMine = isMyTeam && s.status !== 'clinched';
        return (
          <div
            key={s.teamId}
            className={rowClass(s)}
            style={showMine ? { boxShadow: 'inset 3px 0 0 var(--accent)' } : undefined}
          >
            <span className="rk tnum">{s.rank}</span>
            <span className="tm">
              <Flag logo={s.logo} abbr={s.teamAbbr} size={18} />
              <span className="c">{s.teamAbbr}</span>
              <span className="n">{s.teamName}</span>
            </span>
            <span className="num tnum">{s.gamesPlayed}</span>
            <span className="num tnum">{s.wins}</span>
            <span className="num tnum">{s.draws}</span>
            <span className="num tnum">{s.losses}</span>
            <span className="num tnum">{s.goalDiff > 0 ? '+' : ''}{s.goalDiff}</span>
            <span className="pts tnum">{s.points}</span>
          </div>
        );
      })}
    </>
  );
}
