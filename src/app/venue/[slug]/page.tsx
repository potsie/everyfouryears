import '@/app/venues/venues.css';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import { VENUES, getVenueBySlug, roofLabel } from '@/lib/venues';
import type { VenueData } from '@/lib/venues';
import { fetchTeamColors } from '@/lib/espn/wc-fetchers';

const HOST_COUNTRY_ESPN_ID: Record<string, string> = {
  USA: '660',
  Canada: '206',
  Mexico: '203',
};

const HOST_COUNTRY_FLAG: Record<string, string> = {
  USA:    'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
  Canada: 'https://a.espncdn.com/i/teamlogos/countries/500/can.png',
  Mexico: 'https://a.espncdn.com/i/teamlogos/countries/500/mex.png',
};

export function generateStaticParams() {
  return VENUES.map(v => ({ slug: v.slug }));
}

function StatHero({ v, heroBackground }: { v: VenueData; heroBackground?: string }) {
  const flagUrl = HOST_COUNTRY_FLAG[v.country] ?? '';
  const locale = v.country === 'USA'
    ? `${v.city}, ${v.region}, USA`
    : v.country === 'Canada'
      ? `${v.city}, ${v.region}, Canada`
      : `${v.city}, ${v.region}, Mexico`;

  return (
    <div className="th" style={heroBackground ? { background: heroBackground } : undefined}>
      <div className="th-grain" />
      <div className="th-in">
        <div className="th-top">
          <Link href="/venues" className="th-back">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All venues
          </Link>
          <span className="th-rankpill">
            <b className="tnum">{v.matches}</b> matches hosted
          </span>
        </div>
        <div className="th-id">
          <Flag logo={flagUrl} abbr={v.country.slice(0, 3).toUpperCase()} size={64} />
          <div className="titles">
            <div className="eyebrow2">{locale} · 2026 World Cup</div>
            <h1>{v.name}</h1>
            <div className="subline">
              {v.role && (
                <span
                  className={`role-tag${v.role === 'Final' ? ' final' : ''}`}
                  style={v.role === 'Final' ? { background: '#36d399', color: '#06351f', borderColor: 'transparent' } : undefined}
                >
                  {v.role}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="th-strip">
          <div className="cell"><div className="v tnum">{v.cap.toLocaleString()}</div><div className="k">Capacity</div></div>
          <div className="cell"><div className="v">{roofLabel(v.roof)}</div><div className="k">Roof</div></div>
          <div className="cell"><div className="v sm">{v.surface === 'natural' ? 'Natural grass' : 'Temp. grass'}</div><div className="k">Surface</div></div>
          <div className="cell"><div className="v tnum">{v.matches}</div><div className="k">Matches</div></div>
          <div className="cell"><div className="v tnum">{v.opened}</div><div className="k">Opened</div></div>
        </div>
      </div>
    </div>
  );
}

function Locator({ lat, lng }: { lat: number; lng: number }) {
  const isWest = lng < 0;
  return (
    <div className="locator">
      <div className="loc-grid" />
      <div className="loc-grain" />
      <div className="loc-pin" style={{ left: '54%', top: '46%' }}>
        <span className="dot" />
      </div>
      <div className="loc-coord">
        {Math.abs(lat).toFixed(3)}°{lat >= 0 ? 'N' : 'S'} · {Math.abs(lng).toFixed(3)}°{isWest ? 'W' : 'E'}
      </div>
    </div>
  );
}

function NearbyVenue({ slug, name, city, dist, photoUrl }: { slug: string; name: string; city: string; dist: string; photoUrl: string | null }) {
  return (
    <Link href={`/venue/${slug}`} className="nearby-row">
      <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
        {photoUrl
          ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div className="nb-shot vshot" style={{ width: '100%', height: '100%' }} />
        }
      </div>
      <div className="nb-info">
        <div className="nb-name">{name}</div>
        <div className="nb-city">{city}</div>
      </div>
      <span className="nb-dist tnum">{dist}</span>
    </Link>
  );
}

function getNearby(v: VenueData): Array<{ slug: string; name: string; city: string; dist: string; photoUrl: string | null }> {
  const nearby = VENUES.filter(u => u.slug !== v.slug && u.country === v.country)
    .map(u => {
      const dlat = u.lat - v.lat, dlng = u.lng - v.lng;
      const km = Math.round(Math.sqrt(dlat * dlat + dlng * dlng) * 111);
      return { slug: u.slug, name: u.name, city: u.city, dist: `${km} km`, km, photoUrl: u.photoUrl };
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);
  return nearby;
}

export default async function VenueDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = getVenueBySlug(slug);
  if (!v) notFound();

  const nearby = getNearby(v);

  const espnId = HOST_COUNTRY_ESPN_ID[v.country];
  const teamColors = espnId ? await fetchTeamColors(espnId) : null;
  const heroBackground = teamColors?.primary
    ? `linear-gradient(135deg, color-mix(in srgb, ${teamColors.primary} 55%, #0a2240) 0%, #0a2240 100%)`
    : undefined;

  return (
    <>
      <Nav activePath="/venues" />
      <div className="page">
        <StatHero v={v} heroBackground={heroBackground} />

        <div className="cols">
          <div>
            {v.photoUrl && (
              <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 16, boxShadow: 'var(--sh-1)', aspectRatio: '16/9' }}>
                <img
                  src={v.photoUrl}
                  alt={v.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            <div className="t-card">
              <div className="t-card-head">
                <h3>About the stadium</h3>
                <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{roofLabel(v.roof)}</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p className="v-blurb" style={{ margin: 0 }}>
                  {v.name} is one of {v.matches === 9 ? 'the most-used venues' : 'the host venues'} for the 2026 FIFA World Cup,
                  hosting {v.matches} matches{v.role ? ` including the ${v.role}` : ''}.
                  The stadium opened in {v.opened} and seats {v.cap.toLocaleString()} spectators.
                  {v.surface === 'temp grass' ? ' A temporary natural grass pitch is being installed for the tournament.' : ''}
                  {v.roof === 'retractable' ? ' The retractable roof can be closed in adverse weather.' : ''}
                  {v.roof === 'fixed' ? ' The fixed roof keeps fans sheltered from the elements.' : ''}
                </p>
              </div>
              <div className="facts" style={{ borderTop: '1px solid var(--line)' }}>
                {[
                  { k: 'Capacity', v: v.cap.toLocaleString() },
                  { k: 'Roof', v: roofLabel(v.roof) },
                  { k: 'Surface', v: v.surface === 'natural' ? 'Natural grass' : 'Natural grass (temporary)' },
                  { k: 'Opened', v: String(v.opened) },
                  { k: 'Matches hosted', v: String(v.matches) },
                  { k: 'Country', v: v.country },
                ].map(f => (
                  <div className="fact-row" key={f.k}>
                    <span className="k">{f.k}</span>
                    <span className="v">{f.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shelf">
            <div className="panel">
              <div className="panel-head">
                <h3>Location</h3>
                <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{v.city}</span>
              </div>
              <Locator lat={v.lat} lng={v.lng} />
              <div className="facts">
                <div className="fact-row">
                  <span className="k">Coordinates</span>
                  <span className="v tnum" style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
                    {v.lat.toFixed(3)}, {v.lng.toFixed(3)}
                  </span>
                </div>
                <div className="fact-row">
                  <span className="k">Country</span>
                  <span className="v">{v.country}</span>
                </div>
              </div>
            </div>

            {nearby.length > 0 && (
              <div className="panel">
                <div className="panel-head"><h3>Nearby venues</h3></div>
                {nearby.map(n => <NearbyVenue key={n.slug} slug={n.slug} name={n.name} city={n.city} dist={n.dist} photoUrl={n.photoUrl} />)}
              </div>
            )}
          </div>
        </div>

        <div className="foot-note">
          <Link href="/venues" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>← All venues</Link>
          <span>2026 FIFA World Cup</span>
        </div>
      </div>
    </>
  );
}
