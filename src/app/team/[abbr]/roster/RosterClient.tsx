'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shot } from '@/components/Shot';

interface SquadPlayer {
  id: string;
  name: string;
  pos: string;
  age: number;
  height: string;
  headshotUrl: string;
}

interface RosterClientProps {
  abbr: string;
  squad: SquadPlayer[];
}

const POS_ORDER: [string, string][] = [
  ['Goalkeeper', 'Goalkeepers'],
  ['Defender', 'Defenders'],
  ['Midfielder', 'Midfielders'],
  ['Forward', 'Forwards'],
];

function posCode(pos: string): string {
  if (pos === 'Goalkeeper') return 'GK';
  if (pos === 'Defender') return 'DEF';
  if (pos === 'Midfielder') return 'MID';
  if (pos === 'Forward') return 'FWD';
  return pos.slice(0, 3).toUpperCase();
}

function PCard({ p }: { p: SquadPlayer }) {
  return (
    <Link href={`/player/${p.id}`} className="pcard" style={{ textDecoration: 'none' }}>
      <Shot size={50} name={p.name} headshotUrl={p.headshotUrl} />
      <div className="pc-info">
        <div className="pc-name">{p.name}</div>
        <div className="pc-club">
          <span>{posCode(p.pos)}</span>
        </div>
        <div className="pc-meta">
          <span>
            Age <b className="tnum">{p.age}</b>
          </span>
          <span>{p.height}</span>
        </div>
      </div>
    </Link>
  );
}

export default function RosterClient({ abbr, squad }: RosterClientProps) {
  const [sort, setSort] = useState<'Position' | 'Number'>('Position');

  return (
    <>
      <div className="roster-sub">
        <div className="seg">
          {(['Position', 'Number'] as const).map(s => (
            <button
              key={s}
              className={sort === s ? 'on' : ''}
              onClick={() => setSort(s)}
            >
              By {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {sort === 'Position' ? (
        POS_ORDER.map(([posKey, posLabel]) => {
          const rows = squad.filter(p => p.pos === posKey);
          if (rows.length === 0) return null;
          return (
            <section className="pos-group" key={posKey}>
              <div className="pos-label">
                <h3>{posLabel}</h3>
                <span className="cnt">{rows.length}</span>
              </div>
              <div className="squad-grid">
                {rows.map(p => (
                  <PCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <section className="pos-group">
          <div className="squad-grid">
            {[...squad]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(p => (
                <PCard key={p.id} p={p} />
              ))}
          </div>
        </section>
      )}

      <div className="foot-note">
        <span>{squad.length} players · {abbr} · 2026 FIFA World Cup</span>
        <span>Source: ESPN</span>
      </div>
    </>
  );
}
