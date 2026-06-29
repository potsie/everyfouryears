import { fetchAllMatches, fetchAllGroupStandings, collectKnockoutTeamIds } from '@/lib/espn/wc-fetchers';
import { getMergedNews, type NewsItem } from '@/lib/news';
import { todayESPN } from '@/lib/dates';
import { Nav } from '@/components/Nav';
import { HomeClient } from '@/components/HomeClient';

// Revalidate every 60s — client-side polling handles live score updates
export const revalidate = 60;

export default async function HomePage() {
  const { matches, teamDict } = await fetchAllMatches();
  const groupStandings = await fetchAllGroupStandings(teamDict, collectKnockoutTeamIds(matches));
  const todayStr = todayESPN();

  let news: NewsItem[] = [];
  try {
    const feed = await getMergedNews();
    news = feed.items.slice(0, 6);
  } catch {
    // news band hides itself when empty
  }

  return (
    <>
      <Nav activePath="/" />
      <HomeClient
        allMatches={matches}
        groupStandings={groupStandings}
        todayStr={todayStr}
        news={news}
      />
    </>
  );
}
