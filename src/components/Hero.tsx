'use client';

import { useState, useEffect } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { linescoreCells } from '@/lib/normalize/world-cup-normalizer';
import { Flag } from './Flag';

interface HeroProps {
  phase: 'pre' | 'live' | 'knockout';
  todayMatches: WorldCupMatchNormalized[];
  openingMatch?: WorldCupMatchNormalized;
}

const TOURNAMENT_START = new Date('2026-06-11T15:00:00-04:00').getTime();

function Countdown() {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    // Initialize after mount to avoid SSR/client hydration mismatch
    setDiff(TOURNAMENT_START - Date.now());
    const id = setInterval(() => setDiff(TOURNAMENT_START - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (diff === null) return (
    <div className="flex gap-[10px]">
      {['Days', 'Hours', 'Mins', 'Secs'].map(l => (
        <div key={l} className="text-center" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 'var(--r-sm)', padding: '12px 16px', minWidth: 72 }}>
          <div className="font-display font-black text-[34px] leading-none tnum">--</div>
          <div className="font-semibold text-[10px] tracking-[.12em] uppercase mt-1.5" style={{ color: 'rgba(255,255,255,.55)' }}>{l}</div>
        </div>
      ))}
    </div>
  );
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);

  return (
    <div className="flex gap-[10px]">
      {([
        { n: days, l: 'Days' },
        { n: hours, l: 'Hours' },
        { n: mins, l: 'Mins' },
        { n: secs, l: 'Secs' },
      ] as const).map(({ n, l }) => (
        <div
          key={l}
          className="text-center"
          style={{
            background: 'rgba(255,255,255,.07)',
            border: '1px solid rgba(255,255,255,.14)',
            borderRadius: 'var(--r-sm)',
            padding: '12px 16px',
            minWidth: 72,
          }}
        >
          <div className="font-display font-black text-[34px] leading-none tnum">
            {String(n).padStart(2, '0')}
          </div>
          <div
            className="font-semibold text-[10px] tracking-[.12em] uppercase mt-1.5"
            style={{ color: 'rgba(255,255,255,.55)' }}
          >
            {l}
          </div>
        </div>
      ))}
    </div>
  );
}

function OpeningMatchCard({ match }: { match: WorldCupMatchNormalized }) {
  const kickoff = new Date(match.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
        minWidth: 260,
      }}
    >
      <div
        className="font-bold text-[10px] tracking-[.14em] uppercase mb-2"
        style={{ color: 'rgba(255,255,255,.55)' }}
      >
        Opening Match
      </div>
      <div className="flex items-center gap-3 mb-2">
        <Flag logo={match.home.logo} abbr={match.home.abbr} size={24} />
        <span className="font-display font-bold text-[16px]">{match.home.abbr}</span>
        <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>vs</span>
        <span className="font-display font-bold text-[16px]">{match.away.abbr}</span>
        <Flag logo={match.away.logo} abbr={match.away.abbr} size={24} />
      </div>
      <div className="text-[12px]" style={{ color: 'rgba(255,255,255,.62)' }}>
        {kickoff}
        {match.broadcaster ? ` · ${match.broadcaster}` : ''}
      </div>
    </div>
  );
}

function LiveMatchTile({ match }: { match: WorldCupMatchNormalized }) {
  const homeScore = parseInt(match.home.score) || 0;
  const awayScore = parseInt(match.away.score) || 0;
  const awayLeads = awayScore > homeScore;
  const homeLeads = homeScore > awayScore;
  const isPost = match.status.state === 'post';
  const isPre = match.status.state === 'pre';
  const cells = linescoreCells(match);
  const kickoff = new Date(match.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const statusText = isPost ? 'FULL TIME' : isPre ? kickoff : match.status.isHalftime ? 'HALF TIME' : (match.status.clock || 'Live');

  const cols = '1fr 18px 18px 28px';

  const teamRow = (side: 'home' | 'away', leads: boolean, dim: boolean) => {
    const t = match[side];
    const [h1, h2, tot] = cells[side];
    return (
      <div
        className="grid items-center gap-x-[9px]"
        style={{ gridTemplateColumns: cols, opacity: dim ? 0.55 : 1, marginTop: side === 'away' ? 8 : 0 }}
      >
        <div className="flex items-center gap-[9px] min-w-0">
          <Flag logo={t.logo} abbr={t.abbr} size={24} />
          <span className="font-display font-bold text-[16px] text-white leading-none">{t.abbr}</span>
          {isPost && leads && (
            <span className="font-extrabold text-[9px] tracking-[.08em] uppercase whitespace-nowrap" style={{ color: '#7ee2a8' }}>● Winner</span>
          )}
        </div>
        <span className="font-display font-bold text-[14px] tnum text-center" style={{ color: 'rgba(255,255,255,.7)' }}>{h1}</span>
        <span className="font-display font-bold text-[14px] tnum text-center" style={{ color: 'rgba(255,255,255,.7)' }}>{h2}</span>
        <span className="font-display font-black text-[22px] tnum text-white text-center">{tot}</span>
      </div>
    );
  };

  return (
    <a
      href={`/match/${match.eventId}`}
      className="block no-underline"
      style={{
        background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 'var(--r-md)',
        padding: '14px 15px',
      }}
    >
      <div
        className="flex items-center justify-between mb-[11px] font-semibold text-[11.5px]"
        style={{ color: 'rgba(255,255,255,.6)' }}
      >
        <span className="tracking-[.04em] uppercase">{match.stage}</span>
        <span className="flex items-center gap-[6px]">
          {match.status.state === 'in' && !match.status.isHalftime && (
            <span className="pulse-dot on-dark" style={{ width: 6, height: 6 }} />
          )}
          <span style={match.status.isHalftime ? { color: '#7ee2a8' } : undefined}>{statusText}</span>
        </span>
      </div>
      <div className="grid gap-x-[9px] mb-[5px]" style={{ gridTemplateColumns: cols }}>
        <span />
        {['1H', '2H', 'T'].map(h => (
          <span key={h} className="text-center font-bold text-[9px] tracking-[.06em] uppercase" style={{ color: 'rgba(255,255,255,.4)' }}>{h}</span>
        ))}
      </div>
      {teamRow('home', homeLeads, awayLeads)}
      {teamRow('away', awayLeads, homeLeads)}
    </a>
  );
}

export function Hero({ phase, todayMatches, openingMatch }: HeroProps) {
  const liveMatches = todayMatches.filter(m => m.status.state === 'in');
  // The full day's slate — live, upcoming, and finished — in chronological
  // (kickoff) order, left to right.
  const displayMatches = [...todayMatches].sort((a, b) => a.date.localeCompare(b.date));
  const liveCount = liveMatches.length;

  return (
    <div
      className="relative overflow-hidden text-white"
      style={{
        background: 'var(--navy)',
        borderRadius: 'var(--r-lg)',
        margin: '20px 0 26px',
        boxShadow: 'var(--sh-2)',
      }}
    >
      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(1200px 400px at 85% -10%, rgba(255,255,255,.10), transparent 60%),
            radial-gradient(800px 500px at 0% 120%, rgba(22,163,74,.16), transparent 55%)
          `,
        }}
      />

      <div className="relative" style={{ padding: '26px 28px' }}>
        {/* Top row: kicker + link */}
        <div className="flex items-center justify-between gap-[14px] mb-[18px]">
          <div
            className="flex items-center gap-[9px] font-bold text-[12px] tracking-[.14em] uppercase whitespace-nowrap"
            style={{ color: 'rgba(255,255,255,.62)' }}
          >
            {phase === 'pre' && 'Kicks off in'}
            {phase === 'live' && (
              <>
                {liveCount > 0 && <span className="pulse-dot on-dark" />}
                {liveCount > 0
                  ? `${liveCount} ${liveCount === 1 ? 'match' : 'matches'} live now`
                  : 'Today\'s matches'}
              </>
            )}
            {phase === 'knockout' && (
              <>
                {liveCount > 0 && <span className="pulse-dot on-dark" />}
                {`${liveCount > 0 ? `${liveCount} live · ` : ''}${todayMatches[0]?.stage ?? 'Knockout'}`}
              </>
            )}
          </div>
          <a
            href="/schedule"
            className="font-semibold text-[13px] whitespace-nowrap no-underline"
            style={{ color: 'rgba(255,255,255,.8)' }}
          >
            Full schedule →
          </a>
        </div>

        {/* Phase-specific body */}
        {phase === 'pre' && (
          <div className="flex items-end gap-6 flex-wrap">
            <Countdown />
            {openingMatch && <OpeningMatchCard match={openingMatch} />}
          </div>
        )}

        {(phase === 'live' || phase === 'knockout') && displayMatches.length > 0 && (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
          >
            {displayMatches.slice(0, 6).map(match => (
              <LiveMatchTile key={match.eventId} match={match} />
            ))}
          </div>
        )}

        {(phase === 'live' || phase === 'knockout') && displayMatches.length === 0 && (
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,.62)' }}>
            No matches scheduled today. Check the schedule below.
          </p>
        )}
      </div>
    </div>
  );
}
