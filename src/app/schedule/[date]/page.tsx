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

  // A match can shift by at most one calendar day between the Eastern (server)
  // grouping and the viewer's local zone, so a date is valid if it — or either
  // neighbor — exists in the Eastern grouping. The client re-buckets into the
  // viewer's zone and renders only the matches whose local day === `date`.
  const easternKeys = new Set(allDays.map(d => d.key));
  const shift = (key: string, delta: number) => {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + delta));
    return dt.toISOString().slice(0, 10);
  };
  const valid = easternKeys.has(date) || easternKeys.has(shift(date, -1)) || easternKeys.has(shift(date, 1));
  if (!valid) notFound();

  return (
    <>
      <Nav activePath="/schedule" />
      <ScheduleClient days={allDays} singleDay selectedDate={date} />
    </>
  );
}
