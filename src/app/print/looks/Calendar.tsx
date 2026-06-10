'use client';

import { useEffect, useRef } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { isSeedPlaceholder, fmtTime, groupByLocalDate } from './shared';
import { VENUES } from '@/lib/venues';

interface Props { matches: WorldCupMatchNormalized[]; }

const POSTER_W = 1400;
const POSTER_H = 2160;
const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildCalDays(): Date[] {
  const days: Date[] = [];
  const d = new Date(2026, 5, 7);
  const end = new Date(2026, 6, 25);
  while (d <= end) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

const T_START = new Date(2026, 5, 11);
const T_END   = new Date(2026, 6, 19);

export function Calendar({ matches }: Props) {
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

  const byDate = groupByLocalDate(matches);
  const calDays = buildCalDays();

  return (
    <div className="print-calendar" style={{ background: '#0e1426', display: 'flex', justifyContent: 'center' }}>
      <div ref={scalerRef} className="cal-scaler" style={{ transformOrigin: 'top center' }}>
        <div className="cal-poster">
          <div className="cal-hd">
            <div className="cal-eyebrow">FIFA World Cup 26 · June 11 – July 19</div>
            <h1 className="cal-title">World&nbsp;Cup<br /><span className="outline">2026</span> Schedule</h1>
            <div className="cal-hd-row">
              <div className="cal-hosts">
                <span className="c">Canada</span>
                <span className="sep">×</span>
                <span className="m">Mexico</span>
                <span className="sep">×</span>
                <span className="u">USA</span>
              </div>
              <div className="cal-stat">
                <b>48 TEAMS · 104 MATCHES</b>
                16 host cities · 39 days
              </div>
            </div>
          </div>

          <div className="cal-dow-row">
            {DOWS.map((d, i) => (
              <div key={d} className={`cal-dow${i === 0 || i === 6 ? ' we' : ''}`}>{d}</div>
            ))}
          </div>

          <div className="cal-grid">
            {calDays.map(d => {
              const inT = d >= T_START && d <= T_END;
              const we = d.getDay() === 0 || d.getDay() === 6;
              const key = d.toLocaleDateString('en-CA');
              const dayMatches = byDate.get(key) ?? [];
              const showMon = d.getDate() === 1 || (d.getMonth() === 5 && d.getDate() === 11);

              let cls = 'cal-cell';
              if (we) cls += ' we';
              if (!inT) cls += ' empty';

              return (
                <div key={key} className={cls}>
                  <div className="cal-cell-hd">
                    <span className="cal-dnum">{d.getDate()}</span>
                    {inT && showMon && (
                      <span className="cal-dmon">{d.toLocaleDateString([], { month: 'short' })}</span>
                    )}
                    {inT && !dayMatches.length && <span className="cal-rest">Rest</span>}
                  </div>
                  {dayMatches.length > 0 && (
                    <div className="cal-mlist">
                      {dayMatches.map(m => {
                        const ko = m.seasonTypeId > 1;
                        const homeIsSeed = isSeedPlaceholder(m.home.abbr);
                        const awayIsSeed = isSeedPlaceholder(m.away.abbr);
                        return (
                          <div key={m.eventId} className={`cal-chip${ko ? ' ko' : ''}`}>
                            {ko && (
                              <div className="cal-chip-stg">{m.stage}</div>
                            )}
                            <div className="cal-chip-flags">
                              {!homeIsSeed && m.home.logo && <img src={m.home.logo} alt={m.home.abbr} />}
                              {!awayIsSeed && m.away.logo && <img src={m.away.logo} alt={m.away.abbr} />}
                            </div>
                            <div className="cal-chip-teams">
                              {m.home.abbr}<span className="v">v</span>{m.away.abbr}
                            </div>
                            <div className="cal-chip-time">{fmtTime(m.date)}</div>
                            <div className="cal-chip-meta">
                              {ko ? m.venueCity : `GRP ${m.groupLetter} · ${m.venueCity}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="cal-foot">
            <h3>The 16 Host Cities</h3>
            <div className="cal-vrow">
              {VENUES.map(v => (
                <div key={v.slug} className="cal-vc">
                  <div>
                    <div className="cal-vc-city">{v.city}</div>
                    <div className="cal-vc-stad">{v.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
