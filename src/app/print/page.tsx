import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import { PrintClient } from './PrintClient';

export const revalidate = 300;

export const metadata = {
  title: 'Print Schedule | 2026 FIFA World Cup',
  description: 'Printable 2026 FIFA World Cup schedule — wall chart, editorial, and calendar views.',
};

export default async function PrintPage() {
  const { matches } = await fetchAllMatches();
  return (
    <>
      <Nav activePath="/print" />
      <PrintClient matches={matches} />
    </>
  );
}
