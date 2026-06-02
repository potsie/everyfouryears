import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { MatchCard } from '@/components/MatchCard';

interface BracketColumnProps {
  round: string;
  matches: WorldCupMatchNormalized[];
}

export function BracketColumn({ round, matches }: BracketColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        className="font-display font-bold text-[16px] uppercase tracking-[.06em]"
        style={{ color: 'var(--ink-2)' }}
      >
        {round}
      </h2>
      {matches.length === 0 ? (
        <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>Matchups TBD</p>
      ) : (
        matches.map(m => <MatchCard key={m.eventId} match={m} />)
      )}
    </div>
  );
}
