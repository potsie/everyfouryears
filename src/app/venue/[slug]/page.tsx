import '@/app/venues/venues.css';
import 'leaflet/dist/leaflet.css';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import { VENUES, getVenueBySlug, roofLabel } from '@/lib/venues';
import { VenueMapLeaflet } from '@/components/VenueMapLeaflet';
import type { VenueData } from '@/lib/venues';
import { fetchTeamColors, fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { groupMatchesByDay } from '@/lib/schedule-utils';
import type { ScheduleMatch, ScheduleDay, ScheduleTeam, SeedTeam } from '@/lib/schedule-utils';
import { fetchVenueWeather } from '@/lib/weather';
import { VenueWeather } from '@/components/VenueWeather';
import React from 'react';

// ESPN fullName → our VenueData.name for known mismatches
const ESPN_VENUE_ALIASES: Record<string, string> = {
  'GEHA Field at Arrowhead Stadium': 'Arrowhead Stadium',
  'Estadio Azteca': 'Estadio Banorte',
};

function matchesVenue(espnName: string, venueName: string): boolean {
  return (ESPN_VENUE_ALIASES[espnName] ?? espnName) === venueName;
}

function isSeed(t: ScheduleTeam | SeedTeam): t is SeedTeam {
  return (t as SeedTeam).tbd === true;
}

function formatKickoff(dateISO: string): string {
  return new Date(dateISO).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function MatchStatusCell({ m }: { m: ScheduleMatch }) {
  if (m.state === 'in') {
    return <span className="s-status s-live"><span className="pulse-dot" />{m.clock}</span>;
  }
  if (m.state === 'post') {
    return <span className="s-status s-ft">FULL TIME</span>;
  }
  return <span className="s-status s-time tnum">{formatKickoff(m.dateISO)}</span>;
}

function TeamCell({ team, side, lose }: { team: ScheduleTeam | SeedTeam; side: 'a' | 'b'; lose: boolean }) {
  const cls = `s-team ${side}${lose ? ' lose' : ''}`;
  if (isSeed(team)) {
    return <span className={cls}><span className="s-seed">{team.seed}</span></span>;
  }
  if (side === 'a') {
    return (
      <span className={cls}>
        <span className="s-code">{team.abbr}</span>
        <Flag logo={team.logo} abbr={team.abbr} size={22} />
      </span>
    );
  }
  return (
    <span className={cls}>
      <Flag logo={team.logo} abbr={team.abbr} size={22} />
      <span className="s-code">{team.abbr}</span>
    </span>
  );
}

function ScoreCell({ m }: { m: ScheduleMatch }) {
  if (m.state === 'pre') return <span className="s-score pre">vs</span>;
  if (!m.score) return <span className="s-score pre">—</span>;
  const [hs, as_] = m.score;
  return <span className="s-score tnum">{hs}<span className="x">–</span>{as_}</span>;
}

function FixtureRow({ m }: { m: ScheduleMatch }) {
  const post = m.state === 'post';
  const [hs, as_] = m.score ?? [0, 0];
  const loseHome = post && !!m.score && hs < as_;
  const loseAway = post && !!m.score && as_ < hs;
  const badge = m.groupLetter ? `GRP ${m.groupLetter}` : m.koAbbr ?? '';

  return (
    <Link href={`/match/${m.id}`} className="srow" style={{ textDecoration: 'none', color: 'inherit' }}>
      <MatchStatusCell m={m} />
      <TeamCell team={m.home} side="a" lose={loseHome} />
      <ScoreCell m={m} />
      <TeamCell team={m.away} side="b" lose={loseAway} />
      <span className="s-meta">
        {badge && <span className="s-grp">{badge}</span>}
        {m.broadcaster && <span className="s-tv tv">{m.broadcaster}</span>}
      </span>
      <span className="s-tv tv" style={{ justifySelf: 'end' }}>{m.broadcaster}</span>
    </Link>
  );
}

function VenueFixtures({ days }: { days: ScheduleDay[] }) {
  if (days.length === 0) return null;
  return (
    <div className="t-card" style={{ marginBottom: 0 }}>
      <div className="t-card-head">
        <h3>Match schedule</h3>
        <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>
          {days.reduce((n, d) => n + d.matches.length, 0)} matches
        </span>
      </div>
      <div style={{ padding: '4px 16px 16px' }}>
        {days.map(day => (
          <section key={day.key} className={`sday${day.isToday ? ' is-today' : ''}`} style={{ marginTop: 16 }}>
            <div className="sday-head">
              <h3>{day.dateLabel}</h3>
              <span className="stage">{day.stageLabel}</span>
              {day.isToday && <span className="todaytag">● Today</span>}
            </div>
            <div className="slist">
              {day.matches.map(m => <FixtureRow key={m.id} m={m} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

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

function StatHero({ v, heroBackground, weatherNode }: { v: VenueData; heroBackground?: string; weatherNode?: React.ReactNode }) {
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
          {weatherNode ?? (
            <span className="th-rankpill">
              <b className="tnum">{v.matches}</b> matches hosted
            </span>
          )}
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
  const [teamColors, { matches: allMatches }, weatherData] = await Promise.all([
    espnId ? fetchTeamColors(espnId) : Promise.resolve(null),
    fetchAllMatches(),
    fetchVenueWeather(v.lat, v.lng),
  ]);
  const heroBackground = teamColors?.primary
    ? `linear-gradient(135deg, color-mix(in srgb, ${teamColors.primary} 55%, #0a2240) 0%, #0a2240 100%)`
    : undefined;

  const venueMatches = allMatches.filter(m => matchesVenue(m.venue, v.name));
  const fixtureDays = groupMatchesByDay(venueMatches);
  const weatherNode = weatherData
    ? <VenueWeather data={weatherData} roofType={v.roof} lat={v.lat} lng={v.lng} />
    : undefined;

  return (
    <>
      <Nav activePath="/venues" />
      <div className="page">
        <StatHero v={v} heroBackground={heroBackground} weatherNode={weatherNode} />

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

            <VenueFixtures days={fixtureDays} />
          </div>

          <div className="shelf">
            <div className="panel">
              <div className="panel-head">
                <h3>Location</h3>
                <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{v.city}</span>
              </div>
              <VenueMapLeaflet lat={v.lat} lng={v.lng} name={v.name} />
              <div className="facts">
                {v.address && (
                  <div className="fact-row">
                    <span className="k">Address</span>
                    <span className="v" style={{ textAlign: 'right' }}>{v.address}</span>
                  </div>
                )}
                <div className="fact-row">
                  <span className="k">Country</span>
                  <span className="v">{v.country}</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
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
