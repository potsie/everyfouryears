'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import type { WorldCupGroupTable } from '@/types/standings-types';
import type { DateRailDay } from '@/components/DateRail';
import { Hero } from '@/components/Hero';
import { DateRail } from '@/components/DateRail';
import { MatchCard } from '@/components/MatchCard';
import { DataShelf } from '@/components/DataShelf';
import { GroupTable } from '@/components/GroupTable';
import { HomeNewsBand } from '@/components/HomeNewsBand';
import type { NewsItem } from '@/lib/news';
import { useMyTeam } from '@/contexts/my-team-context';

interface HomeClientProps {
  allMatches: WorldCupMatchNormalized[];
  groupStandings: WorldCupGroupTable[];
  todayStr: string; // YYYYMMDD in US Eastern
  news: NewsItem[];
}

const TOURNAMENT_START = '20260611';
const TOURNAMENT_END = '20260719';

function getTournamentPhase(yyyymmdd: string): 'pre' | 'live' | 'knockout' {
  if (yyyymmdd < TOURNAMENT_START) return 'pre';
  if (yyyymmdd <= '20260627') return 'live';
  return 'knockout';
}

function getDefaultDate(todayStr: string): string {
  if (todayStr < TOURNAMENT_START) return TOURNAMENT_START;
  if (todayStr > TOURNAMENT_END) return TOURNAMENT_END;
  return todayStr;
}

function getMatchDateKey(isoDate: string): string {
  if (!isoDate) return '';
  const utcDate = new Date(isoDate);
  // Matches at 00:00–05:59 UTC are late-night US broadcasts — attribute to prior calendar day
  if (utcDate.getUTCHours() < 6) {
    const prev = new Date(utcDate.getTime() - 86_400_000);
    return prev.toISOString().slice(0, 10).replace(/-/g, '');
  }
  return utcDate.toISOString().slice(0, 10).replace(/-/g, '');
}

function buildDateRail(matches: WorldCupMatchNormalized[]): DateRailDay[] {
  const map = new Map<string, { count: number; phase: 'group' | 'ko' }>();

  for (const m of matches) {
    const key = getMatchDateKey(m.date);
    if (!key) continue;
    const existing = map.get(key);
    const phase: 'group' | 'ko' = m.seasonTypeId === 1 ? 'group' : 'ko';
    map.set(key, { count: (existing?.count ?? 0) + 1, phase: existing?.phase ?? phase });
  }

  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([yyyymmdd, { count, phase }]) => {
      const year = parseInt(yyyymmdd.slice(0, 4));
      const month = parseInt(yyyymmdd.slice(4, 6)) - 1;
      const day = parseInt(yyyymmdd.slice(6, 8));
      const date = new Date(year, month, day);
      return {
        yyyymmdd,
        dow: DOW[date.getDay()],
        day,
        matchCount: count,
        phase,
      };
    });
}

export function HomeClient({ allMatches, groupStandings, todayStr, news }: HomeClientProps) {
  const defaultDate = getDefaultDate(todayStr);
  const [matches, setMatches] = useState(allMatches);
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [statCategory, setStatCategory] = useState('Goals');

  const { myTeam } = useMyTeam();

  useEffect(() => {
    if (showAllGroups) {
      document.getElementById('all-groups-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showAllGroups]);

  const phase = getTournamentPhase(todayStr);
  const dateRailDays = buildDateRail(matches);

  // Matches for the selected date
  const selectedMatches = matches.filter(
    m => getMatchDateKey(m.date) === selectedDate,
  );

  // Today's matches for the hero (always uses real today, not selected date)
  const todayMatches = matches.filter(
    m => getMatchDateKey(m.date) === todayStr,
  );

  // Opening match for pre-phase hero
  const openingMatch = [...matches]
    .sort((a, b) => a.date.localeCompare(b.date))
    .find(m => m.status.state === 'pre' || m.eventId);

  const liveCount = selectedMatches.filter(m => m.status.state === 'in').length;

  // Live polling: refresh selected date's matches every 30s when live
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches?date=${selectedDate}`);
      if (!res.ok) return;
      const fresh: WorldCupMatchNormalized[] = await res.json();
      // Merge fresh data: replace matches for the selected date, keep others
      setMatches(prev => {
        const others = prev.filter(m => getMatchDateKey(m.date) !== selectedDate);
        return [...others, ...fresh].sort((a, b) => a.date.localeCompare(b.date));
      });
    } catch {
      // Silently fail — stale data is acceptable
    }
  }, [selectedDate]);

  useEffect(() => {
    const hasLive = selectedMatches.some(m => m.status.state === 'in');
    if (!hasLive) return;
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [selectedMatches, poll]);

  // Section label
  const sectionLabel =
    phase === 'live'
      ? 'Today'
      : phase === 'knockout'
      ? (todayMatches[0]?.stage ?? 'Knockout') + ' · Today'
      : 'Opening Fixtures';

  const selectedDateObj = (() => {
    const y = parseInt(selectedDate.slice(0, 4));
    const mo = parseInt(selectedDate.slice(4, 6)) - 1;
    const d = parseInt(selectedDate.slice(6, 8));
    return new Date(y, mo, d);
  })();

  const selectedDateLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main>
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '0 24px 96px',
        }}
      >
        {/* Hero */}
        <Hero phase={phase} todayMatches={todayMatches} openingMatch={openingMatch} />

        {/* Date rail */}
        {dateRailDays.length > 0 && (
          <DateRail
            days={dateRailDays}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        )}

        {/* Section header */}
        <div
          className="flex items-center justify-between gap-4 mb-[14px]"
        >
          <h2
            className="font-display font-bold text-[19px] tracking-[-0.01em] m-0 whitespace-nowrap flex items-center gap-2"
            style={{ color: 'var(--ink)' }}
          >
            {sectionLabel}
            <span
              className="font-semibold text-[14px] tracking-normal"
              style={{ color: 'var(--ink-3)' }}
            >
              · {selectedDateLabel}
            </span>
          </h2>
          <div
            className="font-bold text-[11px] tracking-[.12em] uppercase whitespace-nowrap"
            style={{ color: 'var(--ink-3)' }}
          >
            {selectedMatches.length} match{selectedMatches.length !== 1 ? 'es' : ''}
            {liveCount > 0 && ` · ${liveCount} live`}
          </div>
        </div>

        {/* Two-column body */}
        <div
          className="grid gap-[26px] items-start [grid-template-columns:1fr_340px] [@media(max-width:980px)]:[grid-template-columns:1fr]"
        >
          {/* Match cards */}
          <div>
            {selectedMatches.length === 0 ? (
              <div
                className="text-center py-12 text-[14px]"
                style={{ color: 'var(--ink-3)' }}
              >
                No matches scheduled for this date.
              </div>
            ) : (
              <div
                className="grid gap-[13px]"
                style={{
                  gridTemplateColumns: selectedMatches.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                }}
              >
                {selectedMatches.map(match => (
                  <MatchCard key={match.eventId} match={match} />
                ))}
              </div>
            )}

            {/* Latest news band — sits directly under today's matches */}
            <HomeNewsBand items={news} />
          </div>

          {/* Data shelf */}
          <div>
            <DataShelf
              groupStandings={groupStandings}
              todayMatches={todayMatches}
              allMatches={matches}
              myTeam={myTeam}
              showAllGroups={showAllGroups}
              onToggleAllGroups={() => setShowAllGroups(v => !v)}
              statCategory={statCategory}
              onStatCategory={setStatCategory}
            />
          </div>
        </div>

        {/* All-12-groups section */}
        {showAllGroups && groupStandings.length > 0 && (
          <div id="all-groups-section" className="mt-8">
            <div className="flex items-center justify-between mb-[14px]">
              <h2
                className="font-display font-bold text-[19px] tracking-[-0.01em] m-0"
                style={{ color: 'var(--ink)' }}
              >
                Standings · All 12 Groups
              </h2>
              <button
                onClick={() => setShowAllGroups(false)}
                className="font-semibold text-[13px] cursor-pointer"
                style={{ color: 'var(--ink-2)', background: 'none', border: 'none' }}
              >
                Collapse ▲
              </button>
            </div>

            <div
              className="grid gap-[13px]"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))' }}
            >
              {groupStandings.map(group => (
                <div
                  key={group.groupId}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--sh-1)',
                    overflow: 'hidden',
                  }}
                >
                  <GroupTable group={group} compact />
                </div>
              ))}
            </div>

            {/* Legend */}
            <div
              className="flex gap-[14px] text-[10.5px] mt-4"
              style={{ color: 'var(--ink-3)' }}
            >
              <span className="flex items-center gap-[5px]">
                <span className="rounded-[3px]" style={{ width: 9, height: 9, display: 'inline-block', background: 'var(--advance)' }} />
                Advance to Round of 32
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="rounded-[3px]" style={{ width: 9, height: 9, display: 'inline-block', background: 'var(--best3)' }} />
                Best-third contention
              </span>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div
          className="flex justify-between gap-4 flex-wrap text-[12px] mt-[30px] pt-[18px]"
          style={{ borderTop: '1px solid var(--line)', color: 'var(--ink-3)' }}
        >
          <span>Data updates live during matches · all times shown in your local timezone</span>
          <span>Where to watch: FOX · FS1 · Telemundo · Peacock</span>
        </div>
      </div>
    </main>
  );
}
