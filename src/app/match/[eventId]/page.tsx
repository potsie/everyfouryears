import { notFound } from 'next/navigation';
import { fetchMatchSummary } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import { MatchClient } from './MatchClient';

export const revalidate = 60;

export default async function MatchPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  try {
    const match = await fetchMatchSummary(eventId);
    return (
      <>
        <Nav activePath="/schedule" />
        <div className="page">
          <MatchClient match={match} />
        </div>
      </>
    );
  } catch {
    notFound();
  }
}
