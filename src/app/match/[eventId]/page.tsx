import '@/app/venues/venues.css';
import { notFound } from 'next/navigation';
import { fetchMatchSummary } from '@/lib/espn/wc-fetchers';
import { getVenueByName } from '@/lib/venues';
import { fetchVenueWeather } from '@/lib/weather';
import { getPmsr } from '@/lib/pmsr.server';
import { Nav } from '@/components/Nav';
import { MatchClient } from './MatchClient';

export const revalidate = 60;

export default async function MatchPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  try {
    const match = await fetchMatchSummary(eventId);
    const venue = getVenueByName(match.venue);
    const weatherData = venue ? await fetchVenueWeather(venue.lat, venue.lng) : null;
    const pmsr = await getPmsr(eventId);

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
  } catch {
    notFound();
  }
}
