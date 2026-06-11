'use client';

import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { Shot } from '@/components/Shot';
import { GroupMini } from '@/components/GroupMini';
import type { GroupMiniRow } from '@/components/GroupMini';
import PinMyTeamButton from '@/components/PinMyTeamButton';
import type { NewsItem } from '@/lib/news';

interface FormEntry {
  res: 'W' | 'D' | 'L';
  score: string;
  opp: string;
}

interface NextMatch {
  oppAbbr: string;
  oppLogo: string;
  date: string;
  venue: string;
  venueCity: string;
}

interface SquadPlayer {
  id: string;
  name: string;
  pos: string;
  age: number;
  height: string;
  photoUrl: string | null;
}

interface TeamClientProps {
  abbr: string;
  teamName: string;
  logo: string;
  fifaRank: number | null;
  rankingMovement: number | null;
  rankingPrev: number | null;
  ratedMatches: number | null;
  foundationYear: number | null;
  confederation: string;
  coach: string | null;
  groupLetter: string;
  groupRank: number | null;
  pts: number;
  played: number;
  wcApps: number | null;
  nickname: string | null;
  form: FormEntry[];
  nextMatch: NextMatch | null;
  squad: SquadPlayer[];
  groupStandings: GroupMiniRow[];
  teamColorPrimary: string | null;
  teamColorAlt: string | null;
  teamNews: NewsItem[];
}

function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TeamClient({
  abbr,
  teamName,
  logo,
  fifaRank,
  rankingMovement,
  rankingPrev,
  ratedMatches,
  foundationYear,
  confederation,
  coach,
  groupLetter,
  groupRank,
  pts,
  played,
  wcApps,
  nickname,
  form,
  nextMatch,
  squad,
  groupStandings,
  teamColorPrimary,
  teamColorAlt,
  teamNews,
}: TeamClientProps) {
  const previewSquad = squad.slice(0, 6);

  // Build hero background: blend team color into navy when available
  const heroBackground = teamColorPrimary
    ? `linear-gradient(135deg, color-mix(in srgb, ${teamColorPrimary} 55%, #0a2240) 0%, #0a2240 100%)`
    : undefined;

  return (
    <>
      {/* Hero — team color tinted when available */}
      <div className="th" style={heroBackground ? { background: heroBackground } : undefined}>
        <div className="th-grain" />
        <div className="th-in">
          <div className="th-top">
            <Link href={groupLetter ? `/groups/${groupLetter.toLowerCase()}` : '/groups'} className="th-back">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {groupLetter ? `Group ${groupLetter}` : 'Groups'}
            </Link>
            {fifaRank != null && (
              <span className="th-rankpill">
                FIFA World Ranking <b className="tnum">#{fifaRank}</b>
                {rankingMovement != null && rankingMovement !== 0 && (
                  <span
                    className="tnum"
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: rankingMovement > 0 ? '#7ee2a8' : '#f87171',
                    }}
                  >
                    {rankingMovement > 0 ? '▲' : '▼'}{Math.abs(rankingMovement)}
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="th-id">
            <div className="flagwrap">
              <Flag logo={logo} abbr={abbr} size={64} />
            </div>
            <div className="titles">
              <div className="eyebrow2">{confederation} · 2026 World Cup</div>
              <h1>{teamName}</h1>
              <div className="subline">
                {nickname && (
                  <>
                    <span>{nickname}</span>
                    <span className="sep">·</span>
                  </>
                )}
                {coach && (
                  <>
                    <span>Coach <b>{coach}</b></span>
                    <span className="sep">·</span>
                  </>
                )}
                {groupLetter && (
                  <span>Group <b>{groupLetter}</b></span>
                )}
              </div>
              <div style={{ marginTop: 10 }}>
                <PinMyTeamButton abbr={abbr} />
              </div>
            </div>
          </div>

          <div className="th-strip">
            {fifaRank != null && (
              <div className="cell">
                <div className="v tnum" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  #{fifaRank}
                  {rankingMovement != null && rankingMovement !== 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: rankingMovement > 0 ? '#7ee2a8' : '#f87171' }}>
                      {rankingMovement > 0 ? '▲' : '▼'}{Math.abs(rankingMovement)}
                    </span>
                  )}
                </div>
                <div className="k">World rank</div>
              </div>
            )}
            {groupRank != null && groupLetter && (
              <div className="cell">
                <div className="v">{ordinal(groupRank)}</div>
                <div className="k">Group {groupLetter}</div>
              </div>
            )}
            <div className="cell">
              <div className="v tnum">{played}</div>
              <div className="k">Played</div>
            </div>
            <div className="cell">
              <div className="v tnum">{pts}</div>
              <div className="k">Points</div>
            </div>
            {wcApps != null && (
              <div className="cell">
                <div className="v tnum">{wcApps}</div>
                <div className="k">WC apps</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="cols">
        <div>
          {/* At the tournament */}
          <div className="t-card">
            <div
              className="t-card-head"
              style={teamColorPrimary ? { background: `color-mix(in srgb, ${teamColorPrimary} 25%, var(--navy))` } : undefined}
            >
              <h3>At the 2026 World Cup</h3>
              {groupLetter && (
                <Link href={`/groups/${groupLetter.toLowerCase()}`} className="lnk">
                  Group {groupLetter}{' '}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              )}
            </div>

            {groupStandings.length > 0 && groupLetter && (
              <GroupMini rows={groupStandings} letter={groupLetter} />
            )}

            {nextMatch && (
              <div className="next-match">
                <div>
                  <div className="nm-tag">Next match</div>
                  <div className="nm-main" style={{ marginTop: 6 }}>
                    <Flag logo={logo} abbr={abbr} size={22} />
                    <span className="c">{abbr}</span>
                    <span className="muted" style={{ fontWeight: 700 }}>vs</span>
                    <span className="c">{nextMatch.oppAbbr}</span>
                    <Flag logo={nextMatch.oppLogo} abbr={nextMatch.oppAbbr} size={22} />
                  </div>
                </div>
                <span className="grow" />
                <div className="nm-when">
                  {formatMatchDate(nextMatch.date)}
                  <div className="v">{nextMatch.venue}, {nextMatch.venueCity}</div>
                </div>
              </div>
            )}
          </div>

          {/* Recent form */}
          {form.length > 0 && (
            <div className="t-card">
              <div
                className="t-card-head"
                style={teamColorPrimary ? { background: `color-mix(in srgb, ${teamColorPrimary} 25%, var(--navy))` } : undefined}
              >
                <h3>Recent form</h3>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--ink-3)',
                  }}
                >
                  Last {form.length}
                </span>
              </div>
              <div className="form-strip">
                {form.map((f, i) => (
                  <div className="form-game" key={i}>
                    <div className={`form-res ${f.res}`}>{f.res}</div>
                    <div className="sc tnum">{f.score}</div>
                    <div className="vs">v {f.opp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Squad preview */}
          {previewSquad.length > 0 && (
            <div className="t-card">
              <div
                className="t-card-head"
                style={teamColorPrimary ? { background: `color-mix(in srgb, ${teamColorPrimary} 25%, var(--navy))` } : undefined}
              >
                <h3>Squad</h3>
                <Link href={`/team/${abbr.toLowerCase()}/roster`} className="lnk">
                  Full squad{' '}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 1,
                  background: 'var(--line)',
                }}
              >
                {previewSquad.map(p => (
                  <Link
                    key={p.id}
                    href={`/player/${p.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        background: 'var(--surface)',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'background .12s',
                      }}
                    >
                      <Shot
                        size={40}
                        name={p.name}
                        headshotUrl={p.photoUrl ?? undefined}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontFamily: 'var(--display)',
                            fontWeight: 700,
                            fontSize: 13.5,
                            color: 'var(--ink)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: 'var(--ink-3)',
                            fontWeight: 500,
                            marginTop: 2,
                          }}
                        >
                          {p.pos} · Age <span className="tnum">{p.age}</span>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--ink-3)',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {p.height}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
                <Link
                  href={`/team/${abbr.toLowerCase()}/roster`}
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 700,
                    fontSize: 13,
                    color: 'var(--ink-2)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  View full squad ({squad.length} players){' '}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Shelf */}
        <div className="shelf">
          {teamNews.length > 0 && (
            <div className="panel">
              <div className="panel-head">
                <h3>Latest news</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {teamNews.map((article, i) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '11px 16px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
                      {article.feedTitle}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>
                      {article.title}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-head">
              <h3>Quick facts</h3>
            </div>
            <div className="facts">
              <div className="fact-row">
                <span className="k">Confederation</span>
                <span className="v">{confederation || '—'}</span>
              </div>
              <div className="fact-row">
                <span className="k">Head coach</span>
                <span className="v">{coach || '—'}</span>
              </div>
              {fifaRank != null && (
                <div className="fact-row">
                  <span className="k">FIFA Ranking</span>
                  <span className="v tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    #{fifaRank}
                    {rankingMovement != null && rankingMovement !== 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: rankingMovement > 0 ? '#16a34a' : '#dc2626' }}>
                        {rankingMovement > 0 ? '▲' : '▼'}{Math.abs(rankingMovement)}
                      </span>
                    )}
                    {rankingMovement === 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>—</span>
                    )}
                  </span>
                </div>
              )}
              {wcApps != null && (
                <div className="fact-row">
                  <span className="k">WC appearances</span>
                  <span className="v tnum">{wcApps}</span>
                </div>
              )}
              {ratedMatches != null && (
                <div className="fact-row">
                  <span className="k">Ranked matches</span>
                  <span className="v tnum">{ratedMatches}</span>
                </div>
              )}
              {foundationYear != null && (
                <div className="fact-row">
                  <span className="k">FA founded</span>
                  <span className="v tnum">{foundationYear}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
