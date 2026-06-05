import type { WorldCupGroupTable } from '@/types/standings-types';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { GroupTable } from './GroupTable';
import Link from 'next/link';

interface DataShelfProps {
  groupStandings: WorldCupGroupTable[];
  todayMatches: WorldCupMatchNormalized[];
  myTeam: string | null;
  showAllGroups: boolean;
  onToggleAllGroups: () => void;
  statCategory: string;
  onStatCategory: (cat: string) => void;
}

const STAT_TABS = ['Goals', 'Assists', 'Clean sheets', 'Saves'];

export function DataShelf({
  groupStandings,
  todayMatches,
  myTeam,
  showAllGroups,
  onToggleAllGroups,
  statCategory,
  onStatCategory,
}: DataShelfProps) {
  const myTeamGroup = myTeam
    ? groupStandings.find(g => g.standings.some(t => t.teamAbbr === myTeam))
    : null;
  const myTeamStanding = myTeamGroup?.standings.find(t => t.teamAbbr === myTeam);

  // For curated view: user's group + groups with live matches
  const liveGroupLetters = new Set(
    todayMatches
      .filter(m => m.status.state === 'in')
      .map(m => m.groupLetter)
      .filter(Boolean),
  );

  const curatedGroups = groupStandings.filter((g, i) => {
    const letter = g.groupName.replace(/^Group\s+/i, '').trim();
    return (
      g === myTeamGroup ||
      liveGroupLetters.has(letter) ||
      i < 2
    );
  }).slice(0, 3);

  return (
    <div className="flex flex-col gap-[22px]">
      {/* My Team card */}
      {myTeam && myTeamStanding && (
        <div
          className="text-white"
          style={{
            background: 'linear-gradient(120deg,var(--navy),var(--navy-700))',
            borderRadius: 'var(--r-md)',
            padding: '15px 16px',
            boxShadow: 'var(--sh-1)',
          }}
        >
          <div
            className="font-bold text-[11px] tracking-[.12em] uppercase mb-[10px]"
            style={{ color: 'rgba(255,255,255,.6)' }}
          >
            ★ My Team
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-[22px]">{myTeamStanding.teamAbbr}</span>
            <div className="text-[12px]" style={{ color: 'rgba(255,255,255,.72)' }}>
              {myTeamGroup?.groupName} · {ordinal(myTeamStanding.rank)} · {myTeamStanding.points} pts
            </div>
          </div>
        </div>
      )}

      {/* Standings panel */}
      {groupStandings.length > 0 && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--sh-1)',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between px-[15px] py-3"
            style={{ borderBottom: '1px solid var(--line)' }}
          >
            <h3 className="font-display font-bold text-[14px] m-0 tracking-[.01em]">
              Standings
            </h3>
            <button
              onClick={onToggleAllGroups}
              className="text-[12px] font-semibold cursor-pointer"
              style={{
                color: 'var(--ink-2)',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              {showAllGroups ? 'Collapse ▲' : 'All 12 groups →'}
            </button>
          </div>

          {curatedGroups.map(group => (
            <div key={group.groupId} style={{ borderTop: '1px solid var(--line)' }}>
              <GroupTable
                group={group}
                myTeamId={myTeamStanding?.teamId}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {/* Stat leaders panel */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--sh-1)',
          overflow: 'hidden',
        }}
      >
        <div
          className="flex items-center justify-between px-[15px] py-3"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <h3 className="font-display font-bold text-[14px] m-0 tracking-[.01em]">
            Stat Leaders
          </h3>
          <Link
            href="/stats"
            className="text-[12px] font-semibold no-underline"
            style={{ color: 'var(--ink-2)' }}
          >
            Full stats →
          </Link>
        </div>

        {/* Tab row */}
        <div
          className="flex gap-1 scrollbar-none"
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--line)',
            overflowX: 'auto',
          }}
        >
          {STAT_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => onStatCategory(tab)}
              className="text-[11.5px] font-bold whitespace-nowrap cursor-pointer"
              style={{
                padding: '6px 10px',
                borderRadius: 7,
                background: statCategory === tab ? 'var(--inset)' : 'transparent',
                color: statCategory === tab ? 'var(--ink)' : 'var(--ink-3)',
                border: 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Empty state — stat aggregation runs post-match */}
        <div
          className="px-[15px] py-[24px] text-center text-[13px]"
          style={{ color: 'var(--ink-3)' }}
        >
          Stats accumulate as matches complete
        </div>
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
