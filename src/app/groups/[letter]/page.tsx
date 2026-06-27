import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchAllMatches, fetchAllGroupStandings } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import { Flag } from '@/components/Flag';
import { GroupStandingsTable } from './GroupStandingsTable';
import { GroupFixtures } from './GroupFixtures';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';

export const revalidate = 300;

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Assign matchday 1/2/3 by chronological order (2 matches per matchday)
function assignMatchdays(matches: WorldCupMatchNormalized[]) {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  return [1, 2, 3].map(md => ({
    md,
    matches: sorted.slice((md - 1) * 2, md * 2),
  }));
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  const upperLetter = letter.toUpperCase();

  if (!GROUP_LETTERS.includes(upperLetter)) notFound();

  const { matches, teamDict } = await fetchAllMatches();
  const allStandings = await fetchAllGroupStandings(teamDict);

  const groupStanding = allStandings.find(g =>
    g.groupName.replace('Group ', '').trim().toUpperCase() === upperLetter
  );

  if (!groupStanding) notFound();

  // groupLetter is empty pre-tournament (ESPN doesn't populate it in the scoreboard
  // before play starts), so filter by team membership from the standings instead.
  const groupTeamAbbrs = new Set(groupStanding.standings.map(s => s.teamAbbr));
  const groupMatches = matches.filter(
    m => m.seasonTypeId === 1 &&
      (groupTeamAbbrs.has(m.home.abbr) || groupTeamAbbrs.has(m.away.abbr))
  );
  const matchdays = assignMatchdays(groupMatches);
  const completedCount = groupMatches.filter(m => m.status.state === 'post').length;
  const top2 = groupStanding.standings.slice(0, 2);

  return (
    <>
      <Nav activePath="/groups" />
      <div className="page">
        {/* Navy hero */}
        <div className="gd-hero">
          <div className="hero-grain" />
          <div className="gd-hero-in">
            <div>
              <Link href="/groups" className="gd-back">← All groups</Link>
              <div className="gd-eyebrow" style={{ marginTop: 14 }}>
                2026 FIFA World Cup · Group Stage
              </div>
              <div className="gd-letter">Group {upperLetter}</div>
            </div>
            <div className="gd-flags">
              {groupStanding.standings.map(s => (
                <div className="gf" key={s.teamId}>
                  <Flag logo={s.logo} abbr={s.teamAbbr} size={34} />
                  <span className="c">{s.teamAbbr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Group switcher */}
        <div className="row gap8" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
          <span className="eyebrow" style={{ marginRight: 4 }}>Jump to</span>
          {GROUP_LETTERS.map(g => (
            <Link
              key={g}
              href={`/groups/${g.toLowerCase()}`}
              className="s-grp"
              style={{
                textDecoration: 'none',
                padding: '4px 9px',
                background: g === upperLetter ? 'var(--accent)' : 'var(--surface)',
                color: g === upperLetter ? 'var(--accent-ink)' : 'var(--ink-2)',
                borderColor: g === upperLetter ? 'var(--accent)' : 'var(--line)',
              }}
            >
              {g}
            </Link>
          ))}
        </div>

        <div className="gd-cols">
          {/* Standings */}
          <section style={{ marginTop: 18 }}>
            <div className="gd-section-head">
              <h2>Standings</h2>
              <span className="eyebrow">{completedCount} of 6 matches played</span>
            </div>

            <div className="gtable-wide">
              <div className="gfrow head">
                <span className="rk">#</span>
                <span className="tm">Team</span>
                <span className="num">Pl</span>
                <span className="num">W</span>
                <span className="num">D</span>
                <span className="num">L</span>
                <span className="num">GD</span>
                <span className="pts">Pts</span>
              </div>

              <GroupStandingsTable standings={groupStanding.standings} />
            </div>

            {/* Legend */}
            <div className="row gap12" style={{ marginTop: 12, fontSize: 11.5, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
              <span className="gt-foot" style={{ padding: 0 }}>
                <span className="k">
                  <span className="sw" style={{ background: 'var(--advance)', boxShadow: 'inset 3px 0 0 var(--clinched-border)' }} />
                  Clinched
                </span>
              </span>
              <span className="gt-foot" style={{ padding: 0 }}>
                <span className="k">
                  <span className="sw" style={{ background: 'var(--advance)', border: '1px solid #cfe8d8' }} />
                  Advance to Round of 32
                </span>
              </span>
              <span className="gt-foot" style={{ padding: 0 }}>
                <span className="k">
                  <span className="sw" style={{ background: 'var(--best3)', border: '1px solid #f0e2bd' }} />
                  Best-third contention
                </span>
              </span>
            </div>

            <p className="qual-note" style={{ marginTop: 14 }}>
              Top two advance to the Round of 32; the third-placed team may still qualify among the eight best third-placed sides.
              {completedCount >= 2 && top2.length >= 2 && (
                <> As it stands, <span className="b">{top2[0].teamName}</span> and <span className="b">{top2[1].teamName}</span> hold the qualification places.</>
              )}
            </p>
          </section>

          {/* Fixtures */}
          <section>
            <div className="gd-section-head">
              <h2>Fixtures &amp; Results</h2>
              <span className="eyebrow">Round robin · 6 matches</span>
            </div>

            <GroupFixtures matchdays={matchdays} />
          </section>
        </div>

        <div className="foot-note">
          <span>Standings update live after each match</span>
          <span>Where to watch: FOX · FS1 · Telemundo · Peacock</span>
        </div>
      </div>
    </>
  );
}
