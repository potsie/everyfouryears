'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Flag } from '@/components/Flag';
import type { ScheduleDay, ScheduleMatch, ScheduleTeam, SeedTeam } from '@/lib/schedule-utils';

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

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 6" />
    </svg>
  );
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
    return (
      <span className="s-status s-live">
        <PulseDot />{m.clock}
      </span>
    );
  }
  if (m.state === 'post') {
    return <span className="s-status s-ft">FULL TIME</span>;
  }
  return <span className="s-status s-time tnum">{formatKickoff(m.dateISO)}</span>;
}

function TeamCell({ team, side, lose }: { team: ScheduleTeam | SeedTeam; side: 'a' | 'b'; lose: boolean }) {
  const loseClass = lose ? ' lose' : '';

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
        <span className="s-code">{team.abbr}</span>
        <Flag logo={team.logo} abbr={team.abbr} size={22} />
      </span>
    );
  }
  return (
    <span className={`s-team b${loseClass}`}>
      <Flag logo={team.logo} abbr={team.abbr} size={22} />
      <span className="s-code">{team.abbr}</span>
    </span>
  );
}

function ScoreCell({ m, hide }: { m: ScheduleMatch; hide: boolean }) {
  if (m.state === 'pre') {
    return <span className="s-score pre">vs</span>;
  }
  if (hide) {
    return (
      <span className="s-score" style={{ color: 'var(--ink-3)', letterSpacing: '.1em' }}>···</span>
    );
  }
  if (!m.score) return <span className="s-score pre">—</span>;
  const [hs, as_] = m.score;
  return (
    <span className="s-score tnum">
      {hs}<span className="x">–</span>{as_}
    </span>
  );
}

function ScheduleRow({ m, hide }: { m: ScheduleMatch; hide: boolean }) {
  const post = m.state === 'post';
  const [hs, as_] = m.score ?? [0, 0];
  const loseHome = post && !!m.score && hs < as_;
  const loseAway = post && !!m.score && as_ < hs;

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
      <TeamCell team={m.home} side="a" lose={loseHome} />
      <ScoreCell m={m} hide={hide} />
      <TeamCell team={m.away} side="b" lose={loseAway} />
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

function DaySection({ day, hide }: { day: ScheduleDay; hide: boolean }) {
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
        {day.matches.map(m => <ScheduleRow key={m.id} m={m} hide={hide} />)}
      </div>
    </section>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

interface ScheduleClientProps {
  days: ScheduleDay[];
  singleDay?: boolean;
  groupTeams?: Record<string, string[]>;
}

export function ScheduleClient({ days, singleDay = false, groupTeams = {} }: ScheduleClientProps) {
  const [stage, setStage] = useState<'all' | 'group' | 'ko'>('all');
  const [grp, setGrp] = useState('all');
  const [hide, setHide] = useState(false);

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
          <div className="pagehead">
            <div className="eyebrow">2026 FIFA World Cup</div>
            <h1>Match Schedule</h1>
            <div className="sub">
              <span className="b tnum">104</span> matches
              <span className="sep">·</span>
              <span className="b tnum">16</span> venues
              <span className="sep">·</span>
              Jun 11 – Jul 19, 2026
            </div>
          </div>

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

            <button className={`chk${hide ? ' on' : ''}`} onClick={() => setHide(h => !h)}>
              <span className="box">{hide && <CheckIcon />}</span>
              Hide scores
            </button>

            <div className="fspace" />

            <button className="btn btn-primary" onClick={jumpToday}>
              Jump to today <ChevRight />
            </button>
          </div>
        </>
      )}

      {singleDay && filteredDays[0] && (
        <div className="pagehead">
          <div className="eyebrow">2026 FIFA World Cup · Schedule</div>
          <h1>{filteredDays[0].dateLabel}</h1>
          <div className="sub">
            <span className="b tnum">{filteredDays[0].matches.length}</span> match{filteredDays[0].matches.length !== 1 ? 'es' : ''}
            <span className="sep">·</span>
            {filteredDays[0].stageLabel}
          </div>
        </div>
      )}

      {filteredDays.length === 0 ? (
        <div className="slist" style={{ marginTop: 20 }}>
          <div className="sched-empty">No matches match these filters.</div>
        </div>
      ) : (
        filteredDays.map(d => <DaySection key={d.key} day={d} hide={hide} />)
      )}

      <div className="foot-note">
        <span>Data updates live during matches · all times in your local timezone</span>
        <span>Where to watch: FOX · FS1 · Telemundo · Peacock</span>
      </div>
    </div>
  );
}
