'use client';

import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { MatchCard } from '@/components/MatchCard';

interface MatchGridProps {
  matches: WorldCupMatchNormalized[];
  selectedDate: string; // YYYYMMDD
}

export function MatchGrid({ matches, selectedDate }: MatchGridProps) {
  const filteredMatches = matches.filter(match => {
    if (!match.date) return false;
    const matchDate = new Date(match.date).toISOString().slice(0, 10).replace(/-/g, '');
    return matchDate === selectedDate;
  });

  const liveCount = filteredMatches.filter(m => m.status.state === 'in').length;

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        className="flex items-center justify-between pb-2"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="flex items-center gap-2">
          <h2
            className="text-[11px] font-black uppercase tracking-widest m-0"
            style={{ color: 'var(--ink-3)' }}
          >
            Matches
          </h2>
          {liveCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--live-soft)',
                color: 'var(--live-ink)',
                border: '1px solid var(--live)',
              }}
            >
              {liveCount} LIVE
            </span>
          )}
        </div>
        <span className="text-[12px] font-bold" style={{ color: 'var(--ink-3)' }}>
          {filteredMatches.length} fixtures
        </span>
      </div>

      {filteredMatches.length === 0 ? (
        <div
          className="text-center py-12 text-[14px]"
          style={{ color: 'var(--ink-3)' }}
        >
          No matches scheduled for this date.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[13px]">
          {filteredMatches.map(match => (
            <MatchCard key={match.eventId} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
