import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import { BracketColumn } from '@/components/BracketColumn';

export const revalidate = 60;

export default async function BracketPage() {
  const { matches } = await fetchAllMatches();
  const knockoutMatches = matches.filter(m => m.seasonTypeId >= 2);

  return (
    <>
      <Nav activePath="/bracket" />
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 24px' }}>
        <h1
          className="font-display font-bold text-[28px] mb-8"
          style={{ color: 'var(--ink)' }}
        >
          Knockout Bracket
        </h1>
        <div className="flex gap-8 overflow-x-auto pb-8">
          {[
            { round: 'R32', label: 'Round of 32', stage: 'Round of 32' },
            { round: 'R16', label: 'Round of 16', stage: 'Round of 16' },
            { round: 'QF', label: 'Quarterfinals', stage: 'Quarterfinals' },
            { round: 'SF', label: 'Semifinals', stage: 'Semifinals' },
            { round: 'F', label: 'Final', stage: 'Final' },
          ].map(({ round, label, stage }) => (
            <BracketColumn
              key={round}
              round={label}
              matches={knockoutMatches.filter(m => m.stage === stage)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
