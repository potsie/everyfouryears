import Link from 'next/link';
import { fetchAllMatches, fetchAllGroupStandings } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import type { WorldCupGroupTable, WorldCupTeamStanding } from '@/types/standings-types';

export const revalidate = 300;

export const metadata = {
  title: 'Groups',
  description: 'All 12 group standings for the 2026 FIFA World Cup.',
};

function groupLetter(g: WorldCupGroupTable): string {
  return g.groupName.replace('Group ', '').trim();
}

function rowClass(s: WorldCupTeamStanding): string {
  const base = 'gfrow';
  if (s.status === 'advancing') return `${base} adv`;
  if (s.status === 'bubble') return `${base} best3`;
  return base;
}

function GroupCard({ group }: { group: WorldCupGroupTable }) {
  const letter = groupLetter(group);
  return (
    <Link href={`/groups/${letter.toLowerCase()}`} className="gcard">
      <div className="gcard-head">
        <span className="gl">GROUP {letter}</span>
        <span className="go">
          Group page
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </div>

      {/* Header row */}
      <div className="gfrow head">
        <span className="rk">#</span>
        <span className="tm">Team</span>
        <span className="num">Pl</span>
        <span className="num">W</span>
        <span className="num">D</span>
        <span className="num">L</span>
        <span className="num">GD</span>
        <span className="pts">Pts</span>
      </div>

      {group.standings.map(s => (
        <div key={s.teamId} className={rowClass(s)}>
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
      ))}
    </Link>
  );
}

function GroupsLegend() {
  return (
    <div className="gt-foot" style={{ marginTop: 8 }}>
      <span className="k">
        <span className="sw" style={{ background: 'var(--advance)', border: '1px solid #cfe8d8' }} />
        Advance to Round of 32
      </span>
      <span className="k">
        <span className="sw" style={{ background: 'var(--best3)', border: '1px solid #f0e2bd' }} />
        Best-third contention
      </span>
    </div>
  );
}

export default async function GroupsPage() {
  const { teamDict } = await fetchAllMatches();
  const standings = await fetchAllGroupStandings(teamDict);

  // Sort A → L
  const sorted = [...standings].sort((a, b) =>
    groupLetter(a).localeCompare(groupLetter(b))
  );

  return (
    <>
      <Nav activePath="/groups" />
      <div className="page">
        <div className="pagehead">
          <div className="eyebrow">2026 FIFA World Cup</div>
          <h1>Group Stage</h1>
          <div className="sub">
            <span className="b tnum">12</span> groups
            <span className="sep">·</span>
            <span className="b tnum">48</span> teams
            <span className="sep">·</span>
            Top two of each group advance, plus the eight best third-placed teams
          </div>
        </div>

        <div className="groups-wall">
          {sorted.map(g => <GroupCard key={g.groupId} group={g} />)}
        </div>

        <GroupsLegend />

        <div className="foot-note">
          <span>Standings update live after each match</span>
          <span>Top 2 advance · Best 8 third-placed teams also advance</span>
        </div>
      </div>
    </>
  );
}
