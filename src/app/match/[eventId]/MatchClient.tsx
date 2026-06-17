'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { Shot } from '@/components/Shot';
import { GroupMini, type GroupMiniRow } from '@/components/GroupMini';
import { VenueWeather } from '@/components/VenueWeather';
import type { WeatherData } from '@/lib/weather';
import { physicalLeaders, type PmsrData } from '@/lib/pmsr';
import type {
  MatchCenterData,
  MatchKeyEvent,
  MatchStat,
  CommentaryEntry,
  MatchCenterTeam,
  MatchBroadcast,
  MatchBenchPlayer,
  ShotEvent,
  TeamForm,
} from '@/lib/normalize/world-cup-normalizer';

/* ---- inline SVG icons ---- */
function Back() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PinSm() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function RefIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.2a3.2 3.2 0 0 1 0 6M17 14.5a5.5 5.5 0 0 1 3.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function TvIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="m8 21 4-3 4 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function WhistleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M3 9h11l6-3v9a5 5 0 0 1-5 5 5 5 0 0 1-5-5H3a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="13" cy="14" r="2.4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}
function SubArrows() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M7 4v13m0 0 3-3m-3 3-3-3M17 20V7m0 0 3 3m-3-3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PulseDot() {
  return (
    <span
      className="pulse-dot"
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: 'var(--live)',
        flexShrink: 0,
      }}
    />
  );
}

/* ---- countdown to kickoff ---- */
function useTimeUntil(isoDate: string) {
  const target = new Date(isoDate).getTime();
  const [diff, setDiff] = useState<number | null>(null);
  useEffect(() => {
    setDiff(target - Date.now());
    const id = setInterval(() => setDiff(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return diff;
}

function StartsIn({ iso }: { iso: string }) {
  const diff = useTimeUntil(iso);
  if (diff === null || diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  let label: string;
  if (days > 0) label = `${days}d ${hours}h ${mins}m`;
  else if (hours > 0) label = `${hours}h ${mins}m ${secs}s`;
  else label = `${mins}m ${secs}s`;
  return <span className="starts-in">Starts in {label}</span>;
}

/* ---- date/time helpers ---- */
function formatKickoffDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}
function formatKickoffTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

/* ==============================================================
   MATCH HERO
   ============================================================== */
function MatchHero({ match, venueSlug }: { match: MatchCenterData; venueSlug?: string }) {
  const { state, home, away, kickoffISO, group, matchday, venue, venueCity, officials, clock, attendance } = match;
  const referee = officials.find(o => o.role === 'Referee') ?? officials[0];

  const homeScore = home.score;
  const awayScore = away.score;

  const loseHome = state === 'post' && homeScore !== null && awayScore !== null && homeScore < awayScore;
  const loseAway = state === 'post' && homeScore !== null && awayScore !== null && awayScore < homeScore;

  const kickoffDate = formatKickoffDate(kickoffISO);
  const kickoffTime = formatKickoffTime(kickoffISO);

  return (
    <div className="mh">
      <div className="mh-grain" />
      <div className="mh-in">
        <div className="mh-top">
          <Link href="/schedule" className="mh-back">
            <Back /> Schedule
          </Link>
          <span className="mh-meta">
            {group && (
              <>
                <span className="gtag">GROUP {group}</span>
                <span className="sep">·</span>
              </>
            )}
            <span>{matchday}</span>
            <span className="sep">·</span>
            <span>{kickoffDate}</span>
          </span>
        </div>

        <div className="mh-score">
          {/* Home */}
          <div className={'mh-team' + (loseHome ? ' lose' : '')}>
            <Flag logo={home.logo} abbr={home.abbr} size={56} className="fl" />
            <div className="code">{home.abbr}</div>
            <div className="nm">{home.name}</div>
            {state === 'post' && homeScore !== null && awayScore !== null && homeScore > awayScore && (
              <div className="wintag">● Winner</div>
            )}
          </div>

          {/* Center */}
          <div className="mh-center">
            {state === 'in' && (
              <div className="mh-status live">
                {match.isHalftime
                  ? 'HALF TIME'
                  : <><PulseDot /> {clock} · Live</>
                }
              </div>
            )}
            {state === 'post' && <div className="mh-status ft">FULL TIME</div>}

            {state === 'pre' ? (
              <>
                <div className="mh-kick">VS</div>
                <div className="mh-when">{kickoffTime} kick-off</div>
                <StartsIn iso={kickoffISO} />
              </>
            ) : (
              <div className="mh-nums tnum">
                <span className={'n' + (loseHome ? ' dim' : '')}>{homeScore ?? 0}</span>
                <span className="dash">–</span>
                <span className={'n' + (loseAway ? ' dim' : '')}>{awayScore ?? 0}</span>
              </div>
            )}
          </div>

          {/* Away */}
          <div className={'mh-team' + (loseAway ? ' lose' : '')}>
            <Flag logo={away.logo} abbr={away.abbr} size={56} className="fl" />
            <div className="code">{away.abbr}</div>
            <div className="nm">{away.name}</div>
            {state === 'post' && awayScore !== null && homeScore !== null && awayScore > homeScore && (
              <div className="wintag">● Winner</div>
            )}
          </div>
        </div>

        <div className="mh-foot">
          {venueSlug ? (
            <Link href={`/venue/${venueSlug}`} className="it" style={{ textDecoration: 'none', color: 'inherit' }}>
              <PinSm /> {venue}{venueCity ? ` · ${venueCity}` : ''}
            </Link>
          ) : (
            <span className="it"><PinSm /> {venue}{venueCity ? ` · ${venueCity}` : ''}</span>
          )}
          {state !== 'pre' && attendance !== null && (
            <span className="it"><PeopleIcon /> {attendance.toLocaleString()} attendance</span>
          )}
          {referee && (
            <span className="it">
              <WhistleIcon /> {referee.name}{referee.country ? ` · ${referee.country}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==============================================================
   TIMELINE
   ============================================================== */
function evMinute(e: MatchKeyEvent): string {
  return e.at + (e.extra ? `+${e.extra}` : '') + "'";
}

function EventIcon({ e }: { e: MatchKeyEvent }) {
  if (e.type === 'goal' || e.type === 'pen' || e.type === 'og') {
    return <span className="tl-icn goal">⚽</span>;
  }
  if (e.type === 'yellow') return <span className="tl-icn card-y" />;
  if (e.type === 'red') return <span className="tl-icn card-r" />;
  if (e.type === 'sub') return <span className="tl-icn sub"><SubArrows /></span>;
  return <span className="tl-icn sub">VAR</span>;
}

function Timeline({ match }: { match: MatchCenterData }) {
  const { state, events, home, away } = match;
  const homeScore = home.score ?? 0;
  const awayScore = away.score ?? 0;

  const shown = state === 'post'
    ? events
    : events.filter(e => e.type !== 'whistle');

  let htInserted = false;
  const rows: React.ReactNode[] = [];

  shown.forEach((e, i) => {
    // Insert HT marker before first event at/after minute 46
    if (!htInserted && e.at >= 46 && e.type !== 'whistle') {
      // Find score at HT from the last goal before minute 46
      const htGoals = events.filter(ev => (ev.type === 'goal' || ev.type === 'pen' || ev.type === 'og') && ev.at < 46);
      const lastHT = htGoals[htGoals.length - 1];
      const htH = lastHT?.scoreHome ?? 0;
      const htA = lastHT?.scoreAway ?? 0;
      rows.push(
        <div className="tl-mark" key="ht">
          <span>Half Time · {htH}–{htA}</span>
        </div>
      );
      htInserted = true;
    }

    if (e.type === 'whistle') {
      rows.push(
        <div className="tl-mark" key={`w${i}`}>
          <span>{e.detail} · {homeScore}–{awayScore}</span>
        </div>
      );
      return;
    }

    const isGoal = e.type === 'goal' || e.type === 'pen' || e.type === 'og';
    const side = e.team === 'home' ? 'home' : 'away';

    rows.push(
      <div className={`tl-row ${side}${isGoal ? ' goal' : ''}`} key={i}>
        <div className="tl-card">
          <EventIcon e={e} />
          <span className="pl">{e.player}</span>
          {e.detail && <span className="dt">{e.detail}</span>}
          {isGoal && e.scoreHome !== null && e.scoreAway !== null && (
            <span className="tl-score tnum">{e.scoreHome}–{e.scoreAway}</span>
          )}
        </div>
        <span className="tl-min tnum">{evMinute(e)}</span>
      </div>
    );
  });

  // Add "live now" marker for in-progress matches
  if (state === 'in') {
    rows.push(
      <div className="tl-mark" key="livenow">
        <span style={{ color: 'var(--live-ink)', background: 'var(--live-soft)', borderColor: '#cfe8d8' }}>
          {match.isHalftime ? '● Half Time' : `● Live · ${match.clock}`}
        </span>
      </div>
    );
  }

  return <div className="tl">{rows}</div>;
}

/* ==============================================================
   STAT BARS
   ============================================================== */
function StatBar({ s }: { s: MatchStat }) {
  const max = s.pct ? (s.home + s.away) || 1 : Math.max(s.home, s.away) || 1;
  const hp = (s.home / max) * 100;
  const ap = (s.away / max) * 100;
  const fmt = (v: number) => (Number.isInteger(v) ? v : v.toFixed(1)) + (s.unit ?? '');
  return (
    <div className="sbar">
      <div className="sbar-top">
        <span className={'v' + (s.home < s.away ? ' dim' : '')}>{fmt(s.home)}</span>
        <span className="lab">{s.label}</span>
        <span className={'v away' + (s.away < s.home ? ' dim' : '')}>{fmt(s.away)}</span>
      </div>
      <div className="sbar-track">
        <span className="hbg"><i style={{ width: `${hp}%` }} /></span>
        <span className="abg"><i style={{ width: `${ap}%` }} /></span>
      </div>
    </div>
  );
}

function PossessionHeader({ stats, homeAbbr, awayAbbr }: { stats: MatchStat[]; homeAbbr: string; awayAbbr: string }) {
  const p = stats[0];
  if (!p) return null;
  return (
    <div className="poss">
      <div className="poss-side h">
        <div className="p tnum">{p.home}%</div>
        <div className="l">{homeAbbr}</div>
      </div>
      <div
        className="poss-ring"
        style={{ background: `conic-gradient(var(--team-home) 0 ${p.home}%, var(--team-away) ${p.home}% 100%)` }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
          <span className="cap">Poss.</span>
        </div>
      </div>
      <div className="poss-side a">
        <div className="p tnum">{p.away}%</div>
        <div className="l">{awayAbbr}</div>
      </div>
    </div>
  );
}

/* ==============================================================
   FIFA PMSR: EXPECTED GOALS + PHYSICAL
   ============================================================== */
// xG comes from FIFA's Post-Match Summary Report, not ESPN. Rendered with the
// same proportional bar as the team stats, but to 2 decimals (xG convention).
function XgBar({ home, away }: { home: number; away: number }) {
  const total = home + away || 1;
  return (
    <div className="sbar">
      <div className="sbar-top">
        <span className={'v' + (home < away ? ' dim' : '')}>{home.toFixed(2)}</span>
        <span className="lab">Expected goals (xG)</span>
        <span className={'v away' + (away < home ? ' dim' : '')}>{away.toFixed(2)}</span>
      </div>
      <div className="sbar-track">
        <span className="hbg"><i style={{ width: `${(home / total) * 100}%` }} /></span>
        <span className="abg"><i style={{ width: `${(away / total) * 100}%` }} /></span>
      </div>
    </div>
  );
}

function PhysicalCard({ pmsr }: { pmsr: PmsrData }) {
  const leaders = physicalLeaders(pmsr);
  const dh = pmsr.home.totalDistanceKm;
  const da = pmsr.away.totalDistanceKm;
  const highlights: Array<{ label: string; leader: typeof leaders.topSpeed; fmt: (v: number) => string }> = [
    { label: 'Top speed', leader: leaders.topSpeed, fmt: v => `${v.toFixed(1)} km/h` },
    { label: 'Most sprints', leader: leaders.mostSprints, fmt: v => `${v}` },
    { label: 'Most distance', leader: leaders.mostDistance, fmt: v => `${(v / 1000).toFixed(1)} km` },
  ];
  return (
    <div className="mc-card">
      <div className="mc-head">
        <h3 style={{ textTransform: 'uppercase' }}>Running &amp; physical</h3>
        <span className="sub" style={{ fontSize: 11, fontWeight: 600 }}>FIFA report</span>
      </div>

      {dh != null && da != null && (
        <div className="stats-wrap">
          <div className="sbar">
            <div className="sbar-top">
              <span className={'v' + (dh < da ? ' dim' : '')}>{dh.toFixed(1)} km</span>
              <span className="lab">Distance covered</span>
              <span className={'v away' + (da < dh ? ' dim' : '')}>{da.toFixed(1)} km</span>
            </div>
            <div className="sbar-track">
              <span className="hbg"><i style={{ width: `${(dh / (dh + da)) * 100}%` }} /></span>
              <span className="abg"><i style={{ width: `${(da / (dh + da)) * 100}%` }} /></span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 16px 14px' }}>
        {highlights.map(({ label, leader, fmt }) => leader && (
          <div key={label} style={{ background: 'var(--surface-2, rgba(0,0,0,.03))', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em' }}>{label}</div>
            <div className="tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{fmt(leader.value)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
              {leader.athleteId
                ? <Link href={`/player/${leader.athleteId}`} style={{ color: 'var(--ink-2)' }}>{leader.name}</Link>
                : leader.name}
              {leader.abbr ? <span style={{ color: 'var(--ink-3)' }}> · {leader.abbr}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==============================================================
   SHOT CHART
   ============================================================== */
// Home markers are white (contrast against green pitch); away markers are gold.
const SHOT_COLORS = { home: '#FFFFFF', away: '#FFD100' } as const;

// SVG viewBox is 100×140 to match the 5:7 pitch aspect ratio — circles stay round.
const VB_H = 140;
const R_ATTEMPT = 2.4;
const R_GOAL = 3.2;
const R_OUTER = R_GOAL + 1.6;  // outer dashed ring for 2H goals

function ShotMarker({ s }: { s: ShotEvent }) {
  const color = SHOT_COLORS[s.side];
  const cx = s.y;
  const cy = (s.side === 'home' ? (100 - s.x) : s.x) * (VB_H / 100);
  const isGoal = s.outcome === 'goal';
  const isH2 = s.period === 2;
  const r = isGoal ? R_GOAL : R_ATTEMPT;

  if (isGoal && isH2) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.8} />
        <circle cx={cx} cy={cy} r={R_OUTER} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={R_OUTER} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2 1.5" />
      </g>
    );
  }
  if (isGoal) {
    return (
      <circle cx={cx} cy={cy} r={r} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.8} />
    );
  }
  if (isH2) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2 1.5" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1} />
    </g>
  );
}

function LegendDot({ color, isGoal, isH2 }: { color: string; isGoal: boolean; isH2: boolean }) {
  const size = 20;
  const c = size / 2;
  const r = isGoal ? 5 : 4;
  if (isGoal && isH2) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={c} cy={c} r={r} fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8} />
        <circle cx={c} cy={c} r={r + 2.5} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      </svg>
    );
  }
  if (isGoal) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={c} cy={c} r={r} fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8} />
      </svg>
    );
  }
  if (isH2) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={2} strokeDasharray="3 2" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

function ShotChart({ shots, home, away }: { shots: ShotEvent[]; home: MatchCenterTeam; away: MatchCenterTeam }) {
  if (shots.length === 0) return null;

  const homeGoals = shots.filter(s => s.side === 'home' && s.outcome === 'goal').length;
  const homeAttempts = shots.filter(s => s.side === 'home').length;
  const awayGoals = shots.filter(s => s.side === 'away' && s.outcome === 'goal').length;
  const awayAttempts = shots.filter(s => s.side === 'away').length;

  // Render attempts before goals so goals appear on top
  const sorted = [...shots].sort((a, b) => (a.outcome === 'goal' ? 1 : 0) - (b.outcome === 'goal' ? 1 : 0));

  return (
    <div className="sc-wrap">
      <div className="sc-head">
        <div className="sc-team">
          <Flag logo={home.logo} abbr={home.abbr} size={16} />
          <span className="sc-abbr">{home.abbr}</span>
          <span className="sc-tally">{homeGoals}G · {homeAttempts} shots</span>
        </div>
        <span className="sc-title">Shot map</span>
        <div className="sc-team right">
          <span className="sc-tally">{awayGoals}G · {awayAttempts} shots</span>
          <span className="sc-abbr">{away.abbr}</span>
          <Flag logo={away.logo} abbr={away.abbr} size={16} />
        </div>
      </div>
      <div className="pitch-wrap">
        <div className="pitch">
          <div className="box-line top" />
          <div className="box-line bot" />
          <div className="goal-box top" />
          <div className="goal-box bot" />
          <div className="pen-arc top" />
          <div className="pen-arc bot" />
          <svg
            className="sc-svg"
            viewBox={`0 0 100 ${VB_H}`}
            preserveAspectRatio="none"
            style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))' }}
          >
            {sorted.map((s, i) => <ShotMarker key={i} s={s} />)}
          </svg>
        </div>
      </div>
      <div className="sc-legend">
        <span className="sc-leg-item">
          <LegendDot color={SHOT_COLORS.home} isGoal={false} isH2={false} /> 1H Shot
        </span>
        <span className="sc-leg-item">
          <LegendDot color={SHOT_COLORS.home} isGoal={false} isH2={true} /> 2H Shot
        </span>
        <span className="sc-leg-item">
          <LegendDot color={SHOT_COLORS.home} isGoal={true} isH2={false} /> 1H Goal
        </span>
        <span className="sc-leg-item">
          <LegendDot color={SHOT_COLORS.home} isGoal={true} isH2={true} /> 2H Goal
        </span>
        <span className="sc-leg-sep" />
        <span className="sc-leg-item">
          <LegendDot color={SHOT_COLORS.away} isGoal={false} isH2={false} /> 1H Shot
        </span>
        <span className="sc-leg-item">
          <LegendDot color={SHOT_COLORS.away} isGoal={false} isH2={true} /> 2H Shot
        </span>
        <span className="sc-leg-item">
          <LegendDot color={SHOT_COLORS.away} isGoal={true} isH2={false} /> 1H Goal
        </span>
        <span className="sc-leg-item">
          <LegendDot color={SHOT_COLORS.away} isGoal={true} isH2={true} /> 2H Goal
        </span>
      </div>
    </div>
  );
}

/* ==============================================================
   PITCH / LINEUPS
   ============================================================== */
function BenchList({ players }: { players: MatchBenchPlayer[] }) {
  return (
    <ul>
      {players.map((b, i) => (
        <li key={i}>
          {b.pos && <span className="bpos">{b.pos}</span>}
          {b.name}
        </li>
      ))}
    </ul>
  );
}

function Pitch({ home, away }: { home: MatchCenterTeam; away: MatchCenterTeam }) {
  function placeDots(lines: MatchCenterTeam['lines'], side: 'home' | 'away') {
    const L = lines.length || 1;
    return lines.flatMap((line, li) => {
      const y = side === 'home'
        ? 93 - li * (36 / Math.max(L - 1, 1))
        : 7 + li * (36 / Math.max(L - 1, 1));
      const k = line.length || 1;
      return line.map((pl, j) => {
        const x = 12 + ((j + 0.5) / k) * 76;
        const inner = <>
          <div className={'disc' + (pl.isStar ? ' star' : '')}>{pl.jersey}</div>
          <div className="nm">{pl.name}{pl.isCaptain ? ' (C)' : ''}</div>
          {pl.pos && <div className="pos">{pl.pos}</div>}
        </>;
        return pl.fifaId ? (
          <Link
            href={`/player/${pl.fifaId}`}
            className={`dot ${side}`}
            style={{ left: `${x}%`, top: `${y}%`, textDecoration: 'none' }}
            key={`${side}-${li}-${j}`}
          >{inner}</Link>
        ) : (
          <div
            className={`dot ${side}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            key={`${side}-${li}-${j}`}
          >{inner}</div>
        );
      });
    });
  }

  return (
    <div className="pitch">
      <div className="box-line top" />
      <div className="box-line bot" />
      <div className="goal-box top" />
      <div className="goal-box bot" />
      <div className="pen-arc top" />
      <div className="pen-arc bot" />
      {placeDots(away.lines, 'away')}
      {placeDots(home.lines, 'home')}
    </div>
  );
}

function Lineups({ match }: { match: MatchCenterData }) {
  const { state, home, away } = match;
  const probable = state === 'pre';

  const hasLineups = home.lines.length > 0 || away.lines.length > 0;

  if (!hasLineups) {
    return (
      <div className="mc-card">
        <div className="mc-head">
          <h3>{probable ? 'Probable lineups' : 'Lineups'}</h3>
        </div>
        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          {probable ? 'Probable lineups will appear closer to kick-off.' : 'Lineups not yet available.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mc-card">
      <div className="mc-head">
        <h3>{probable ? 'Probable lineups' : 'Lineups'}</h3>
        {home.formation && away.formation && (
          <span className="sub">{home.formation} · {away.formation}</span>
        )}
      </div>
      <div className="pitch-wrap">
        <Pitch home={home} away={away} />
      </div>
      {(home.bench.length > 0 || away.bench.length > 0) && (
        <div className="bench">
          <h4 className="bench-title">Bench</h4>
          <div className="bench-cols">
            <div className="bench-team">
              <span className="side">
                <Flag logo={home.logo} abbr={home.abbr} size={18} />
                <span className="code">{home.abbr}</span>
                {home.formation && <span className="fm">{home.formation}</span>}
                {home.coach && <span className="coach">· {home.coach}</span>}
              </span>
              <BenchList players={home.bench} />
            </div>
            <div className="bench-team">
              <span className="side">
                <Flag logo={away.logo} abbr={away.abbr} size={18} />
                <span className="code">{away.abbr}</span>
                {away.formation && <span className="fm">{away.formation}</span>}
                {away.coach && <span className="coach">· {away.coach}</span>}
              </span>
              <BenchList players={away.bench} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==============================================================
   COMMENTARY
   ============================================================== */
const CMT_TAG: Record<string, [string, string]> = {
  goal: ['goal', 'Goal'],
  pen: ['goal', 'Penalty'],
  yellow: ['card', 'Yellow'],
  red: ['card', 'Red'],
  var: ['var', 'VAR'],
  sub: ['sub', 'Sub'],
};

function Commentary({ match }: { match: MatchCenterData }) {
  const { state, commentary, clock } = match;
  return (
    <div className="mc-card">
      <div className="mc-head">
        <h3>Live commentary</h3>
        <span className="sub">{state === 'post' ? 'Full match' : state === 'in' ? (match.isHalftime ? 'HALF TIME' : `Live · ${clock}`) : 'Auto-updating'}</span>
      </div>
      <div className="cmt">
        {commentary.map((c: CommentaryEntry, i: number) => {
          const tag = CMT_TAG[c.type];
          const isKey = ['goal', 'pen', 'yellow', 'red'].includes(c.type);
          return (
            <div className={'cmt-row' + (isKey ? ' key' : '')} key={i}>
              <div className="cmt-min tnum">{c.min}</div>
              <div className="cmt-body">
                {tag && <span className={`cmt-tag ${tag[0]}`}>{tag[1]}</span>}
                {c.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==============================================================
   MAIN COLUMN (tabs)
   ============================================================== */
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mc-card">
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
        {children}
      </div>
    </div>
  );
}

// Longest run of the same result ending at the most recent game (newest = last).
function currentStreak(form: TeamForm | null): { n: number; r: 'W' | 'D' | 'L' } | null {
  if (!form || form.games.length === 0) return null;
  const last = form.games[form.games.length - 1].result;
  let n = 0;
  for (let i = form.games.length - 1; i >= 0 && form.games[i].result === last; i--) n++;
  return n >= 2 ? { n, r: last } : null;
}

function formPhrase(form: TeamForm | null): string {
  if (!form) return 'arrive with no recent form on record';
  const s = currentStreak(form);
  if (s?.r === 'W') return `arrive on a ${s.n}-match winning run`;
  if (s?.r === 'L') return `come in having lost their last ${s.n}`;
  if (s?.r === 'D') return `have drawn their last ${s.n}`;
  return `bring ${form.w}W-${form.d}D-${form.l}L form from their last five`;
}

// Data-driven preview prose built from the odds (betting favorite), recent
// form, and head-to-head record already on the match. No editorial text comes
// from ESPN, so this synthesises a unique line per fixture from the numbers.
function PreviewNarrative({ match }: { match: MatchCenterData }) {
  const { home, away, odds } = match;

  // Favourite from moneyline: the more negative price is the shorter-priced side.
  let favLine: React.ReactNode = null;
  if (odds) {
    const h = parseInt(odds.homeMoneyline, 10);
    const a = parseInt(odds.awayMoneyline, 10);
    if (!Number.isNaN(h) && !Number.isNaN(a) && h !== a) {
      const homeFav = h < a;
      const fav = homeFav ? home : away;
      const price = homeFav ? odds.homeMoneyline : odds.awayMoneyline;
      favLine = <> <b style={{ color: 'var(--ink)' }}>{fav.name}</b> go in as the bookmakers&rsquo; favorite ({price}).</>;
    } else {
      favLine = <> The bookmakers can barely separate them.</>;
    }
  }

  const h2hLine = match.h2h.length > 0
    ? <> The two last met in {match.h2h[0].date}.</>
    : null;

  return (
    <>
      {match.round} clash at {match.venue}, {match.venueCity}. <b style={{ color: 'var(--ink)' }}>{home.name}</b> {formPhrase(match.formHome)}, while <b style={{ color: 'var(--ink)' }}>{away.name}</b> {formPhrase(match.formAway)}.{favLine}{h2hLine} Kick-off is {formatKickoffTime(match.kickoffISO)}.
    </>
  );
}

function FormRow({ team, form }: { team: MatchCenterTeam; form: TeamForm | null }) {
  return (
    <div className="fg-row">
      <div className="fg-team">
        <Flag logo={team.logo} abbr={team.abbr} size={18} />
        <span className="ab">{team.abbr}</span>
      </div>
      <div className="fg-chips">
        {form
          ? form.games.map((g, i) => (
              <span
                key={i}
                className={`fdot ${g.result.toLowerCase()}`}
                title={`${g.homeAway === 'H' ? 'vs' : '@'} ${g.oppAbbr} ${g.score} · ${g.comp} (${g.date})`}
              >
                {g.result}
              </span>
            ))
          : <span className="fg-none">No recent matches</span>}
      </div>
      {form && <div className="fg-tally">{form.w}-{form.d}-{form.l}</div>}
    </div>
  );
}

function MainColumn({ tab, match, onSelectTab, pmsr }: { tab: string; match: MatchCenterData; onSelectTab: (t: Tab) => void; pmsr?: PmsrData | null }) {
  const { state, stats, home, away, clock } = match;
  const hasXg = !!pmsr && pmsr.home.xg != null && pmsr.away.xg != null;

  if (tab === 'Stats') {
    if (state === 'pre') return <Empty>Match stats appear once the match kicks off.</Empty>;
    return (
      <>
        <div className="mc-card">
          <div className="mc-head">
            <h3>Team stats</h3>
            <span className="sub">{state === 'in' ? (match.isHalftime ? 'HALF TIME' : `Live · ${clock}`) : 'FULL TIME'}</span>
          </div>
          <PossessionHeader stats={stats} homeAbbr={home.abbr} awayAbbr={away.abbr} />
          <div className="stats-wrap">
            {hasXg && <XgBar home={pmsr!.home.xg!} away={pmsr!.away.xg!} />}
            {stats.slice(1).map(s => <StatBar key={s.label} s={s} />)}
          </div>
          <ShotChart shots={match.shots} home={home} away={away} />
        </div>
        {pmsr && <PhysicalCard pmsr={pmsr} />}
      </>
    );
  }

  if (tab === 'Lineups') {
    return <Lineups match={match} />;
  }

  if (tab === 'Commentary') {
    if (state === 'pre') {
      const kickoffTime = formatKickoffTime(match.kickoffISO);
      return <Empty>Commentary begins at kick-off, {kickoffTime}.</Empty>;
    }
    if (match.commentary.length === 0) return <Empty>No commentary available yet.</Empty>;
    return <Commentary match={match} />;
  }

  // Summary tab
  if (state === 'pre') {
    return (
      <>
        <div className="mc-card">
          <div className="mc-head">
            <h3>Match preview</h3>
            {match.group && <span className="sub">Group {match.group}</span>}
          </div>
          <div className="preview-lede">
            <PreviewNarrative match={match} />
          </div>
          {(match.formHome || match.formAway) && (
            <div className="form-guide">
              <div className="fg-head">Recent form <span>Last 5</span></div>
              <FormRow team={home} form={match.formHome} />
              <FormRow team={away} form={match.formAway} />
            </div>
          )}
        </div>
        <Lineups match={match} />
      </>
    );
  }

  return (
    <>
      {state === 'post' && match.motmName && (
        <div className="mc-card">
          <div className="mc-head">
            <h3>Player of the match</h3>
            <span className="motm-badge">★ Official</span>
          </div>
          <div className="motm">
            <div className="av">
              <Shot size={48} name={match.motmName} />
            </div>
            <div className="info">
              <div className="nm">{match.motmName}</div>
              {match.motmLine && <div className="ln">{match.motmLine}</div>}
            </div>
          </div>
        </div>
      )}

      <div className="mc-card">
        <div className="mc-head">
          <h3>Key events</h3>
          <span className="sub">{state === 'in' ? (match.isHalftime ? 'HALF TIME' : `Live · ${clock}`) : 'FULL TIME'}</span>
        </div>
        {match.events.length === 0
          ? <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No events yet.</div>
          : <Timeline match={match} />
        }
      </div>

      {stats.length > 0 && (
        <div className="mc-card">
          <div className="mc-head">
            <h3>Match stats</h3>
            <span className="sub" style={{ fontSize: 12, fontWeight: 600 }}>
              Top 5 · <button onClick={() => onSelectTab('Stats')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,.8)', fontWeight: 600, fontSize: 12 }}>All stats →</button>
            </span>
          </div>
          <PossessionHeader stats={stats} homeAbbr={home.abbr} awayAbbr={away.abbr} />
          <div className="stats-wrap">
            {stats.slice(1, 6).map(s => <StatBar key={s.label} s={s} />)}
          </div>
        </div>
      )}
    </>
  );
}

/* ==============================================================
   SHELF PANELS
   ============================================================== */
function ProbPanel({ match }: { match: MatchCenterData }) {
  const { state, odds, winProbHome, winProbDraw, home, away } = match;

  const probHome = winProbHome ?? (state === 'pre' ? null : null);
  const probDraw = winProbDraw ?? null;
  const probAway = (probHome !== null && probDraw !== null) ? 100 - probHome - probDraw : null;

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Win probability</h3>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
          {state === 'in' ? 'Live' : 'Pre-match'}
        </span>
      </div>

      {probHome !== null && probDraw !== null && probAway !== null && (
        <>
          <div className="prob-bar">
            <span className="ph" style={{ width: `${probHome}%` }} />
            <span className="pd" style={{ width: `${probDraw}%` }} />
            <span className="pa" style={{ width: `${probAway}%` }} />
          </div>
          <div className="prob-legend">
            <span className="pl">
              <span className="v tnum">{probHome}%</span>
              <span className="k">{home.abbr} win</span>
            </span>
            <span className="pl" style={{ alignItems: 'center' }}>
              <span className="v tnum">{probDraw}%</span>
              <span className="k">Draw</span>
            </span>
            <span className="pl r">
              <span className="v tnum">{probAway}%</span>
              <span className="k">{away.abbr} win</span>
            </span>
          </div>
        </>
      )}

      {odds && (
        <>
          <div className="odds-grid">
            <div className="odds-cell">
              <div className="k">{home.abbr}</div>
              <div className="v">{odds.homeMoneyline}</div>
            </div>
            <div className="odds-cell">
              <div className="k">Draw</div>
              <div className="v">{odds.drawMoneyline}</div>
            </div>
            <div className="odds-cell">
              <div className="k">{away.abbr}</div>
              <div className="v">{odds.awayMoneyline}</div>
            </div>
          </div>
          <div className="odds-note">
            <span>DraftKings moneyline</span>
            <span>O/U {odds.overUnder}</span>
          </div>
        </>
      )}

      {!odds && probHome === null && (
        <div style={{ padding: '16px', fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>
          Odds available closer to kick-off.
        </div>
      )}
    </div>
  );
}

function MotmPanel({ match }: { match: MatchCenterData }) {
  if (!match.motmName) return null;
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Player of the match</h3>
        <span className="motm-badge">★</span>
      </div>
      <div className="motm">
        <div className="av">
          <Shot size={48} name={match.motmName} />
        </div>
        <div className="info">
          <div className="nm">{match.motmName}</div>
          {match.motmLine && <div className="ln">{match.motmLine}</div>}
        </div>
      </div>
    </div>
  );
}

function H2HPanel({ match }: { match: MatchCenterData }) {
  const { h2h, home, away } = match;
  if (h2h.length === 0) return null;

  const homeW = h2h.filter(g => g.homeAbbr === home.abbr && parseInt(g.score.split('–')[0]) > parseInt(g.score.split('–')[1])).length
    + h2h.filter(g => g.awayAbbr === home.abbr && parseInt(g.score.split('–')[1]) > parseInt(g.score.split('–')[0])).length;
  const awayW = h2h.filter(g => g.homeAbbr === away.abbr && parseInt(g.score.split('–')[0]) > parseInt(g.score.split('–')[1])).length
    + h2h.filter(g => g.awayAbbr === away.abbr && parseInt(g.score.split('–')[1]) > parseInt(g.score.split('–')[0])).length;
  const draws = h2h.length - homeW - awayW;
  const tot = h2h.length || 1;

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Head to head</h3>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>Last {h2h.length}</span>
      </div>

      <div className="h2h-sum">
        <div className="seg">
          <div className="n tnum">{homeW}</div>
          <div className="k">{home.abbr}</div>
        </div>
        <div className="meter">
          <div className="track">
            <span className="w" style={{ width: `${(homeW / tot) * 100}%` }} />
            <span className="d" style={{ width: `${(draws / tot) * 100}%` }} />
            <span className="l" style={{ width: `${(awayW / tot) * 100}%` }} />
          </div>
        </div>
        <div className="seg">
          <div className="n tnum">{awayW}</div>
          <div className="k">{away.abbr}</div>
        </div>
      </div>

      {h2h.map((g, i) => (
        <div className="h2h-row" key={i}>
          <span className="meet">
            {g.homeAbbr} <span className="sc tnum">{g.score}</span> {g.awayAbbr}
          </span>
          <span className="comp">{g.date} · {g.comp}</span>
        </div>
      ))}
    </div>
  );
}

function GroupPanel({ match }: { match: MatchCenterData }) {
  const { group, groupStandings } = match;
  if (!group || groupStandings.length === 0) return null;

  const rows: GroupMiniRow[] = groupStandings.map(s => ({
    abbr: s.abbr,
    logo: s.logo,
    played: s.played,
    gd: s.gd,
    pts: s.pts,
    status: s.status,
  }));

  return (
    <div className="panel" style={{ padding: 0 }}>
      <div className="panel-head" style={{ padding: '12px 15px' }}>
        <h3>Group {group}</h3>
        <Link
          href={`/groups/${group.toLowerCase()}`}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}
        >
          Full table →
        </Link>
      </div>
      <GroupMini letter={group} rows={rows} />
    </div>
  );
}

function Channels({ list }: { list: MatchBroadcast[] }) {
  return (
    <>
      {list.map((c, i) => (
        <span key={c.name}>
          {i > 0 && <span style={{ color: 'var(--ink-3)' }}> · </span>}
          {c.name}
          {c.lang && (
            <span style={{ color: 'var(--ink-3)', fontWeight: 700, fontSize: 10, marginLeft: 4, letterSpacing: '.04em' }}>
              {c.lang}
            </span>
          )}
        </span>
      ))}
    </>
  );
}

function WatchPanel({ match }: { match: MatchCenterData }) {
  const { state, broadcaster, streamer, kickoffISO } = match;
  const kickoffTime = formatKickoffTime(kickoffISO);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{state === 'post' ? 'Highlights & recap' : 'Where to watch'}</h3>
      </div>

      {state === 'post' && (
        <div className="watch-thumb">
          <div className="play"><PlayIcon /></div>
          <span className="cap">highlight reel</span>
        </div>
      )}

      {broadcaster.length > 0 && (
        <div className="watch-row">
          <span className="lbl"><TvIcon /> Broadcast</span>
          <span className="val"><Channels list={broadcaster} /></span>
        </div>
      )}
      {streamer.length > 0 && (
        <div className="watch-row">
          <span className="lbl"><TvIcon /> Streaming</span>
          <span className="val"><Channels list={streamer} /></span>
        </div>
      )}

      {state === 'post' ? (
        <div className="watch-row">
          <span className="lbl"><PeopleIcon /> Match recap</span>
          <span className="val" style={{ color: 'var(--link)' }}>Read →</span>
        </div>
      ) : (
        <div className="watch-row">
          <span className="lbl"><PinSm /> Kick-off</span>
          <span className="val">{kickoffTime}</span>
        </div>
      )}
    </div>
  );
}

interface WeatherPanelProps {
  weatherData: WeatherData;
  roofType: 'open' | 'retractable' | 'fixed';
  lat: number;
  lng: number;
  venue: string;
}

function WeatherPanel({ weatherData, roofType, lat, lng, venue }: WeatherPanelProps) {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div className="panel-head">
        <h3>Match weather</h3>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{venue}</span>
      </div>
      <div style={{ background: 'var(--navy)', padding: '12px 16px' }}>
        <VenueWeather data={weatherData} roofType={roofType} lat={lat} lng={lng} />
      </div>
    </div>
  );
}

interface ShelfProps {
  match: MatchCenterData;
  weatherData?: WeatherData | null;
  venueRoof?: 'open' | 'retractable' | 'fixed';
  venueLat?: number;
  venueLng?: number;
}

function Shelf({ match, weatherData, venueRoof, venueLat, venueLng }: ShelfProps) {
  return (
    <div className="shelf">
      {weatherData && venueRoof && venueLat != null && venueLng != null && (
        <WeatherPanel
          weatherData={weatherData}
          roofType={venueRoof}
          lat={venueLat}
          lng={venueLng}
          venue={match.venue}
        />
      )}
      <WatchPanel match={match} />
      <H2HPanel match={match} />
      <GroupPanel match={match} />
      {match.state === 'post' ? (
        <MotmPanel match={match} />
      ) : (
        <ProbPanel match={match} />
      )}
    </div>
  );
}

/* ==============================================================
   ROOT CLIENT COMPONENT
   ============================================================== */
const TABS = ['Summary', 'Stats', 'Lineups', 'Commentary'] as const;
type Tab = typeof TABS[number];

interface MatchClientProps {
  match: MatchCenterData;
  venueSlug?: string;
  venueRoof?: 'open' | 'retractable' | 'fixed';
  venueLat?: number;
  venueLng?: number;
  weatherData?: WeatherData | null;
  pmsr?: PmsrData | null;
}

export function MatchClient({ match, venueSlug, venueRoof, venueLat, venueLng, weatherData, pmsr }: MatchClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Summary');

  const eventCount =
    match.state === 'in' || match.state === 'post'
      ? match.events.filter(e => e.type !== 'whistle').length
      : 0;

  return (
    <>
      <MatchHero match={match} venueSlug={venueSlug} />

      {/* Tab strip */}
      <div className="mtabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={'mtab' + (tab === activeTab ? ' on' : '')}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === 'Summary' && eventCount > 0 && (
              <span className="pill tnum">{eventCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="cols mcols">
        <div>
          <MainColumn tab={activeTab} match={match} onSelectTab={setActiveTab} pmsr={pmsr} />
        </div>
        <Shelf
          match={match}
          weatherData={weatherData}
          venueRoof={venueRoof}
          venueLat={venueLat}
          venueLng={venueLng}
        />
      </div>
    </>
  );
}
