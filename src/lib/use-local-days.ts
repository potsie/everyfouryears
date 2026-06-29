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
    // Re-bucket into the browser's timezone only after mount — the local zone is
    // unknown during SSR, so this can't move into render without a mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only timezone regroup
    setDays(regroupDaysLocal(serverDays));
  }, [serverDays]);

  return days;
}
