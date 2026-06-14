'use client';

import { useState, useEffect } from 'react';
import type { WorldCupGroupTable } from '@/types/standings-types';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { GroupTable } from './GroupTable';
import Link from 'next/link';
import { useMyTeam, espnFlagUrl } from '@/contexts/my-team-context';
import type { TournamentStats } from '@/lib/stats-live';

interface DataShelfProps {
  groupStandings: WorldCupGroupTable[];
  todayMatches: WorldCupMatchNormalized[];
  allMatches: WorldCupMatchNormalized[];
  myTeam: string | null;
  showAllGroups: boolean;
  onToggleAllGroups: () => void;
  statCategory: string;
  onStatCategory: (cat: string) => void;
}

const STAT_TABS = ['Goals', 'Assists', 'Clean sheets', 'Saves'];

export function DataShelf({
  groupStandings,
  todayMatches,
  allMatches,
  myTeam,
  showAllGroups,
  onToggleAllGroups,
  statCategory,
  onStatCategory,
}: DataShelfProps) {
  const { openPicker } = useMyTeam();

  const [teamColors, setTeamColors] = useState<{ primary: string; alt: string } | null>(null);
  const [stats, setStats] = useState<TournamentStats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: TournamentStats) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  // Map the selected tab to a normalized list of leader rows
  const statLeaders: { p: string; t: string; v: number; fifaId?: string }[] = (() => {
    if (!stats) return [];
    switch (statCategory) {
      case 'Goals':
        return stats.goldenBoot.map(e => ({ p: e.p, t: e.t, v: e.g, fifaId: e.fifaId }));
      case 'Assists':
        return stats.assists;
      case 'Clean sheets':
        return stats.cleanSheets;
      case 'Saves':
        return stats.saves;
      default:
        return [];
    }
  })().slice(0, 5);

  const myTeamUpper = myTeam?.toUpperCase() ?? null;

  const myTeamGroup = myTeamUpper
    ? groupStandings.find(g => g.standings.some(t => t.teamAbbr.toUpperCase() === myTeamUpper))
    : null;
  const myTeamStanding = myTeamGroup?.standings.find(t => t.teamAbbr.toUpperCase() === myTeamUpper);

  useEffect(() => {
    const espnId = myTeamStanding?.teamId;
    if (!espnId) { setTeamColors(null); return; }
    fetch(`/api/team-colors?espnId=${espnId}`)
      .then(r => r.json())
      .then(setTeamColors)
      .catch(() => setTeamColors(null));
  }, [myTeamStanding?.teamId]);

  const nextMatch = myTeamUpper
    ? [...allMatches]
        .sort((a, b) => a.date.localeCompare(b.date))
        .find(
          m =>
            m.status.state === 'pre' &&
            (m.home.abbr.toUpperCase() === myTeamUpper || m.away.abbr.toUpperCase() === myTeamUpper),
        )
    : null;
  const nextMatchOpp = nextMatch
    ? nextMatch.home.abbr.toUpperCase() === myTeamUpper
      ? nextMatch.away.abbr
      : nextMatch.home.abbr
    : null;
  const nextMatchDate = nextMatch ? new Date(nextMatch.date) : null;
  const nextMatchDay = nextMatchDate
    ? nextMatchDate.toLocaleDateString([], { weekday: 'short' })
    : null;
  const nextMatchTime = nextMatchDate
    ? nextMatchDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  // For curated view: user's group + groups with live matches
  const liveGroupLetters = new Set(
    todayMatches
      .filter(m => m.status.state === 'in')
      .map(m => m.groupLetter)
      .filter(Boolean),
  );

  const curatedGroups = groupStandings.filter((g, i) => {
    const letter = g.groupName.replace(/^Group\s+/i, '').trim();
    return (
      g === myTeamGroup ||
      liveGroupLetters.has(letter) ||
      i < 2
    );
  }).slice(0, 3);

  return (
    <div className="flex flex-col gap-[22px]">
      {/* My Team card */}
      {myTeam && myTeamStanding && (
        <div
          className="text-white"
          style={{
            background: teamColors
              ? `linear-gradient(135deg, color-mix(in srgb, ${teamColors.primary} 55%, #0a2240) 0%, #0a2240 100%)`
              : 'linear-gradient(120deg,var(--navy),var(--navy-700))',
            borderRadius: 'var(--r-md)',
            padding: '15px 16px',
            boxShadow: 'var(--sh-1)',
            transition: 'background 0.4s ease',
          }}
        >
          {/* Header row: label + change button */}
          <div
            className="flex items-center font-bold text-[11px] tracking-[.12em] uppercase mb-[10px]"
            style={{ color: 'rgba(255,255,255,.6)' }}
          >
            ★ My Team
            <button
              onClick={openPicker}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,.45)',
                fontSize: 11,
                cursor: 'pointer',
                padding: 0,
                marginLeft: 'auto',
                fontWeight: 400,
                letterSpacing: 0,
                textTransform: 'none',
              }}
            >
              change
            </button>
          </div>

          {/* Main row: flag + abbr + subtitle */}
          <div className="flex items-center gap-3">
            <img
              src={espnFlagUrl(myTeam)}
              alt={myTeam}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-display font-black text-[22px]">{myTeamStanding.teamAbbr}</span>
            <div className="text-[12px]" style={{ color: 'rgba(255,255,255,.72)' }}>
              {myTeamGroup?.groupName} · {ordinal(myTeamStanding.rank)} · {myTeamStanding.points} pts
            </div>
          </div>

          {/* Next match row */}
          {nextMatch && nextMatchOpp && nextMatchDay && nextMatchTime && (
            <div
              className="mt-[8px] text-[11px]"
              style={{ color: 'rgba(255,255,255,.6)' }}
            >
              Next · vs {nextMatchOpp} · {nextMatchDay} {nextMatchTime}
            </div>
          )}
        </div>
      )}

      {/* Standings panel */}
      {groupStandings.length > 0 && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--sh-1)',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between px-[15px] py-3"
            style={{ borderBottom: '1px solid var(--line)' }}
          >
            <h3 className="font-display font-bold text-[14px] m-0 tracking-[.01em]">
              Standings
            </h3>
            <button
              onClick={onToggleAllGroups}
              className="text-[12px] font-semibold cursor-pointer"
              style={{
                color: 'var(--ink-2)',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              {showAllGroups ? 'Collapse ▲' : 'All 12 groups →'}
            </button>
          </div>

          {curatedGroups.map(group => (
            <div key={group.groupId} style={{ borderTop: '1px solid var(--line)' }}>
              <GroupTable
                group={group}
                myTeamId={myTeamStanding?.teamId}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {/* Stat leaders panel */}
      <div className="panel">
        <div className="panel-head">
          <h3>Stat Leaders</h3>
          <Link
            href="/stats"
            className="text-[12px] font-semibold no-underline uppercase tracking-[.04em]"
            style={{ color: 'rgba(255,255,255,.55)' }}
          >
            Full stats →
          </Link>
        </div>

        {/* Tab row */}
        <div
          className="flex gap-1 scrollbar-none"
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--line)',
            overflowX: 'auto',
          }}
        >
          {STAT_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => onStatCategory(tab)}
              className="text-[11.5px] font-bold whitespace-nowrap cursor-pointer uppercase tracking-[.04em]"
              style={{
                padding: '6px 10px',
                borderRadius: 7,
                background: statCategory === tab ? 'var(--inset)' : 'transparent',
                color: statCategory === tab ? 'var(--ink)' : 'var(--ink-3)',
                border: 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Leader rows — sourced from /api/stats (same data as /stats) */}
        {statLeaders.length === 0 ? (
          <div
            className="px-[15px] py-[24px] text-center text-[13px]"
            style={{ color: 'var(--ink-3)' }}
          >
            Stats accumulate as matches complete
          </div>
        ) : (
          statLeaders.map((r, i) => {
            const rowClass = 'flex items-center gap-3 px-[15px] py-[10px] no-underline';
            const rowStyle = { borderTop: i === 0 ? 'none' : '1px solid var(--line)' };
            const inner = (
              <>
                <span
                  className="font-display font-extrabold text-[14px] text-center"
                  style={{ color: 'var(--ink-3)', width: 16, flex: '0 0 auto' }}
                >
                  {i + 1}
                </span>
                <img
                  src={espnFlagUrl(r.t)}
                  alt={r.t}
                  style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="flex-1 min-w-0 truncate font-bold text-[13px]" style={{ color: 'var(--ink)' }}>
                  {r.p}
                </span>
                <span className="font-display font-extrabold text-[18px]" style={{ color: 'var(--ink)' }}>
                  {r.v}
                </span>
              </>
            );
            // Link to the player page only when we resolved a FIFA id for them
            return r.fifaId ? (
              <Link key={`${r.p}-${i}`} href={`/player/${r.fifaId}`} className={rowClass} style={rowStyle}>
                {inner}
              </Link>
            ) : (
              <div key={`${r.p}-${i}`} className={rowClass} style={rowStyle}>
                {inner}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
