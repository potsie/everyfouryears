'use client';

import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { LocalTime } from '@/components/LocalTime';
import type { ScheduleMatch, ScheduleDay, ScheduleTeam, SeedTeam } from '@/lib/schedule-utils';
import { useLocalDays } from '@/lib/use-local-days';

function isSeed(t: ScheduleTeam | SeedTeam): t is SeedTeam {
  return (t as SeedTeam).tbd === true;
}

function MatchStatusCell({ m }: { m: ScheduleMatch }) {
  if (m.state === 'in') {
    return <span className="s-status s-live">{m.isShootout ? <><span className="pulse-dot" />PENALTIES</> : m.isHalftime ? <span style={{ color: 'var(--live-ink)', fontWeight: 700 }}>HALF TIME</span> : <><span className="pulse-dot" />{m.clock}</>}</span>;
  }
  if (m.state === 'post') {
    return <span className="s-status s-ft">FULL TIME</span>;
  }
  return <span className="s-status s-time tnum"><LocalTime iso={m.dateISO} /></span>;
}

function TeamCell({ team, side, lose, win }: { team: ScheduleTeam | SeedTeam; side: 'a' | 'b'; lose: boolean; win?: boolean }) {
  const cls = `s-team ${side}${lose ? ' lose' : ''}`;
  const mark = win ? <span className="s-win" style={{ color: 'var(--live-ink)', fontWeight: 800 }}>{side === 'a' ? '▸' : '◂'}</span> : null;
  if (isSeed(team)) {
    return <span className={cls}><span className="s-seed">{team.seed}</span></span>;
  }
  if (side === 'a') {
    return (
      <span className={cls}>
        {mark}
        <span className="s-code">{team.abbr}</span>
        <Flag logo={team.logo} abbr={team.abbr} size={22} />
      </span>
    );
  }
  return (
    <span className={cls}>
      <Flag logo={team.logo} abbr={team.abbr} size={22} />
      <span className="s-code">{team.abbr}</span>
      {mark}
    </span>
  );
}

function ScoreCell({ m }: { m: ScheduleMatch }) {
  if (m.state === 'pre') return <span className="s-score pre">vs</span>;
  if (!m.score) return <span className="s-score pre">—</span>;
  const [hs, as_] = m.score;
  return (
    <span className="s-score-wrap">
      <span className="s-score tnum">{hs}<span className="x">–</span>{as_}</span>
      {m.shootout && (
        <span className="s-pens tnum">{m.shootout[0]}–{m.shootout[1]} pens</span>
      )}
    </span>
  );
}

function FixtureRow({ m }: { m: ScheduleMatch }) {
  const post = m.state === 'post';
  const [hs, as_] = m.score ?? [0, 0];
  // A penalty tie is level on goals — the shootout score decides the winner.
  const so = m.shootout;
  const loseHome = post && (so ? so[0] < so[1] : !!m.score && hs < as_);
  const loseAway = post && (so ? so[1] < so[0] : !!m.score && as_ < hs);
  const winHome = post && (so ? so[0] > so[1] : !!m.score && hs > as_);
  const winAway = post && (so ? so[1] > so[0] : !!m.score && as_ > hs);
  const badge = m.groupLetter ? `GRP ${m.groupLetter}` : m.koAbbr ?? '';

  return (
    <Link href={`/match/${m.id}`} className="srow" style={{ textDecoration: 'none', color: 'inherit' }}>
      <MatchStatusCell m={m} />
      <TeamCell team={m.home} side="a" lose={loseHome} win={winHome} />
      <ScoreCell m={m} />
      <TeamCell team={m.away} side="b" lose={loseAway} win={winAway} />
      <span className="s-meta">
        {badge && <span className="s-grp">{badge}</span>}
      </span>
      <span className="s-tv tv" style={{ justifySelf: 'end' }}>{m.broadcaster}</span>
    </Link>
  );
}

export function VenueFixtures({ days: serverDays }: { days: ScheduleDay[] }) {
  // Re-bucket into the viewer's local timezone (seeded with the server's
  // Eastern grouping for first paint).
  const days = useLocalDays(serverDays);
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
