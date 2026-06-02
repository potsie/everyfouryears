import { Nav } from '@/components/Nav';
import { VenuesClient } from './VenuesClient';

export const metadata = { title: 'Host Venues — 2026 FIFA World Cup' };

export default function VenuesPage() {
  return (
    <>
      <Nav activePath="/venues" />
      <div className="page">
        <VenuesClient />
      </div>
    </>
  );
}
