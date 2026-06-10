'use client';

import { useState, useEffect } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
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
          {match.status.state === 'in' && (
            <span className="pulse-dot on-dark" style={{ width: 6, height: 6 }} />
          )}
          {match.status.clock || 'FT'}
        </span>
      </div>
      <div
        className="flex items-center justify-between gap-[10px]"
        style={{ opacity: awayLeads ? 0.55 : 1 }}
      >
        <div className="flex items-center gap-[9px]">
          <Flag logo={match.home.logo} abbr={match.home.abbr} size={24} />
          <span className="font-display font-bold text-[16px] text-white">{match.home.abbr}</span>
        </div>
        <span className="font-display font-black text-[26px] tnum text-white" style={{ letterSpacing: '.02em' }}>
          {match.home.score || '0'}
        </span>
      </div>
      <div
        className="flex items-center justify-between gap-[10px] mt-2"
        style={{ opacity: homeLeads ? 0.55 : 1 }}
      >
        <div className="flex items-center gap-[9px]">
          <Flag logo={match.away.logo} abbr={match.away.abbr} size={24} />
          <span className="font-display font-bold text-[16px] text-white">{match.away.abbr}</span>
        </div>
        <span className="font-display font-black text-[26px] tnum text-white" style={{ letterSpacing: '.02em' }}>
          {match.away.score || '0'}
        </span>
      </div>
    </a>
  );
}

export function Hero({ phase, todayMatches, openingMatch }: HeroProps) {
  const liveMatches = todayMatches.filter(m => m.status.state === 'in');
  const displayMatches = todayMatches.filter(
    m => m.status.state === 'in' || m.status.state === 'post',
  );
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
            No matches in progress. Check the schedule below.
          </p>
        )}
      </div>
    </div>
  );
}
