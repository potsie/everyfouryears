import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { groupMatchesByDay } from '@/lib/schedule-utils';
import { Nav } from '@/components/Nav';
import { ScheduleClient } from '@/components/ScheduleClient';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function ScheduleDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const { matches } = await fetchAllMatches();
  const allDays = groupMatchesByDay(matches);
  const day = allDays.find(d => d.key === date);

  if (!day) notFound();

  return (
    <>
      <Nav activePath="/schedule" />
      <ScheduleClient days={[day]} singleDay />
    </>
  );
}
