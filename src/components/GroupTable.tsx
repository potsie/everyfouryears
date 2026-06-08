import type { WorldCupGroupTable } from '@/types/standings-types';
import { Flag } from './Flag';

interface GroupTableProps {
  group: WorldCupGroupTable;
  myTeamId?: string;
  compact?: boolean;
}

export function GroupTable({ group, myTeamId, compact = false }: GroupTableProps) {
  const letter = group.groupName.replace(/^Group\s+/i, '').trim();

  return (
    <div>
      {/* Title */}
      <div
        className="font-display font-bold text-[13px] tracking-[.06em]"
        style={{ padding: compact ? '8px 15px' : '10px 15px', background: 'var(--navy)', color: '#fff' }}
      >
        GROUP {letter}
      </div>

      {/* Column headers */}
      <div
        className="grid items-center text-[10px] font-bold tracking-[.06em] uppercase"
        style={{
          gridTemplateColumns: '18px 1fr 28px 30px 30px',
          gap: 8,
          padding: '4px 15px',
          color: 'var(--ink-3)',
        }}
      >
        <span className="text-center">#</span>
        <span>Team</span>
        <span className="text-center">GD</span>
        <span className="text-center">Pl</span>
        <span className="text-center">Pts</span>
      </div>

      {/* Team rows */}
      {group.standings.map(team => {
        const isAdv = team.status === 'advancing';
        const isBubble = team.status === 'bubble';
        const isMine = team.teamId === myTeamId;
        const gd = team.goalDiff;

        return (
          <div
            key={team.teamId}
            className="grid items-center text-[13px]"
            style={{
              gridTemplateColumns: '18px 1fr 28px 30px 30px',
              gap: 8,
              padding: compact ? '5px 15px' : '7px 15px',
              borderTop: '1px solid var(--line)',
              background: isAdv ? 'var(--advance)' : isBubble ? 'var(--best3)' : undefined,
              boxShadow: isMine ? 'inset 3px 0 0 var(--accent)' : undefined,
            }}
          >
            <span
              className="font-display font-bold text-center"
              style={{ color: isAdv ? 'var(--live-ink)' : 'var(--ink-3)' }}
            >
              {team.rank}
            </span>
            <div className="flex items-center gap-2 font-semibold min-w-0 overflow-hidden">
              <Flag logo={team.logo} abbr={team.teamAbbr} size={18} />
              <span className="whitespace-nowrap">{team.teamAbbr}</span>
            </div>
            <span className="text-center tnum" style={{ color: 'var(--ink-2)' }}>
              {gd > 0 ? `+${gd}` : gd}
            </span>
            <span className="text-center tnum" style={{ color: 'var(--ink-2)' }}>
              {team.gamesPlayed}
            </span>
            <span className="text-center font-display font-bold tnum" style={{ color: 'var(--ink)' }}>
              {team.points}
            </span>
          </div>
        );
      })}

      {/* Legend */}
      <div
        className="flex gap-[14px] text-[10.5px]"
        style={{ padding: '8px 15px 11px', color: 'var(--ink-3)' }}
      >
        <span className="flex items-center gap-[5px]">
          <span
            className="rounded-[3px]"
            style={{ width: 9, height: 9, background: 'var(--advance)' }}
          />
          Advance
        </span>
        <span className="flex items-center gap-[5px]">
          <span
            className="rounded-[3px]"
            style={{ width: 9, height: 9, background: 'var(--best3)' }}
          />
          Best 3rd
        </span>
      </div>
    </div>
  );
}
