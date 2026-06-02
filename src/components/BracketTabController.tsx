'use client';

import { useState, useEffect } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { MatchCard } from '@/components/MatchCard';

interface ControllerProps {
  initialMatches: WorldCupMatchNormalized[];
}

const ROUNDS = [
  { id: 'R32', label: 'Round of 32', stageName: 'Round of 32' },
  { id: 'R16', label: 'Round of 16', stageName: 'Round of 16' },
  { id: 'QF', label: 'Quarterfinals', stageName: 'Quarterfinals' },
  { id: 'SF', label: 'Semifinals', stageName: 'Semifinals' },
  { id: 'F', label: 'Finals', stageName: 'Final' },
];

export function BracketTabController({ initialMatches }: ControllerProps) {
  const [matches, setMatches] = useState<WorldCupMatchNormalized[]>(initialMatches);
  const [activeRound, setActiveRound] = useState('R32');

  const currentStage = ROUNDS.find(r => r.id === activeRound);
  const filteredMatches = matches.filter(m => m.stage === currentStage?.stageName);
  const hasLiveMatches = filteredMatches.some(m => m.status.state === 'in');

  useEffect(() => {
    if (!hasLiveMatches) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/matches');
        if (res.ok) {
          const freshMatches = await res.json();
          setMatches(freshMatches);
        }
      } catch {
        // Silently fail
      }
    }, 30_000);

    return () => clearInterval(pollInterval);
  }, [hasLiveMatches, activeRound]);

  return (
    <div>
      {/* Round tabs */}
      <div
        className="flex scrollbar-none overflow-x-auto gap-2 mb-6"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        {ROUNDS.map(round => (
          <button
            key={round.id}
            onClick={() => setActiveRound(round.id)}
            className="px-4 py-3 text-[13px] font-bold whitespace-nowrap cursor-pointer"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeRound === round.id ? 'var(--navy)' : 'transparent'}`,
              color: activeRound === round.id ? 'var(--navy)' : 'var(--ink-3)',
            }}
          >
            {round.label}
            {matches.some(m => m.stage === round.stageName && m.status.state === 'in') && (
              <span className="ml-2 inline-block w-2 h-2 rounded-full bg-live align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Match grid */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--ink-3)' }}>
          Matchups to be determined.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[13px]">
          {filteredMatches.map(match => (
            <MatchCard key={match.eventId} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
