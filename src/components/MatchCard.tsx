'use client';

import { useState } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { Flag } from './Flag';
import { LiveStatsDrawer } from './LiveStatsDrawer';

interface MatchCardProps {
  match: WorldCupMatchNormalized;
}

function formatKickoff(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function stageLabel(match: WorldCupMatchNormalized): string {
  if (match.seasonTypeId === 1 && match.groupLetter) {
    return `GROUP ${match.groupLetter}`;
  }
  return match.stage.toUpperCase();
}

export function MatchCard({ match }: MatchCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLive = match.status.state === 'in';
  const isPost = match.status.state === 'post';
  const isPre = match.status.state === 'pre';

  const homeScore = parseInt(match.home.score) || 0;
  const awayScore = parseInt(match.away.score) || 0;
  const homeDim = !isPre && awayScore > homeScore;
  const awayDim = !isPre && homeScore > awayScore;

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        className="cursor-pointer"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--sh-1)',
          overflow: 'hidden',
          transition: 'box-shadow .14s, transform .08s, border-color .14s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-2)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-2)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-1)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)';
          (e.currentTarget as HTMLElement).style.transform = '';
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-[14px] py-[9px] text-[11.5px] font-bold"
          style={{
            background: 'var(--inset)',
            borderBottom: '1px solid var(--line)',
            color: 'var(--ink-2)',
          }}
        >
          <span style={{ letterSpacing: '.04em' }}>{stageLabel(match)}</span>

          {isLive && (
            <span className="flex items-center gap-[6px]" style={{ color: 'var(--live-ink)' }}>
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              {match.status.clock}
            </span>
          )}
          {isPost && (
            <span style={{ color: 'var(--ink-3)' }}>FULL TIME</span>
          )}
          {isPre && (
            <span>{formatKickoff(match.date)}</span>
          )}
        </div>

        {/* Body — two team rows */}
        <div className="px-[16px] py-[14px]">
          {/* Home team */}
          <div
            className="flex items-center gap-3"
            style={{ opacity: homeDim ? 0.62 : 1 }}
          >
            <Flag logo={match.home.logo} abbr={match.home.abbr} size={32} />
            <div className="flex-1 min-w-0">
              <span className="font-display font-bold text-[17px] block">{match.home.abbr}</span>
              <span className="text-[12px] font-semibold block" style={{ color: 'var(--ink-3)' }}>
                {match.home.name}
              </span>
            </div>
            <span className="font-display font-black text-[24px] tnum" style={{ letterSpacing: '.02em' }}>
              {isPre ? '–' : (match.home.score || '0')}
            </span>
          </div>

          {/* Away team */}
          <div
            className="flex items-center gap-3 mt-[10px]"
            style={{ opacity: awayDim ? 0.62 : 1 }}
          >
            <Flag logo={match.away.logo} abbr={match.away.abbr} size={32} />
            <div className="flex-1 min-w-0">
              <span className="font-display font-bold text-[17px] block">{match.away.abbr}</span>
              <span className="text-[12px] font-semibold block" style={{ color: 'var(--ink-3)' }}>
                {match.away.name}
              </span>
            </div>
            <span className="font-display font-black text-[24px] tnum" style={{ letterSpacing: '.02em' }}>
              {isPre ? '–' : (match.away.score || '0')}
            </span>
          </div>
        </div>

        {/* Scorer lines */}
        {(match.home.goals.length > 0 || match.away.goals.length > 0) && (
          <div
            className="px-[16px] pb-[13px] flex flex-col gap-[3px]"
          >
            {[...match.home.goals.map(g => ({ ...g, team: match.home.abbr })),
              ...match.away.goals.map(g => ({ ...g, team: match.away.abbr }))]
              .sort((a, b) => parseInt(a.minute) - parseInt(b.minute))
              .map((g, i) => (
                <div
                  key={i}
                  className="flex items-center gap-[7px] text-[12px]"
                  style={{ color: 'var(--ink-2)' }}
                >
                  <span>⚽</span>
                  <span>{g.minute}</span>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>{g.scorer}</span>
                  <span style={{ color: 'var(--ink-3)' }}>· {g.team}</span>
                </div>
              ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-[10px] px-[16px] py-[10px] text-[12px]"
          style={{ borderTop: '1px solid var(--line)', color: 'var(--ink-2)' }}
        >
          <div className="flex items-center gap-[6px] min-w-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">
              {match.venue || 'TBD'}
              {match.venueCity ? ` · ${match.venueCity}` : ''}
            </span>
          </div>
          {match.broadcaster && (
            <span
              className="font-bold text-[11px] flex-shrink-0"
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: 'var(--inset)',
                border: '1px solid var(--line)',
                letterSpacing: '.04em',
              }}
            >
              {match.broadcaster}
            </span>
          )}
        </div>
      </div>

      <LiveStatsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        match={match}
      />
    </>
  );
}
