'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { LocalTime } from '@/components/LocalTime';
import { isoToDateKey } from '@/lib/dates';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function shortLabel(dateKey: string): string {
  const [, mo, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(parseInt(dateKey.slice(0, 4)), mo - 1, d, 12));
  return `${DAYS_SHORT[dt.getUTCDay()]}, ${MONTHS_SHORT[dt.getUTCMonth()]} ${d}`;
}

function FixtureRow({ m }: { m: WorldCupMatchNormalized }) {
  const post = m.status.state === 'post';
  const hs = parseInt(m.home.score || '0', 10);
  const as_ = parseInt(m.away.score || '0', 10);
  const loseHome = post && m.home.score !== '' && hs < as_;
  const loseAway = post && m.away.score !== '' && as_ < hs;
  const winHome = post && m.home.score !== '' && hs > as_;
  const winAway = post && m.away.score !== '' && as_ > hs;

  return (
    <Link
      href={`/match/${m.eventId}`}
      className="srow"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {/* Status */}
      {m.status.state === 'in' ? (
        <span className="s-status s-live">
          {m.status.isHalftime ? <span style={{ color: 'var(--live-ink)', fontWeight: 700 }}>HALF TIME</span> : <><span className="pulse-dot" />{m.status.clock}</>}
        </span>
      ) : m.status.state === 'post' ? (
        <span className="s-status s-ft">FULL TIME</span>
      ) : (
        <span className="s-status s-time tnum">
          <LocalTime iso={m.date} />
        </span>
      )}

      {/* Home (left) */}
      <span className={`s-team a${loseHome ? ' lose' : ''}`}>
        {winHome && <span className="s-win" style={{ color: 'var(--live-ink)', fontWeight: 800 }}>▸</span>}
        <span className="s-code">{m.home.abbr}</span>
        <Flag logo={m.home.logo} abbr={m.home.abbr} size={22} />
      </span>

      {/* Score */}
      {m.status.state === 'pre' ? (
        <span className="s-score pre">vs</span>
      ) : (
        <span className="s-score tnum">
          {hs}<span className="x">–</span>{as_}
        </span>
      )}

      {/* Away (right) */}
      <span className={`s-team b${loseAway ? ' lose' : ''}`}>
        <Flag logo={m.away.logo} abbr={m.away.abbr} size={22} />
        <span className="s-code">{m.away.abbr}</span>
        {winAway && <span className="s-win" style={{ color: 'var(--live-ink)', fontWeight: 800 }}>◂</span>}
      </span>

      {/* Meta */}
      <span className="s-meta">
        <span className="s-ven">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span>{m.venue} · {m.venueCity}</span>
        </span>
      </span>
      <span className="s-tv tv">{m.broadcaster}</span>
    </Link>
  );
}

interface MatchdayGroup {
  md: number;
  matches: WorldCupMatchNormalized[];
}

// Renders each matchday's fixtures, splitting a matchday across separate day
// headers when its matches fall on different calendar days. Day bucketing and
// labels use the viewer's local timezone: seeded with Eastern for a clean SSR/
// first paint (no hydration mismatch), then re-bucketed on mount — matching the
// local kickoff times so e.g. a 00:00-Sunday-Eastern match shows under Saturday
// for a Central viewer.
export function GroupFixtures({ matchdays }: { matchdays: MatchdayGroup[] }) {
  const [timeZone, setTimeZone] = useState<string | undefined>('America/New_York');
  useEffect(() => { setTimeZone(undefined); }, []);

  return (
    <>
      {matchdays.filter(({ matches: ms }) => ms.length > 0).map(({ md, matches: ms }) => {
        const byDate: { dateKey: string; label: string; matches: WorldCupMatchNormalized[] }[] = [];
        for (const m of ms) {
          const dk = isoToDateKey(m.date, timeZone);
          const last = byDate[byDate.length - 1];
          if (last && last.dateKey === dk) { last.matches.push(m); }
          else { byDate.push({ dateKey: dk, label: shortLabel(dk), matches: [m] }); }
        }
        const singleDay = byDate.length === 1;
        return (
          <div className="gd-md" key={md}>
            <div className="md-label">
              Matchday {md}
              {singleDay && <span className="d">· {byDate[0].label}</span>}
            </div>
            {byDate.map(({ dateKey, label, matches: dayMs }) => (
              <div key={dateKey}>
                {!singleDay && <div className="md-day-sub">{label}</div>}
                <div className="slist">
                  {dayMs.map(m => <FixtureRow key={m.eventId} m={m} />)}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
