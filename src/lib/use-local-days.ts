'use client';

import { useState, useEffect } from 'react';
import { regroupDaysLocal, type ScheduleDay } from '@/lib/schedule-utils';

// Day-grouping that follows the viewer's local timezone. Seed with the server's
// Eastern-grouped days for a clean SSR/first paint (no hydration mismatch), then
// re-bucket into the browser's local zone on mount so the displayed day matches
// the local kickoff times.
export function useLocalDays(serverDays: ScheduleDay[]): ScheduleDay[] {
  const [days, setDays] = useState(serverDays);

  useEffect(() => {
    setDays(regroupDaysLocal(serverDays));
  }, [serverDays]);

  return days;
}
