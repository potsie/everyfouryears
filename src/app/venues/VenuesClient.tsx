'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { PageHero } from '@/components/PageHero';
import { VENUES, roofLabel, venuesByCountry } from '@/lib/venues';
import type { VenueData } from '@/lib/venues';

const COS = Math.cos(34.3 * Math.PI / 180);
function projector(venues: VenueData[]) {
  const lats = venues.map(v => v.lat);
  const xs = venues.map(v => v.lng * COS);
  const latMin = Math.min(...lats), latMax = Math.max(...lats);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const pad = 0.07;
  return (v: VenueData) => {
    const xr = (v.lng * COS - xMin) / (xMax - xMin);
    const yr = (latMax - v.lat) / (latMax - latMin);
    return { left: (pad + xr * (1 - 2 * pad)) * 100, top: (pad + yr * (1 - 2 * pad)) * 100 };
  };
}

const COUNTRY_FLAGS: Record<string, string> = { USA: 'us', Canada: 'ca', Mexico: 'mx' };

function RoofBadge({ roof }: { roof: VenueData['roof'] }) {
  return (
    <span className={`rbadge ${roof}`}>
      <span className="rdot" />{roofLabel(roof)}
    </span>
  );
}

function VenueCard({ v }: { v: VenueData }) {
  const flagCode = COUNTRY_FLAGS[v.country] ?? 'us';
  return (
    <Link href={`/venue/${v.slug}`} className="vcard">
      <div className="vc-photo" style={v.photoUrl ? undefined : undefined}>
        {v.photoUrl
          ? <img src={v.photoUrl} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div className="vshot" style={{ height: '100%' }} />
        }
        <span className="vc-flag">
          <Flag logo={`https://a.espncdn.com/i/teamlogos/countries/500/${flagCode}.png`} abbr={v.country.slice(0, 3).toUpperCase()} size={26} />
        </span>
        {v.role && (
          <span className="vc-role">
            <span className={`role-tag${v.role === 'Final' ? ' final' : ''}`}>{v.role}</span>
          </span>
        )}
      </div>
      <div className="vc-body">
        <div className="vc-name">{v.name}</div>
        <div className="vc-city">{v.city}, {v.region}</div>
        <div className="vc-stats">
          <div className="vc-stat">
            <span className="v tnum">{(v.cap / 1000).toFixed(1)}k</span>
            <span className="k">Capacity</span>
          </div>
          <div className="vc-stat">
            <span className="v tnum">{v.matches}</span>
            <span className="k">Matches</span>
          </div>
          <div className="vc-stat">
            <span className="v tnum">{v.opened}</span>
            <span className="k">Opened</span>
          </div>
        </div>
        <div className="vc-foot">
          <RoofBadge roof={v.roof} />
          <span className="muted" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)' }}>
            {v.surface === 'natural' ? 'Natural grass' : 'Temp. grass'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function VenueRow({ v }: { v: VenueData }) {
  return (
    <Link href={`/venue/${v.slug}`} className="vrow">
      <div className="vr-shot" style={{ overflow: 'hidden', flexShrink: 0 }}>
        {v.photoUrl
          ? <img src={v.photoUrl} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div className="vshot" style={{ width: '100%', height: '100%' }} />
        }
      </div>
      <div className="vr-info">
        <div className="vr-name">{v.name}</div>
        <div className="vr-meta">
          {v.city}, {v.region}
          <span>·</span>
          <RoofBadge roof={v.roof} />
        </div>
      </div>
      <div className="vr-cap">
        <div className="v tnum">{(v.cap / 1000).toFixed(0)}k</div>
        <div className="k">{v.matches} matches</div>
      </div>
    </Link>
  );
}

function AtlasColumn({ country, rows, cols = 1 }: { country: string; rows: VenueData[]; cols?: number }) {
  const flagCode = COUNTRY_FLAGS[country] ?? 'us';
  return (
    <div className="atlas-col">
      <div className="ac-head">
        <Flag logo={`https://a.espncdn.com/i/teamlogos/countries/500/${flagCode}.png`} abbr={country.slice(0, 3).toUpperCase()} size={24} />
        <span className="ac-name">{country === 'USA' ? 'United States' : country}</span>
        <span className="ac-cnt">{rows.length} {rows.length === 1 ? 'venue' : 'venues'}</span>
      </div>
      <div className={`ac-body${cols === 2 ? ' two' : ''}`}>
        {rows.map(v => <VenueRow key={v.slug} v={v} />)}
      </div>
    </div>
  );
}

function HostMap() {
  const venues = VENUES;
  const pos = projector(venues);
  const caps = venues.map(v => v.cap);
  const capMin = Math.min(...caps), capMax = Math.max(...caps);
  const ringFor = (cap: number) => 15 + ((cap - capMin) / (capMax - capMin)) * 13;

  return (
    <div className="hostmap">
      <div className="hm-grain" />
      <div className="hm-head">
        <div className="hm-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          16 host cities · 3 nations
        </div>
        <div className="hm-sub">United 2026</div>
      </div>
      <div className="hm-field">
        <div className="hm-glow" />
        <span className="hm-region" style={{ left: '16%', top: '7%' }}>Canada</span>
        <span className="hm-region" style={{ left: '40%', top: '40%' }}>United States</span>
        <span className="hm-region" style={{ left: '30%', top: '88%' }}>México</span>
        {venues.map(v => {
          const p = pos(v);
          const d = ringFor(v.cap);
          const isFinal = v.role === 'Final';
          return (
            <Link
              key={v.slug}
              href={`/venue/${v.slug}`}
              className={`hm-pin${isFinal ? ' final show-lab' : ''}`}
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
            >
              <span className="ring" style={{ width: d, height: d }} />
              <span className="dot" />
              <span className="hm-lab">
                {v.city}<span className="cap">{(v.cap / 1000).toFixed(0)}k</span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="hm-legend">
        <span className="lg"><span className="sw f" /> Final · MetLife</span>
        <span className="lg"><span className="sw h" /> Host venue · ring = capacity</span>
        <span className="grow" />
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10.5, color: 'rgba(255,255,255,.4)' }}>
          schematic · positions by lat/lng
        </span>
      </div>
    </div>
  );
}

export function VenuesClient() {
  const [view, setView] = useState<'Showcase' | 'Atlas'>('Showcase');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wc-venues-view') as 'Showcase' | 'Atlas';
      if (saved === 'Atlas') setView('Atlas');
    } catch {}
  }, []);

  const handleView = (v: 'Showcase' | 'Atlas') => {
    setView(v);
    try { localStorage.setItem('wc-venues-view', v); } catch {}
  };

  const byCap = [...VENUES].sort((a, b) => b.cap - a.cap);
  const totalCap = VENUES.reduce((s, v) => s + v.cap, 0);

  return (
    <>
      <PageHero
        eyebrow="2026 FIFA World Cup"
        title="Host Venues"
        sub={<>
          <span style={{ color: '#fff', fontWeight: 700 }}>16</span> stadiums
          <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>3</span> nations
          <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>{(totalCap / 1e6).toFixed(2)}M</span> total seats
          <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>104</span> matches
        </>}
      />

      <div style={{ marginTop: 18 }}>
        <HostMap />
      </div>

      <div className="section-head" style={{ marginTop: 24 }}>
        <h2>{view === 'Showcase' ? 'All 16 venues' : 'By host nation'}</h2>
        <div className="row gap12" style={{ gap: 12 }}>
          <span className="eyebrow">{view === 'Showcase' ? 'Sorted by capacity' : 'Largest first'}</span>
          <div className="seg" role="tablist">
            <button role="tab" aria-selected={view === 'Showcase'} className={view === 'Showcase' ? 'on' : ''} onClick={() => handleView('Showcase')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="8" height="8" rx="1.5" />
                <rect x="13" y="3" width="8" height="8" rx="1.5" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" />
                <rect x="13" y="13" width="8" height="8" rx="1.5" />
              </svg>
              Grid
            </button>
            <button role="tab" aria-selected={view === 'Atlas'} className={view === 'Atlas' ? 'on' : ''} onClick={() => handleView('Atlas')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="18" height="4" rx="1.5" />
                <rect x="3" y="10" width="18" height="4" rx="1.5" />
                <rect x="3" y="16" width="18" height="4" rx="1.5" />
              </svg>
              By nation
            </button>
          </div>
        </div>
      </div>

      {view === 'Showcase' ? (
        <div className="venue-grid" style={{ marginTop: 16 }}>
          {byCap.map(v => <VenueCard key={v.slug} v={v} />)}
        </div>
      ) : (
        <div className="atlas-cols" style={{ marginTop: 16 }}>
          <AtlasColumn country="USA" rows={venuesByCountry('USA')} cols={2} />
          <div className="atlas-side">
            <AtlasColumn country="Canada" rows={venuesByCountry('Canada')} />
            <AtlasColumn country="Mexico" rows={venuesByCountry('Mexico')} />
          </div>
        </div>
      )}

      <div className="foot-note" style={{ marginTop: 32 }}>
        <span>All match times local · kickoff schedules subject to broadcast adjustments</span>
        <span>16 venues across USA, Canada &amp; Mexico</span>
      </div>
    </>
  );
}
