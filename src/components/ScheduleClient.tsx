'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { PageHero } from '@/components/PageHero';
import type { ScheduleDay, ScheduleMatch, ScheduleTeam, SeedTeam } from '@/lib/schedule-utils';
import { useLocalDays } from '@/lib/use-local-days';

// ── Icons ──────────────────────────────────────────────────────────────────

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PulseDot() {
  return <span className="pulse-dot" />;
}


function ChevRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isSeed(t: ScheduleTeam | SeedTeam): t is SeedTeam {
  return (t as SeedTeam).tbd === true;
}

function formatKickoff(dateISO: string): string {
  return new Date(dateISO).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// ── Row components ─────────────────────────────────────────────────────────

function MatchStatus({ m }: { m: ScheduleMatch }) {
  if (m.state === 'in') {
    if (m.isDelayed) {
      // Play stopped, clock frozen — static dot, amber, no pulse.
      return (
        <span className="s-status s-delayed" style={{ color: 'var(--delay-ink)', fontWeight: 700 }}>
          ● Delayed{m.clock ? ` · ${m.clock}` : ''}
        </span>
      );
    }
    return (
      <span className="s-status s-live">
        {m.isShootout ? <><PulseDot />PENALTIES</> : m.isHalftime ? <span style={{ color: 'var(--live-ink)', fontWeight: 700 }}>HALF TIME</span> : <><PulseDot />{m.clock}</>}
      </span>
    );
  }
  if (m.state === 'post') {
    return <span className="s-status s-ft">FULL TIME</span>;
  }
  return <span className="s-status s-time tnum">{formatKickoff(m.dateISO)}</span>;
}

function TeamCell({ team, side, lose, win }: { team: ScheduleTeam | SeedTeam; side: 'a' | 'b'; lose: boolean; win?: boolean }) {
  const loseClass = lose ? ' lose' : '';
  const mark = win ? <span className="s-win" style={{ color: 'var(--live-ink)', fontWeight: 800 }}>{side === 'a' ? '▸' : '◂'}</span> : null;

  if (isSeed(team)) {
    return (
      <span className={`s-team ${side}${loseClass}`}>
        <span className="s-seed">{team.seed}</span>
      </span>
    );
  }

  if (side === 'a') {
    return (
      <span className={`s-team a${loseClass}`}>
        {mark}
        <span className="s-code">{team.abbr}</span>
        <Flag logo={team.logo} abbr={team.abbr} size={22} />
      </span>
    );
  }
  return (
    <span className={`s-team b${loseClass}`}>
      <Flag logo={team.logo} abbr={team.abbr} size={22} />
      <span className="s-code">{team.abbr}</span>
      {mark}
    </span>
  );
}

function ScoreCell({ m }: { m: ScheduleMatch }) {
  if (m.state === 'pre') {
    return <span className="s-score pre">vs</span>;
  }
  if (!m.score) return <span className="s-score pre">—</span>;
  const [hs, as_] = m.score;
  return (
    <span className="s-score-wrap">
      <span className="s-score tnum">
        {hs}<span className="x">–</span>{as_}
      </span>
      {m.shootout && (
        <span className="s-pens tnum">{m.shootout[0]}–{m.shootout[1]} pens</span>
      )}
    </span>
  );
}

function ScheduleRow({ m }: { m: ScheduleMatch }) {
  const post = m.state === 'post';
  const [hs, as_] = m.score ?? [0, 0];
  // A penalty tie is level on goals — the shootout score decides the winner.
  const so = m.shootout;
  const loseHome = post && (so ? so[0] < so[1] : !!m.score && hs < as_);
  const loseAway = post && (so ? so[1] < so[0] : !!m.score && as_ < hs);
  const winHome = post && (so ? so[0] > so[1] : !!m.score && hs > as_);
  const winAway = post && (so ? so[1] > so[0] : !!m.score && as_ > hs);

  const badge = m.groupLetter
    ? `GRP ${m.groupLetter}`
    : m.koAbbr ?? '';

  return (
    <Link
      href={`/match/${m.id}`}
      className="srow"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <MatchStatus m={m} />
      <TeamCell team={m.home} side="a" lose={loseHome} win={winHome} />
      <ScoreCell m={m} />
      <TeamCell team={m.away} side="b" lose={loseAway} win={winAway} />
      <span className="s-meta">
        {badge && <span className="s-grp">{badge}</span>}
        <span className="s-ven">
          <PinIcon />
          <span>{m.venue} · {m.city}</span>
        </span>
      </span>
      <span className="s-tv tv">{m.broadcaster}</span>
    </Link>
  );
}

function DaySection({ day }: { day: ScheduleDay }) {
  return (
    <section
      className={`sday${day.isToday ? ' is-today' : ''}`}
      id={`day-${day.key}`}
    >
      <div className="sday-head">
        <h3>{day.dateLabel}</h3>
        <span className="stage">{day.stageLabel}</span>
        {day.isToday && <span className="todaytag">● Today</span>}
        <span className="cnt">
          {day.matches.length} {day.matches.length === 1 ? 'match' : 'matches'}
        </span>
      </div>
      <div className="slist">
        {day.matches.map(m => <ScheduleRow key={m.id} m={m} />)}
      </div>
    </section>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

interface ScheduleClientProps {
  days: ScheduleDay[];
  singleDay?: boolean;
  // For single-day pages: the local-zone day key (YYYY-MM-DD) to show. After the
  // client re-buckets into the viewer's zone, only this day is rendered.
  selectedDate?: string;
  groupTeams?: Record<string, string[]>;
}

export function ScheduleClient({ days: serverDays, singleDay = false, selectedDate, groupTeams = {} }: ScheduleClientProps) {
  const [stage, setStage] = useState<'all' | 'group' | 'ko'>('all');
  const [grp, setGrp] = useState('all');

  // Re-bucket into the viewer's local timezone (seeded with the server's
  // Eastern grouping for first paint).
  const localDays = useLocalDays(serverDays);
  const days = (singleDay && selectedDate)
    ? localDays.filter(d => d.key === selectedDate)
    : localDays;

  const jumpToday = useCallback(() => {
    const todayDay = days.find(d => d.isToday);
    if (!todayDay) return;
    const el = document.getElementById(`day-${todayDay.key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [days]);

  const filteredDays = days
    .map(d => {
      let ms = d.matches;
      if (stage === 'group') ms = ms.filter(m => m.seasonTypeId === 1);
      else if (stage === 'ko') ms = ms.filter(m => m.seasonTypeId > 1);
      if (grp !== 'all') {
        const abbrs = new Set(groupTeams[grp] ?? []);
        ms = ms.filter(m =>
          (!isSeed(m.home) && abbrs.has(m.home.abbr)) ||
          (!isSeed(m.away) && abbrs.has(m.away.abbr))
        );
      }
      return { ...d, matches: ms };
    })
    .filter(d => d.matches.length > 0);

  return (
    <div className="page">
      {!singleDay && (
        <>
          <PageHero
            eyebrow="2026 FIFA World Cup"
            title="Match Schedule"
            sub={<>
              <span style={{ color: '#fff', fontWeight: 700 }}>104</span> matches
              <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>16</span> venues
              <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
              Jun 11 – Jul 19, 2026
            </>}
          />

          <div className="filters">
            <div className="seg">
              {(['all', 'group', 'ko'] as const).map((v, i) => (
                <button
                  key={v}
                  className={stage === v ? 'on' : ''}
                  onClick={() => setStage(v)}
                >
                  {['All', 'Group Stage', 'Knockout'][i]}
                </button>
              ))}
            </div>

            <select
              className="fselect"
              value={grp}
              onChange={e => setGrp(e.target.value)}
              disabled={stage === 'ko'}
            >
              <option value="all">All groups</option>
              {GROUP_LETTERS.map(g => (
                <option key={g} value={g}>Group {g}</option>
              ))}
            </select>

            <div className="fspace" />

            <button className="btn btn-primary" onClick={jumpToday}>
              Jump to today <ChevRight />
            </button>
          </div>
        </>
      )}

      {singleDay && filteredDays[0] && (
        <PageHero
          eyebrow="2026 FIFA World Cup · Schedule"
          title={filteredDays[0].dateLabel}
          sub={<>
            <span style={{ color: '#fff', fontWeight: 700 }}>{filteredDays[0].matches.length}</span> match{filteredDays[0].matches.length !== 1 ? 'es' : ''}
            <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
            {filteredDays[0].stageLabel}
          </>}
        />
      )}

      {filteredDays.length === 0 ? (
        <div className="slist" style={{ marginTop: 20 }}>
          <div className="sched-empty">No matches match these filters.</div>
        </div>
      ) : (
        filteredDays.map(d => <DaySection key={d.key} day={d} />)
      )}

      <div className="foot-note">
        <span>Data updates live during matches · all times in your local timezone</span>
        <span>Where to watch: FOX · FS1 · Telemundo · Peacock</span>
      </div>
    </div>
  );
}
