'use client';

import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { linescoreCells } from '@/lib/normalize/world-cup-normalizer';
import { Flag } from './Flag';

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
  const isLive = match.status.state === 'in';
  const isPost = match.status.state === 'post';
  const isPre = match.status.state === 'pre';

  const homeScore = parseInt(match.home.score) || 0;
  const awayScore = parseInt(match.away.score) || 0;
  const homeDim = !isPre && awayScore > homeScore;
  const awayDim = !isPre && homeScore > awayScore;
  const cells = linescoreCells(match);

  return (
    <a
      href={`/match/${match.eventId}`}
      className="block no-underline cursor-pointer"
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
            background: 'var(--navy)',
            color: 'rgba(255,255,255,.7)',
          }}
        >
          <span style={{ letterSpacing: '.04em' }}>{stageLabel(match)}</span>

          {isLive && (
            <span className="flex items-center gap-[6px]" style={{ color: '#7ee2a8' }}>
              {!match.status.isHalftime && <span className="pulse-dot on-dark" style={{ width: 6, height: 6 }} />}
              {match.status.isHalftime ? 'HALF TIME' : match.status.clock}
            </span>
          )}
          {isPost && (
            <span style={{ color: 'rgba(255,255,255,.45)' }}>FULL TIME</span>
          )}
          {isPre && (
            <span>{formatKickoff(match.date)}</span>
          )}
        </div>

        {/* Body — two team rows with the 1H/2H/T linescore */}
        <div className="px-[16px] py-[14px]">
          <div className="grid items-center gap-x-[10px] mb-[6px]" style={{ gridTemplateColumns: 'auto 1fr 22px 22px 30px' }}>
            <span /><span />
            {['1H', '2H', 'T'].map(h => (
              <span key={h} className="text-center text-[9.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{h}</span>
            ))}
          </div>
          {(['home', 'away'] as const).map((side, i) => {
            const t = match[side];
            const dim = side === 'home' ? homeDim : awayDim;
            const [h1, h2, tot] = cells[side];
            return (
              <div
                key={side}
                className="grid items-center gap-x-[10px]"
                style={{ gridTemplateColumns: 'auto 1fr 22px 22px 30px', opacity: dim ? 0.62 : 1, marginTop: i === 1 ? 10 : 0 }}
              >
                <Flag logo={t.logo} abbr={t.abbr} size={32} />
                <div className="min-w-0">
                  <span className="font-display font-bold text-[17px] block leading-tight">{t.abbr}</span>
                  <span className="text-[12px] font-semibold block" style={{ color: 'var(--ink-3)' }}>{t.name}</span>
                </div>
                <span className="font-display font-bold text-[15px] tnum text-center" style={{ color: 'var(--ink-3)' }}>{h1}</span>
                <span className="font-display font-bold text-[15px] tnum text-center" style={{ color: 'var(--ink-3)' }}>{h2}</span>
                <span className="font-display font-black text-[24px] tnum text-center" style={{ letterSpacing: '.02em' }}>{tot}</span>
              </div>
            );
          })}
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
    </a>
  );
}
