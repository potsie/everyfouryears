import '@/app/venues/venues.css';
import { notFound } from 'next/navigation';
import { fetchMatchSummary } from '@/lib/espn/wc-fetchers';
import { getVenueByName } from '@/lib/venues';
import { fetchVenueWeather } from '@/lib/weather';
import { getPmsr } from '@/lib/pmsr.server';
import { Nav } from '@/components/Nav';
import { MatchClient } from './MatchClient';

export const revalidate = 60;

// Load + join all match data, or trigger a 404. Kept separate from the page so
// JSX is never constructed inside a try/catch (notFound() returns `never`, so the
// page's data is guaranteed assigned by the time we render).
async function loadMatchData(eventId: string) {
  try {
    const match = await fetchMatchSummary(eventId);
    const venue = getVenueByName(match.venue);
    const weatherData = venue ? await fetchVenueWeather(venue.lat, venue.lng) : null;
    const pmsr = await getPmsr(eventId);
    return { match, venue, weatherData, pmsr };
  } catch {
    notFound();
  }
}

export default async function MatchPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { match, venue, weatherData, pmsr } = await loadMatchData(eventId);

  return (
    <>
      <Nav activePath="/schedule" />
      <div className="page">
        <MatchClient
          match={match}
          venueSlug={venue?.slug}
          venueRoof={venue?.roof}
          venueLat={venue?.lat}
          venueLng={venue?.lng}
          weatherData={weatherData}
          pmsr={pmsr}
        />
      </div>
    </>
  );
}
