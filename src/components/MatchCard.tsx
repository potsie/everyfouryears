'use client';

import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { linescoreCells } from '@/lib/normalize/world-cup-normalizer';
import { ShootoutStrip } from '@/components/ShootoutStrip';
import { useXg } from '@/contexts/xg-context';
import { Flag } from './Flag';

interface MatchCardProps {
  match: WorldCupMatchNormalized;
  // teamId → group letter fallback for scoreboard-fed matches, whose
  // groupLetter is empty (ESPN's scoreboard omits group info).
  teamGroupLetter?: Map<string, string>;
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

function stageLabel(match: WorldCupMatchNormalized, fallbackLetter?: string): string {
  const letter = match.groupLetter || fallbackLetter;
  if (match.seasonTypeId === 1 && letter) {
    return `GROUP STAGE (${letter})`;
  }
  return match.stage.toUpperCase();
}

export function MatchCard({ match, teamGroupLetter }: MatchCardProps) {
  const isLive = match.status.state === 'in';
  const isPost = match.status.state === 'post';
  const xg = useXg(match.eventId);
  const isPre = match.status.state === 'pre';

  const homeScore = parseInt(match.home.score) || 0;
  const awayScore = parseInt(match.away.score) || 0;
  const homeDim = !isPre && awayScore > homeScore;
  const awayDim = !isPre && homeScore > awayScore;
  const cells = linescoreCells(match);
  const hasShootout = !!match.home.shootout && !!match.away.shootout;
  // A shootout inserts a PK column between the team name and the 1H/2H/T columns.
  const gridCols = hasShootout ? 'auto 1fr 26px 22px 22px 30px' : 'auto 1fr 22px 22px 30px';

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
          <span style={{ letterSpacing: '.04em' }}>
            {stageLabel(
              match,
              teamGroupLetter?.get(match.home.id) ?? teamGroupLetter?.get(match.away.id),
            )}
          </span>

          {isLive && match.status.isDelayed && (
            <span className="flex items-center gap-[6px]" style={{ color: '#f5b945' }}>
              {/* Static dot — play stopped, clock frozen. */}
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5b945' }} />
              DELAYED{match.status.clock ? ` · ${match.status.clock}` : ''}
            </span>
          )}
          {isLive && !match.status.isDelayed && (
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
          <div className="grid items-center gap-x-[10px] mb-[6px]" style={{ gridTemplateColumns: gridCols }}>
            <span /><span />
            {(hasShootout ? ['PK', '1H', '2H', 'T'] : ['1H', '2H', 'T']).map(h => (
              <span key={h} className="text-center text-[9.5px] font-bold uppercase tracking-wider" style={{ color: h === 'PK' ? '#16a34a' : 'var(--ink-3)' }}>{h}</span>
            ))}
          </div>
          {(['home', 'away'] as const).map((side, i) => {
            const t = match[side];
            const dim = side === 'home' ? homeDim : awayDim;
            const [h1, h2, tot] = cells[side];
            const sideXg = isPost && xg ? (side === 'home' ? xg.home : xg.away) : undefined;
            return (
              <div
                key={side}
                className="grid items-center gap-x-[10px]"
                style={{ gridTemplateColumns: gridCols, opacity: dim ? 0.62 : 1, marginTop: i === 1 ? 10 : 0 }}
              >
                <Flag logo={t.logo} abbr={t.abbr} size={32} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-[14px]">
                    <span className="font-display font-bold text-[17px] leading-tight">{t.abbr}</span>
                    {sideXg !== undefined && (
                      <span className="text-[11px] font-bold tnum" style={{ color: 'var(--ink-3)' }}>xG {sideXg.toFixed(2)}</span>
                    )}
                  </div>
                  <span className="text-[12px] font-semibold block" style={{ color: 'var(--ink-3)' }}>{t.name}</span>
                </div>
                {hasShootout && (
                  <span className="font-display font-black text-[15px] tnum text-center" style={{ color: '#16a34a' }}>{t.shootout!.score}</span>
                )}
                <span className="font-display font-bold text-[15px] tnum text-center" style={{ color: 'var(--ink-3)' }}>{h1}</span>
                <span className="font-display font-bold text-[15px] tnum text-center" style={{ color: 'var(--ink-3)' }}>{h2}</span>
                <span className="font-display font-black text-[24px] tnum text-center" style={{ letterSpacing: '.02em' }}>{tot}</span>
              </div>
            );
          })}
          {hasShootout && (
            <ShootoutStrip
              homeAbbr={match.home.abbr}
              awayAbbr={match.away.abbr}
              home={match.home.shootout!}
              away={match.away.shootout!}
              tone="light"
            />
          )}
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
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                    {g.scorer}{g.ownGoal ? ' (OG)' : ''}
                  </span>
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
