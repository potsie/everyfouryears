'use client';

import { Flag } from '@/components/Flag';

export interface GroupMiniRow {
  abbr: string;
  logo: string;
  played: number;
  gd: string;      // e.g. "+2" or "-3" or "0"
  pts: number;
  status: 'advancing' | 'bubble' | 'out' | '';
  isMyTeam?: boolean;
}

interface GroupMiniProps {
  letter: string;  // e.g. "B"
  rows: GroupMiniRow[];
}

function rowClassName(row: GroupMiniRow): string {
  const classes = ['gfrow'];
  if (row.status === 'advancing') classes.push('adv');
  else if (row.status === 'bubble') classes.push('best3');
  if (row.isMyTeam) classes.push('mine');
  return classes.join(' ');
}

export function GroupMini({ letter, rows }: GroupMiniProps) {
  return (
    <div
      className="gcard"
      style={{ pointerEvents: 'none' }}
    >
      {/* Group label */}
      <div className="gcard-head" style={{ padding: '10px 15px 6px' }}>
        <span className="gl" style={{ fontSize: 13 }}>GROUP {letter}</span>
      </div>

      {/* Header row */}
      <div
        className="gfrow head"
        style={{
          gridTemplateColumns: '20px minmax(0,1fr) 28px 28px 36px',
        }}
      >
        <span className="rk">#</span>
        <span className="tm">Team</span>
        <span className="num">GD</span>
        <span className="num">Pl</span>
        <span className="pts">Pts</span>
      </div>

      {/* Data rows */}
      {rows.map((row, i) => (
        <div
          key={row.abbr}
          className={rowClassName(row)}
          style={{
            gridTemplateColumns: '20px minmax(0,1fr) 28px 28px 36px',
          }}
        >
          <span className="rk tnum">{i + 1}</span>
          <span className="tm">
            <Flag logo={row.logo} abbr={row.abbr} size={18} />
            <span className="c">{row.abbr}</span>
          </span>
          <span className="num tnum">{row.gd}</span>
          <span className="num tnum">{row.played}</span>
          <span className="pts">{row.pts}</span>
        </div>
      ))}
    </div>
  );
}
