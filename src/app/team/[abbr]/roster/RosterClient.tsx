'use client';

import { useState } from 'react';
import { Shot } from '@/components/Shot';

interface SquadPlayer {
  id: string;
  name: string;
  pos: string;
  posCode: string;
  jerseyNum: number | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  displayHeight: string | null;
  preferredFoot: string | null;
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

function PCard({ p }: { p: SquadPlayer }) {
  return (
    <div className="pcard">
      <Shot size={50} name={p.name} />
      <div className="pc-info">
        <div className="pc-name">{p.name}</div>
        <div className="pc-club">
          <span>{p.posCode}</span>
          {p.jerseyNum != null && (
            <span style={{ color: 'var(--ink-3)' }}>#{p.jerseyNum}</span>
          )}
        </div>
        <div className="pc-meta">
          {p.age != null && <span>Age <b className="tnum">{p.age}</b></span>}
          {p.displayHeight && <span>{p.displayHeight}</span>}
          {p.preferredFoot && <span>{p.preferredFoot[0]}</span>}
        </div>
      </div>
    </div>
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
                {rows.map(p => <PCard key={p.id} p={p} />)}
              </div>
            </section>
          );
        })
      ) : (
        <section className="pos-group">
          <div className="squad-grid">
            {[...squad]
              .sort((a, b) => (a.jerseyNum ?? 99) - (b.jerseyNum ?? 99))
              .map(p => <PCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      <div className="foot-note">
        <span>{squad.length} players · {abbr} · 2026 FIFA World Cup</span>
        <span>Source: FIFA</span>
      </div>
    </>
  );
}
