import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { groupMatchesByDay } from '@/lib/schedule-utils';
import { Nav } from '@/components/Nav';
import { ScheduleClient } from '@/components/ScheduleClient';

export const revalidate = 60;

export const metadata = {
  title: 'Schedule',
  description: 'Full 2026 FIFA World Cup match schedule — all 104 matches across 16 venues.',
};

export default async function SchedulePage() {
  const { matches } = await fetchAllMatches();
  const days = groupMatchesByDay(matches);

  return (
    <>
      <Nav activePath="/schedule" />
      <ScheduleClient days={days} />
    </>
  );
}
