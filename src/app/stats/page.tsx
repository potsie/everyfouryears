import { Nav } from '@/components/Nav';
import { StatsClient } from './StatsClient';

export const metadata = { title: 'Tournament Stats — 2026 FIFA World Cup' };

export default function StatsPage() {
  return (
    <>
      <Nav activePath="/stats" />
      <div className="page">
        <StatsClient />
      </div>
    </>
  );
}
