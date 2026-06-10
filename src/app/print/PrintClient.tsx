'use client';

import { useState } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { Editorial } from './looks/Editorial';
import { WallChart } from './looks/WallChart';
import { Calendar } from './looks/Calendar';
import './print.css';

type Look = 'editorial' | 'wallchart' | 'calendar';

const LOOKS: { id: Look; label: string }[] = [
  { id: 'wallchart', label: 'Wall Chart' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'calendar',  label: 'Calendar'  },
];

interface Props {
  matches: WorldCupMatchNormalized[];
}

export function PrintClient({ matches }: Props) {
  const [look, setLook] = useState<Look>('editorial');

  function handlePrint() {
    document.body.className = `look-${look}`;
    window.print();
    document.body.className = '';
  }

  return (
    <>
      <div className="print-chrome">
        <div className="print-chrome-title">
          <h1>Schedule</h1>
          <p>2026 FIFA World Cup · 104 matches · all times in your local timezone</p>
        </div>
        <div className="print-switcher" role="group" aria-label="Schedule look">
          {LOOKS.map(({ id, label }) => (
            <button
              key={id}
              className={`print-switcher-btn${look === id ? ' active' : ''}`}
              onClick={() => setLook(id)}
              aria-pressed={look === id}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="print-btn" onClick={handlePrint}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print / Save PDF
        </button>
      </div>

      {look === 'editorial' && <Editorial matches={matches} />}
      {look === 'wallchart' && <WallChart  matches={matches} />}
      {look === 'calendar'  && <Calendar   matches={matches} />}
    </>
  );
}
