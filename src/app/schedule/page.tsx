import { fetchAllMatches, fetchAllGroupStandings, collectKnockoutTeamIds } from '@/lib/espn/wc-fetchers';
import { groupMatchesByDay } from '@/lib/schedule-utils';
import { Nav } from '@/components/Nav';
import { ScheduleClient } from '@/components/ScheduleClient';

export const revalidate = 60;

export const metadata = {
  title: 'Schedule',
  description: 'Full 2026 FIFA World Cup match schedule — all 104 matches across 16 venues.',
};

export default async function SchedulePage() {
  const { matches, teamDict } = await fetchAllMatches();
  const standings = await fetchAllGroupStandings(teamDict, collectKnockoutTeamIds(matches));
  const days = groupMatchesByDay(matches);

  // Map group letter → team abbrs for client-side filtering.
  // groupLetter is empty in the scoreboard pre-tournament, so the client
  // needs this to filter by group correctly.
  const groupTeams: Record<string, string[]> = {};
  for (const g of standings) {
    const letter = g.groupName.replace('Group ', '').trim();
    groupTeams[letter] = g.standings.map(s => s.teamAbbr);
  }

  return (
    <>
      <Nav activePath="/schedule" />
      <ScheduleClient days={days} groupTeams={groupTeams} />
    </>
  );
}
