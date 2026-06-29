'use client';

import { useMyTeam } from '@/contexts/my-team-context';
import { Flag } from '@/components/Flag';
import type { WorldCupTeamStanding } from '@/types/standings-types';

function rowClass(s: WorldCupTeamStanding, isMyTeam: boolean): string {
  let cls = 'gfrow';
  if (s.status === 'clinched') cls += ' clinched';
  else if (s.status === 'advancing') cls += ' adv';
  else if (s.status === 'advanced-third') cls += ' best3-adv';
  else if (s.status === 'bubble') cls += ' best3';
  else if (s.status === 'eliminated') cls += ' eliminated';
  if (isMyTeam) cls += ' mine';
  return cls;
}

export function GroupCardRows({ standings }: { standings: WorldCupTeamStanding[] }) {
  const { myTeam } = useMyTeam();

  return (
    <>
      {standings.map(s => {
        const isMyTeam = !!myTeam && s.teamAbbr.toUpperCase() === myTeam.toUpperCase();
        return (
          <div key={s.teamId} className={rowClass(s, isMyTeam)}>
            <span className="rk tnum">{s.rank}</span>
            <span className="tm">
              <Flag logo={s.logo} abbr={s.teamAbbr} size={18} />
              <span className="c">{s.teamAbbr}</span>
              <span className="n">{s.teamName}</span>
              {s.status === 'advanced-third' && <span className="adv-badge">Advanced</span>}
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
