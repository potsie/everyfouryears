'use client';

import { useEffect, useRef } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { isSeedPlaceholder, fmtTime } from './shared';
import { VENUES } from '@/lib/venues';

interface Props { matches: WorldCupMatchNormalized[]; }

const VENUE_COL_WIDTH = 220;
const POSTER_W = 3300;
const POSTER_H = 1660;
const HEADER_H = 150;
const MONTH_H = 30;
const DCOLS_H = 58;
const STAGE_H = 30;
const TOP_H = MONTH_H + DCOLS_H + STAGE_H;
const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

const VENUE_COUNTRY: Record<string, 'us' | 'mx' | 'ca'> = {
  'BC Place': 'ca', 'BMO Field': 'ca',
  'Estadio Banorte': 'mx', 'Estadio Akron': 'mx', 'Estadio BBVA': 'mx',
};

const STAGE_BANDS = [
  { label: 'Group Stage', ids: [1], ko: false },
  { label: 'Round of 32', ids: [2], ko: true },
  { label: 'Round of 16', ids: [3], ko: true },
  { label: 'Quarters', ids: [4], ko: true },
  { label: 'Semis', ids: [5], ko: true },
  { label: 'Finals', ids: [6, 7], ko: true },
];

// Venue name aliases from ESPN → our venues.ts names
const ESPNALIAS: Record<string, string> = {
  'GEHA Field at Arrowhead Stadium': 'Arrowhead Stadium',
  'Estadio Azteca': 'Estadio Banorte',
};

function buildDays(): Date[] {
  const days: Date[] = [];
  const d = new Date(2026, 5, 10); // start one day early to catch late-UTC games that land Jun 11 locally
  const end = new Date(2026, 6, 20);
  while (d <= end) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

function localDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD in browser timezone
}

export function WallChart({ matches }: Props) {
  const scalerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fit() {
      if (!scalerRef.current) return;
      const s = Math.min(window.innerWidth / POSTER_W, (window.innerHeight - 80) / POSTER_H);
      scalerRef.current.style.transform = `scale(${s})`;
      const el = scalerRef.current.parentElement;
      if (el) el.style.height = `${POSTER_H * s}px`;
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const days = buildDays();
  const matchDates = new Set(matches.map(m => localDateKey(m.date)));
  const gridW = POSTER_W - VENUE_COL_WIDTH;

  const koMatchDates = new Set(matches.filter(m => m.seasonTypeId > 1).map(m => localDateKey(m.date)));
  const weights = days.map(d => {
    const key = d.toLocaleDateString('en-CA');
    if (koMatchDates.has(key)) return 2.2;
    if (matchDates.has(key)) return 1;
    return 0.3;
  });
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map(w => (w * gridW) / weightSum);
  const colLefts: number[] = [];
  let acc = VENUE_COL_WIDTH;
  colWidths.forEach(w => { colLefts.push(acc); acc += w; });

  const matchIdx: Record<string, WorldCupMatchNormalized> = {};
  matches.forEach(m => {
    const venueName = ESPNALIAS[m.venue] ?? m.venue;
    matchIdx[`${venueName}|${localDateKey(m.date)}`] = m;
  });

  const rowH = (POSTER_H - HEADER_H - TOP_H) / VENUES.length;

  type MonthSpan = { month: string; width: number };
  const monthSpans: MonthSpan[] = [];
  let runStart = 0;
  for (let i = 0; i <= days.length; i++) {
    if (i === days.length || days[i].getMonth() !== days[runStart].getMonth()) {
      const left = colLefts[runStart];
      const right = colLefts[i - 1] + colWidths[i - 1];
      monthSpans.push({ month: MONTHS[days[runStart].getMonth() + 1], width: right - left });
      runStart = i;
    }
  }

  return (
    <div className="print-wallchart" style={{ background: '#05070d', display: 'flex', justifyContent: 'center' }}>
      <div ref={scalerRef} className="wc-scaler" style={{ transformOrigin: 'top center' }}>
        <div className="wc-poster">
          <div className="wc-top">
            <h1 className="wc-title"><span className="yr">2026</span> World&nbsp;Cup</h1>
            <div className="wc-hosts">Canada <span className="dim">·</span> Mexico <span className="dim">·</span> USA</div>
            <div style={{ flex: 1 }} />
            <div className="wc-dates">
              <b style={{ color: '#f3f5fb', fontWeight: 600 }}>48 TEAMS · 104 MATCHES · 16 CITIES</b><br />
              Jun 11 – Jul 19, 2026
            </div>
          </div>

          <div className="wc-grid">
            {/* Top header row */}
            <div style={{ display: 'flex' }}>
              <div style={{ width: VENUE_COL_WIDTH, background: '#0a0e1a', borderRight: '2px solid oklch(0.80 0.13 78)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                {/* Month strip */}
                <div style={{ display: 'flex', height: MONTH_H }}>
                  {monthSpans.map((ms, i) => (
                    <div key={i} className="wc-mlabel" style={{ width: ms.width }}>{ms.month}</div>
                  ))}
                </div>
                {/* Day columns */}
                <div style={{ display: 'flex', height: DCOLS_H, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
                  {days.map((d, i) => {
                    const key = d.toLocaleDateString('en-CA');
                    const off = !matchDates.has(key);
                    return (
                      <div key={i} className={`wc-dc-col${off ? ' off' : ''}`} style={{ width: colWidths[i] }}>
                        <span className="wc-dc-dow">{DOWS[d.getDay()]}</span>
                        <span className="wc-dc-dnum">{d.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Stage band */}
                <div style={{ height: STAGE_H, position: 'relative', borderBottom: '2px solid oklch(0.80 0.13 78)' }}>
                  {STAGE_BANDS.map(({ label, ids, ko }) => {
                    const stageMatches = matches.filter(m => ids.includes(m.seasonTypeId));
                    if (!stageMatches.length) return null;
                    const dayIdxes = stageMatches.map(m => days.findIndex(d => d.toLocaleDateString('en-CA') === localDateKey(m.date)));
                    const lo = Math.min(...dayIdxes);
                    const hi = Math.max(...dayIdxes);
                    if (lo < 0) return null;
                    const left = colLefts[lo] - VENUE_COL_WIDTH;
                    const right = colLefts[hi] + colWidths[hi] - VENUE_COL_WIDTH;
                    return (
                      <div key={label} className={`wc-scol${ko ? ' ko' : ''}`} style={{ left, width: right - left }}>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Venue rows */}
            {VENUES.map(v => {
              const co = VENUE_COUNTRY[v.name] ?? 'us';
              return (
                <div key={v.slug} style={{ display: 'flex', height: rowH }}>
                  <div className={`wc-vcell ${co}`} style={{ width: VENUE_COL_WIDTH, height: rowH }}>
                    <div className="wc-vcity">{v.city}</div>
                    <div className="wc-stadium">{v.name}</div>
                  </div>
                  {days.map((d, i) => {
                    const dayKey = d.toLocaleDateString('en-CA');
                    const off = !matchDates.has(dayKey);
                    const m = matchIdx[`${v.name}|${dayKey}`];
                    const ko = m && m.seasonTypeId > 1;
                    const isFin = m && (m.seasonTypeId === 6 || m.seasonTypeId === 7);
                    return (
                      <div key={i} className={`wc-cell${off ? ' off' : ` ${co}`}`} style={{ width: colWidths[i], height: rowH }}>
                        {m && (
                          ko ? (
                            <div className={`wc-chip ko${isFin ? ' fin' : ''}`}>
                              <div className="wc-chip-round">{m.stage}</div>
                              <div className="wc-chip-seed">
                                {m.home.abbr}
                                <span className="v">v</span>
                                {m.away.abbr}
                              </div>
                              <div className="wc-chip-info">{fmtTime(m.date)}</div>
                            </div>
                          ) : (
                            <div className="wc-chip">
                              <div className="wc-chip-flags">
                                {m.home.logo && !isSeedPlaceholder(m.home.abbr) && <img src={m.home.logo} alt={m.home.abbr} />}
                                {m.away.logo && !isSeedPlaceholder(m.away.abbr) && <img src={m.away.logo} alt={m.away.abbr} />}
                              </div>
                              <div className="wc-chip-teams">
                                {m.home.abbr}<span className="v">v</span>{m.away.abbr}
                              </div>
                              <div className="wc-chip-info">
                                {m.groupLetter && <span className="g">GRP {m.groupLetter} · </span>}
                                {fmtTime(m.date)}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
