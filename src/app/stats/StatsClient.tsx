'use client';

import { useState, useEffect } from 'react';
import { Flag } from '@/components/Flag';
import { Shot } from '@/components/Shot';
import {
  TALLIES, GOLDEN_BOOT, ASSISTS, CLEAN_SHEETS, SAVES, DISCIPLINE, YOUNG, TEAM_STATS,
} from '@/lib/stats-mock';
import type { ScorerEntry, LeadEntry, DisciplineEntry, YoungEntry, TeamStatEntry } from '@/lib/stats-mock';

function teamFlagUrl(abbr: string) {
  return `https://a.espncdn.com/i/teamlogos/countries/500/${abbr.toLowerCase()}.png`;
}

const MEDALS = ['Golden Boot', 'Silver', 'Bronze'];

function Podium({ p, rank }: { p: ScorerEntry; rank: 1 | 2 | 3 }) {
  return (
    <div className={`podium p${rank}`}>
      <span className="pd-rank tnum">#{rank}</span>
      <span className="pd-medal">{MEDALS[rank - 1]}</span>
      <Shot name={p.p} size={rank === 1 ? 64 : 56} />
      <div className="pd-name">{p.p}</div>
      <div className="pd-team">
        <Flag logo={teamFlagUrl(p.t)} abbr={p.t} size={16} />
        {p.t}
      </div>
      <div className="pd-goals tnum">{p.g}<span className="u">goals</span></div>
      <div className="pd-line">
        <div className="m"><span className="mv tnum">{p.mp}</span><span className="mk">Played</span></div>
        <div className="m"><span className="mv tnum">{p.a}</span><span className="mk">Assists</span></div>
        <div className="m"><span className="mv tnum">{p.pens}</span><span className="mk">Pens</span></div>
      </div>
    </div>
  );
}

function GoldenBootTable({ rows }: { rows: ScorerEntry[] }) {
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
        <div className="lt-row" key={p.p}>
          <span className="lt-rank tnum">{i + 4}</span>
          <span className="lt-player">
            <Shot name={p.p} size={34} />
            <span className="lt-info">
              <span className="lt-name">{p.p}</span>
              <span className="lt-club">
                <Flag logo={teamFlagUrl(p.t)} abbr={p.t} size={14} />
                <span>{p.club}</span>
              </span>
            </span>
          </span>
          <span className="lt-num tnum lt-hide">{p.mp}</span>
          <span className="lt-num tnum lt-hide">{p.a}</span>
          <span className="lt-main tnum">{p.g}</span>
        </div>
      ))}
    </div>
  );
}

function LeaderList({ rows, green }: { rows: LeadEntry[]; green?: boolean }) {
  return (
    <>
      {rows.slice(0, 6).map((r, i) => (
        <div className="lead-card" key={r.p}>
          <span className="lc-rank tnum">{i + 1}</span>
          <div className="lc-info">
            <div className="lc-name">{r.p}</div>
            <div className="lc-meta">
              <Flag logo={teamFlagUrl(r.t)} abbr={r.t} size={13} />
              {r.club}
            </div>
          </div>
          <span className={`lc-val tnum${green ? ' green' : ''}`}>{r.v}</span>
        </div>
      ))}
    </>
  );
}

type CatKey = 'Assists' | 'Clean sheets' | 'Saves';
const CATS: Array<{ key: CatKey; rows: LeadEntry[] }> = [
  { key: 'Assists',      rows: ASSISTS },
  { key: 'Clean sheets', rows: CLEAN_SHEETS },
  { key: 'Saves',        rows: SAVES },
];

function CatPanel() {
  const [cat, setCat] = useState<CatKey>('Assists');
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

function DisciplinePanel() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Discipline</h3>
        <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Most booked</span>
      </div>
      {DISCIPLINE.map((d: DisciplineEntry, i) => (
        <div className="lead-card" key={d.p}>
          <span className="lc-rank tnum">{i + 1}</span>
          <div className="lc-info">
            <div className="lc-name">{d.p}</div>
            <div className="lc-meta">
              <Flag logo={teamFlagUrl(d.t)} abbr={d.t} size={13} />
              {d.club}
            </div>
          </div>
          <span className="disc-badges">
            {Array.from({ length: d.y }).map((_, k) => <span className="card y" key={`y${k}`} />)}
            {Array.from({ length: d.r }).map((_, k) => <span className="card r" key={`r${k}`} />)}
          </span>
        </div>
      ))}
    </div>
  );
}

function YoungPanel() {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Best young player</h3>
        <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Under 21</span>
      </div>
      {YOUNG.map((y: YoungEntry, i) => (
        <div className="lead-card" key={y.p}>
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
        </div>
      ))}
    </div>
  );
}

function TeamStatsCard() {
  const maxGoals = Math.max(...TEAM_STATS.map(t => t.gf));
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
      {TEAM_STATS.map((t: TeamStatEntry, i) => (
        <div className="tstat-row" key={t.t}>
          <span className="ts-rank tnum">{i + 1}</span>
          <span className="ts-team">
            <Flag logo={teamFlagUrl(t.t)} abbr={t.t} size={18} />
            {t.t}
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

function GBHero() {
  const top = GOLDEN_BOOT.slice(0, 3);
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
            <div className={`ghp${i === 0 ? ' lead' : ''}`} key={p.p}>
              <div className="gp-top">
                <span className="gp-rank tnum">#{i + 1}</span>
                {i === 0 && <span className="gp-medal">Golden Boot</span>}
              </div>
              <div className="gp-name">{p.p}</div>
              <div className="gp-meta">
                <Flag logo={teamFlagUrl(p.t)} abbr={p.t} size={14} />
                {p.t}
                <span className="sep">·</span>
                {p.club}
              </div>
              <div className="gp-goals tnum">
                {p.g}<span className="u">goals</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FullScorerList() {
  return (
    <div className="lead-table" style={{ marginTop: 18 }}>
      <div className="lt-row head">
        <span className="lt-rank">#</span>
        <span>Player</span>
        <span className="lt-num head lt-hide">MP</span>
        <span className="lt-num head lt-hide">A</span>
        <span className="lt-num head" style={{ textAlign: 'center' }}>Goals</span>
      </div>
      {GOLDEN_BOOT.map((p, i) => (
        <div className="lt-row" key={p.p}>
          <span className="lt-rank tnum">{i + 1}</span>
          <span className="lt-player">
            <Shot name={p.p} size={34} />
            <span className="lt-info">
              <span className="lt-name">{p.p}</span>
              <span className="lt-club">
                <Flag logo={teamFlagUrl(p.t)} abbr={p.t} size={14} />
                <span>{p.club}</span>
              </span>
            </span>
          </span>
          <span className="lt-num tnum lt-hide">{p.mp}</span>
          <span className="lt-num tnum lt-hide">{p.a}</span>
          <span className="lt-main tnum">{p.g}</span>
        </div>
      ))}
    </div>
  );
}

export function StatsClient() {
  const [view, setView] = useState<'Leaderboard' | 'Spotlight'>('Leaderboard');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wc-stats-view') as 'Leaderboard' | 'Spotlight';
      if (saved === 'Spotlight') setView('Spotlight');
    } catch {}
  }, []);

  const handleView = (v: 'Leaderboard' | 'Spotlight') => {
    setView(v);
    try { localStorage.setItem('wc-stats-view', v); } catch {}
  };

  return (
    <>
      <div className="stats-head-row">
        <div>
          <div className="eyebrow">2026 FIFA World Cup</div>
          <h1>Tournament Stats</h1>
        </div>
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={view === 'Leaderboard'} className={view === 'Leaderboard' ? 'on' : ''} onClick={() => handleView('Leaderboard')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="3.2" rx="1.6" />
              <rect x="3" y="10.4" width="13" height="3.2" rx="1.6" />
              <rect x="3" y="15.8" width="8" height="3.2" rx="1.6" />
            </svg>
            Leaderboard
          </button>
          <button role="tab" aria-selected={view === 'Spotlight'} className={view === 'Spotlight' ? 'on' : ''} onClick={() => handleView('Spotlight')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="m12 3 2.5 5.6 6.1.6-4.6 4 1.4 6L12 18.7 6.6 22l1.4-6-4.6-4 6.1-.6z" />
            </svg>
            Spotlight
          </button>
        </div>
      </div>

      {/* tournament tally strip */}
      <div className="tally-strip">
        {TALLIES.map((t, i) => (
          <div className="ts-cell" key={i}>
            <div className="v tnum">{t.v}</div>
            <div className="k">{t.k}</div>
            <div className="s">{t.sub}</div>
          </div>
        ))}
      </div>

      {view === 'Leaderboard' ? (
        <>
          <div className="section-head" style={{ marginTop: 28 }}>
            <h2>Golden Boot</h2>
            <span className="eyebrow">Top scorers</span>
          </div>
          <div className="gb-podium" style={{ marginTop: 14 }}>
            <Podium p={GOLDEN_BOOT[0]} rank={1} />
            <Podium p={GOLDEN_BOOT[1]} rank={2} />
            <Podium p={GOLDEN_BOOT[2]} rank={3} />
          </div>
          <GoldenBootTable rows={GOLDEN_BOOT.slice(3)} />
          <TeamStatsCard />
          <div className="stats-duo">
            <CatPanel />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <DisciplinePanel />
              <YoungPanel />
            </div>
          </div>
        </>
      ) : (
        <>
          <GBHero />
          <FullScorerList />
          <TeamStatsCard />
          <div className="stats-duo">
            <CatPanel />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <DisciplinePanel />
              <YoungPanel />
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
