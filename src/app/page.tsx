import { fetchAllMatches, fetchAllGroupStandings } from '@/lib/espn/wc-fetchers';
import { todayESPN } from '@/lib/dates';
import { Nav } from '@/components/Nav';
import { HomeClient } from '@/components/HomeClient';

// Revalidate every 60s — client-side polling handles live score updates
export const revalidate = 60;

export default async function HomePage() {
  const { matches, teamDict } = await fetchAllMatches();
  const groupStandings = await fetchAllGroupStandings(teamDict);
  const todayStr = todayESPN();

  return (
    <>
      <Nav activePath="/" />
      <HomeClient
        allMatches={matches}
        groupStandings={groupStandings}
        todayStr={todayStr}
      />
    </>
  );
}
