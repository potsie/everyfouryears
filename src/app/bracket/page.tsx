import './bracket.css';
import { Nav } from '@/components/Nav';
import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { buildBracketFromMatches } from '@/lib/bracket-builder';
import { BracketClient } from './BracketClient';
import type { SerializableBracket } from '@/lib/bracket-data';

export const metadata = { title: 'Knockout Bracket — 2026 FIFA World Cup' };

// Revalidate every 5 minutes during group stage; more frequently once knockout begins
export const revalidate = 300;

export default async function BracketPage() {
  const { matches } = await fetchAllMatches();
  const data: SerializableBracket = buildBracketFromMatches(matches);

  return (
    <>
      <Nav activePath="/bracket" />
      <div className="page">
        <BracketClient data={data} />
      </div>
    </>
  );
}
