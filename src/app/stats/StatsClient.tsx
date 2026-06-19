'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { PageHero } from '@/components/PageHero';
import { Shot } from '@/components/Shot';
import type {
  TournamentStats,
  ScorerEntry,
  LeadEntry,
  DisciplineEntry,
  YoungEntry,
  TeamStatEntry,
  TallyItem,
} from '@/lib/stats-live';

function teamFlagUrl(abbr: string) {
  return `https://a.espncdn.com/i/teamlogos/countries/500/${abbr.toLowerCase()}.png`;
}

const COUNTRY_NAMES: Record<string, string> = {
  ALG: 'Algeria', ARG: 'Argentina', AUS: 'Australia', AUT: 'Austria',
  BEL: 'Belgium', BIH: 'Bosnia-Herzegovina', BRA: 'Brazil', CAN: 'Canada',
  CIV: 'Ivory Coast', COD: 'Congo DR', COL: 'Colombia', CPV: 'Cape Verde',
  CRO: 'Croatia', CUW: 'Curaçao', CZE: 'Czechia', ECU: 'Ecuador',
  EGY: 'Egypt', ENG: 'England', ESP: 'Spain', FRA: 'France',
  GER: 'Germany', GHA: 'Ghana', HAI: 'Haiti', IRN: 'Iran',
  IRQ: 'Iraq', JOR: 'Jordan', JPN: 'Japan', KOR: 'South Korea',
  KSA: 'Saudi Arabia', MAR: 'Morocco', MEX: 'Mexico', NED: 'Netherlands',
  NOR: 'Norway', NZL: 'New Zealand', PAN: 'Panama', PAR: 'Paraguay',
  POR: 'Portugal', QAT: 'Qatar', RSA: 'South Africa', SCO: 'Scotland',
  SEN: 'Senegal', SUI: 'Switzerland', SWE: 'Sweden', TUN: 'Tunisia',
  TUR: 'Türkiye', URU: 'Uruguay', USA: 'United States', UZB: 'Uzbekistan',
};

function countryName(abbr: string): string {
  return COUNTRY_NAMES[abbr] ?? abbr;
}

const MEDALS = ['Golden Boot', 'Silver', 'Bronze'];

// Render a player-row container as a link to /player/{fifaId} when we have a
// FIFA id, otherwise a plain div. Player pages key on FIFA ids (see stats-live).
function RowLink({
  fifaId,
  className,
  style,
  children,
}: {
  fifaId?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (fifaId) {
    return <Link href={`/player/${fifaId}`} className={className} style={style}>{children}</Link>;
  }
  return <div className={className} style={style}>{children}</div>;
}

const EMPTY_STATS: TournamentStats = {
  tallies: [
    { k: 'Goals scored',  v: '—', sub: 'this tournament' },
    { k: 'Goals / match', v: '—', sub: 'avg' },
    { k: 'Penalties',     v: '—', sub: 'scored / taken' },
    { k: 'Clean sheets',  v: '—', sub: 'by goalkeepers' },
    { k: 'Yellow',        v: '—', sub: 'cards this tournament', v2: '—', k2: 'Red' },
    { k: 'Hat-tricks',    v: '—', sub: 'this tournament' },
  ],
  goldenBoot: [],
  assists: [],
  cleanSheets: [],
  saves: [],
  discipline: [],
  young: [],
  teamStats: [],
  physicalLeaders: { topSpeed: [], mostDistance: [], mostSprints: [] },
  xgPerformance: [],
};

function Podium({ p, rank }: { p: ScorerEntry; rank: 1 | 2 | 3 }) {
  return (
    <RowLink fifaId={p.fifaId} className={`podium p${rank}`}>
      <span className="pd-rank tnum">#{rank}</span>
      <span className="pd-medal">{MEDALS[rank - 1]}</span>
      <Shot name={p.p} size={rank === 1 ? 64 : 56} headshotUrl={p.photo} />
      <div className="pd-name">{p.p}</div>
      <div className="pd-team">
        <Flag logo={teamFlagUrl(p.t)} abbr={p.t} size={16} />
        {countryName(p.t)}
      </div>
      <div className="pd-goals tnum">{p.g}<span className="u">goals</span></div>
      <div className="pd-line">
        <div className="m"><span className="mv tnum">{p.mp}</span><span className="mk">Played</span></div>
        <div className="m"><span className="mv tnum">{p.a}</span><span className="mk">Assists</span></div>
        <div className="m"><span className="mv tnum">{p.pens}</span><span className="mk">Pens</span></div>
      </div>
    </RowLink>
  );
}

function GoldenBootTable({ rows }: { rows: ScorerEntry[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="lead-table" style={{ marginTop: 16 }}>
      <div className="lt-row head">
        <span className="lt-rank">#</span>
        <span>Player</span>
        <span className="lt-num head lt-hide">MP</span>
        <span className="lt-num head lt-hide">A</span>
        <span className="lt-num head" style={{ textAlign: 'center' }}>Goals</span>
      </div>
      {rows.map((p, i) => (
        <RowLink className="lt-row" key={p.p} fifaId={p.fifaId}>
          <span className="lt-rank tnum">{i + 4}</span>
          <span className="lt-player">
            <Shot name={p.p} size={34} headshotUrl={p.photo} />
            <span className="lt-info">
              <span className="lt-name">{p.p}</span>
              <span className="lt-club">
                <Flag logo={teamFlagUrl(p.t)} abbr={p.t} size={14} />
                <span>{countryName(p.t)}</span>
              </span>
            </span>
          </span>
          <span className="lt-num tnum lt-hide">{p.mp}</span>
          <span className="lt-num tnum lt-hide">{p.a}</span>
          <span className="lt-main tnum">{p.g}</span>
        </RowLink>
      ))}
    </div>
  );
}

function EmptyLeaders({ label }: { label: string }) {
  return (
    <div className="lead-card" style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 13 }}>
      No {label} yet
    </div>
  );
}

function LeaderList({ rows, green }: { rows: LeadEntry[]; green?: boolean }) {
  if (rows.length === 0) return <EmptyLeaders label="leaders" />;
  return (
    <>
      {rows.slice(0, 6).map((r, i) => (
        <RowLink className="lead-card" key={r.p} fifaId={r.fifaId}>
          <span className="lc-rank tnum">{i + 1}</span>
          <div className="lc-info">
            <div className="lc-name">{r.p}</div>
            <div className="lc-meta">
              <Flag logo={teamFlagUrl(r.t)} abbr={r.t} size={13} />
              {countryName(r.t)}
            </div>
          </div>
          <span className={`lc-val tnum${green ? ' green' : ''}`}>{r.v}</span>
        </RowLink>
      ))}
    </>
  );
}

type CatKey = 'Assists' | 'Clean sheets' | 'Saves';

function CatPanel({ assists, cleanSheets, saves }: { assists: LeadEntry[]; cleanSheets: LeadEntry[]; saves: LeadEntry[] }) {
  const [cat, setCat] = useState<CatKey>('Assists');
  const CATS: Array<{ key: CatKey; rows: LeadEntry[] }> = [
    { key: 'Assists',      rows: assists },
    { key: 'Clean sheets', rows: cleanSheets },
    { key: 'Saves',        rows: saves },
  ];
  const active = CATS.find(c => c.key === cat)!;
  return (
    <div className="panel">
      <div className="panel-head"><h3>Goalkeeping &amp; assists</h3></div>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)' }}>
        <div className="seg" style={{ width: 'fit-content' }}>
          {CATS.map(c => (
            <button key={c.key} className={cat === c.key ? 'on' : ''} onClick={() => setCat(c.key)}>{c.key}</button>
          ))}
        </div>
      </div>
      <LeaderList rows={active.rows} green={cat !== 'Assists'} />
    </div>
  );
}

function DisciplinePanel({ rows }: { rows: DisciplineEntry[] }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Discipline</h3>
        <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Most booked</span>
      </div>
      {rows.length === 0 ? <EmptyLeaders label="bookings" /> : rows.map((d, i) => (
        <RowLink className="lead-card" key={d.p} fifaId={d.fifaId}>
          <span className="lc-rank tnum">{i + 1}</span>
          <div className="lc-info">
            <div className="lc-name">{d.p}</div>
            <div className="lc-meta">
              <Flag logo={teamFlagUrl(d.t)} abbr={d.t} size={13} />
              {countryName(d.t)}
            </div>
          </div>
          <span className="disc-badges">
            {Array.from({ length: d.y }).map((_, k) => <span className="card y" key={`y${k}`} />)}
            {Array.from({ length: d.r }).map((_, k) => <span className="card r" key={`r${k}`} />)}
          </span>
        </RowLink>
      ))}
    </div>
  );
}

function YoungPanel({ rows }: { rows: YoungEntry[] }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Best young player</h3>
        <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Under 21</span>
      </div>
      {rows.length === 0 ? <EmptyLeaders label="young scorers" /> : rows.map((y, i) => (
        <RowLink className="lead-card" key={y.p} fifaId={y.fifaId}>
          <span className="lc-rank tnum">{i + 1}</span>
          <div className="lc-info">
            <div className="lc-name">{y.p}</div>
            <div className="lc-meta">
              <Flag logo={teamFlagUrl(y.t)} abbr={y.t} size={13} />
              Age {y.age} · {y.g}G {y.a}A
            </div>
          </div>
          <span className="lc-val tnum">
            {y.g + y.a}<span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, marginLeft: 3 }}>G+A</span>
          </span>
        </RowLink>
      ))}
    </div>
  );
}

function TeamStatsCard({ rows }: { rows: TeamStatEntry[] }) {
  const maxGoals = rows.length > 0 ? Math.max(...rows.map(t => t.gf)) : 1;
  return (
    <div className="t-card" style={{ marginTop: 18 }}>
      <div className="t-card-head">
        <h3>Team attack</h3>
        <span className="muted" style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Goals · poss</span>
      </div>
      <div className="tstat-row head">
        <span className="ts-rank">#</span>
        <span>Team</span>
        <span className="ts-num">Goals</span>
        <span className="ts-num" style={{ textAlign: 'right' }}>Poss</span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '12px 16px', color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 13 }}>
          No matches played yet
        </div>
      ) : rows.map((t, i) => (
        <div className="tstat-row" key={t.t}>
          <span className="ts-rank tnum">{i + 1}</span>
          <span className="ts-team">
            <Flag logo={teamFlagUrl(t.t)} abbr={t.t} size={18} />
            {countryName(t.t)}
          </span>
          <span className="ts-num" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ts-bar" style={{ flex: 1 }}>
              <i style={{ width: `${(t.gf / maxGoals) * 100}%` }} />
            </span>
            <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{t.gf}</span>
          </span>
          <span className="ts-poss tnum">{t.poss}%</span>
        </div>
      ))}
    </div>
  );
}

function GBHero({ rows }: { rows: ScorerEntry[] }) {
  const top = rows.slice(0, 3);
  return (
    <div className="gb-hero">
      <div className="gh-grain" />
      <div className="gh-in">
        <div className="gh-eyebrow">
          <span className="gh-dot" />
          Race for the Golden Boot
        </div>
        <div className="gh-podium">
          {top.map((p, i) => (
            <RowLink className={`ghp${i === 0 ? ' lead' : ''}`} key={p.p} fifaId={p.fifaId}>
              <div className="gp-top">
                <span className="gp-rank tnum">#{i + 1}</span>
                {i === 0 && <span className="gp-medal">Golden Boot</span>}
              </div>
              <div className="gp-name">{p.p}</div>
              <div className="gp-meta">
                <Flag logo={teamFlagUrl(p.t)} abbr={p.t} size={14} />
                {countryName(p.t)}
              </div>
              <div className="gp-goals tnum">
                {p.g}<span className="u">goals</span>
              </div>
            </RowLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function FullScorerList({ rows }: { rows: ScorerEntry[] }) {
  if (rows.length === 0) return (
    <div style={{ padding: '16px', color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 13 }}>
      No goals scored yet
    </div>
  );
  return (
    <div className="lead-table" style={{ marginTop: 18 }}>
      <div className="lt-row head">
        <span className="lt-rank">#</span>
        <span>Player</span>
        <span className="lt-num head lt-hide">MP</span>
        <span className="lt-num head lt-hide">A</span>
        <span className="lt-num head" style={{ textAlign: 'center' }}>Goals</span>
      </div>
      {rows.map((p, i) => (
        <RowLink className="lt-row" key={p.p} fifaId={p.fifaId}>
          <span className="lt-rank tnum">{i + 1}</span>
          <span className="lt-player">
            <Shot name={p.p} size={34} headshotUrl={p.photo} />
            <span className="lt-info">
              <span className="lt-name">{p.p}</span>
              <span className="lt-club">
                <Flag logo={teamFlagUrl(p.t)} abbr={p.t} size={14} />
                <span>{countryName(p.t)}</span>
              </span>
            </span>
          </span>
          <span className="lt-num tnum lt-hide">{p.mp}</span>
          <span className="lt-num tnum lt-hide">{p.a}</span>
          <span className="lt-main tnum">{p.g}</span>
        </RowLink>
      ))}
    </div>
  );
}

export function StatsClient() {
  const [stats, setStats] = useState<TournamentStats>(EMPTY_STATS);
  const [view, setView] = useState<'Leaderboard' | 'Spotlight'>('Leaderboard');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wc-stats-view') as 'Leaderboard' | 'Spotlight';
      if (saved === 'Spotlight') setView('Spotlight');
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: TournamentStats) => setStats(data))
      .catch(() => {}); // keep empty/dash state on error
  }, []);

  const handleView = (v: 'Leaderboard' | 'Spotlight') => {
    setView(v);
    try { localStorage.setItem('wc-stats-view', v); } catch {}
  };

  const { tallies, goldenBoot, assists, cleanSheets, saves, discipline, young, teamStats } = stats;
  const hasScorerPodium = goldenBoot.length >= 3;

  return (
    <>
      <PageHero
        eyebrow="2026 FIFA World Cup"
        title="Tournament Stats"
        titleRight={
          <div
            role="tablist"
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,.10)',
              border: '1px solid rgba(255,255,255,.16)',
              borderRadius: 'var(--r-sm)',
              padding: 3,
              gap: 2,
            }}
          >
            {([
              { v: 'Leaderboard' as const, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="3.2" rx="1.6" /><rect x="3" y="10.4" width="13" height="3.2" rx="1.6" /><rect x="3" y="15.8" width="8" height="3.2" rx="1.6" /></svg> },
              { v: 'Spotlight' as const, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 2.5 5.6 6.1.6-4.6 4 1.4 6L12 18.7 6.6 22l1.4-6-4.6-4 6.1-.6z" /></svg> },
            ]).map(({ v, icon }) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => handleView(v)}
                style={{
                  fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 12.5,
                  border: 'none', cursor: 'pointer', borderRadius: 7,
                  padding: '6px 13px', display: 'flex', alignItems: 'center', gap: 5,
                  background: view === v ? 'rgba(255,255,255,.18)' : 'none',
                  color: view === v ? '#fff' : 'rgba(255,255,255,.6)',
                  whiteSpace: 'nowrap',
                }}
              >
                {icon} {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="tally-strip">
        {(tallies as TallyItem[]).map((t, i) => (
          <div className="ts-cell" key={i}>
            {t.v2 !== undefined ? (
              <>
                <div className="ts-split">
                  <div><div className="v tnum">{t.v}</div><div className="k">{t.k}</div></div>
                  <div className="ts-divider" />
                  <div><div className="v tnum">{t.v2}</div><div className="k">{t.k2}</div></div>
                </div>
                <div className="s">{t.sub}</div>
              </>
            ) : (
              <>
                <div className="v tnum">{t.v}</div>
                <div className="k">{t.k}</div>
                <div className="s">{t.sub}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {view === 'Leaderboard' ? (
        <>
          <div className="section-head" style={{ marginTop: 28 }}>
            <h2>Golden Boot</h2>
            <span className="eyebrow">Top scorers</span>
          </div>
          {hasScorerPodium ? (
            <div className="gb-podium" style={{ marginTop: 14 }}>
              <Podium p={goldenBoot[0]} rank={1} />
              <Podium p={goldenBoot[1]} rank={2} />
              <Podium p={goldenBoot[2]} rank={3} />
            </div>
          ) : (
            <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 14 }}>
              No goals scored yet — check back after the first match
            </div>
          )}
          <GoldenBootTable rows={goldenBoot.slice(3)} />
          <TeamStatsCard rows={teamStats} />
          <div className="stats-duo">
            <CatPanel assists={assists} cleanSheets={cleanSheets} saves={saves} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <DisciplinePanel rows={discipline} />
              <YoungPanel rows={young} />
            </div>
          </div>
        </>
      ) : (
        <>
          {hasScorerPodium ? <GBHero rows={goldenBoot} /> : null}
          <FullScorerList rows={goldenBoot} />
          <TeamStatsCard rows={teamStats} />
          <div className="stats-duo">
            <CatPanel assists={assists} cleanSheets={cleanSheets} saves={saves} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <DisciplinePanel rows={discipline} />
              <YoungPanel rows={young} />
            </div>
          </div>
        </>
      )}

      <div className="foot-note" style={{ marginTop: 32 }}>
        <span>Stats update after each completed match</span>
        <span>Data source: ESPN API · aggregated per match</span>
      </div>
    </>
  );
}
