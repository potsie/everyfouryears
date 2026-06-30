import type { TeamShootout, ShootoutResult } from '@/lib/normalize/world-cup-normalizer';

// Penalty-shootout display: a make/miss dot sequence per team plus the running
// score. Used on the homepage hero tile, match cards, and the match page hero.
// `tone` adapts the palette for dark (navy hero) vs light (card surface) contexts.

const STD_ROUND = 5; // best-of-five before sudden death

type Tone = 'dark' | 'light';

const PALETTE: Record<Tone, { scored: string; missed: string; saved: string; upcoming: string; label: string; rule: string; num: string }> = {
  dark: {
    scored: '#7ee2a8',
    missed: '#f0727a',
    saved: '#f5b945',
    upcoming: 'rgba(255,255,255,.22)',
    label: 'rgba(255,255,255,.5)',
    rule: 'rgba(255,255,255,.12)',
    num: '#fff',
  },
  light: {
    scored: '#16a34a',
    missed: '#dc2626',
    saved: '#d97706',
    upcoming: 'var(--line-2)',
    label: 'var(--ink-3)',
    rule: 'var(--line)',
    num: 'var(--ink)',
  },
};

const RESULT_LABEL: Record<ShootoutResult, string> = { scored: 'scored', missed: 'missed', saved: 'saved' };

function Dot({ result, tone, size, title }: { result: ShootoutResult | 'upcoming'; tone: Tone; size: number; title?: string }) {
  const p = PALETTE[tone];
  // Scored = filled disc; everything else = hollow ring, so shape (not just
  // colour) carries the scored/not-scored distinction. Colour then separates the
  // three not-scored states: a goalkeeper save (amber, with a centre pip to mark
  // the keeper's contact), an off-target miss (red), and a kick still to come
  // (faint).
  const common = { width: size, height: size, borderRadius: '50%', display: 'inline-block' as const };
  if (result === 'scored') return <span title={title} style={{ ...common, background: p.scored }} />;
  const color = result === 'missed' ? p.missed : result === 'saved' ? p.saved : p.upcoming;
  return (
    <span
      title={title}
      style={{
        ...common,
        border: `1.5px solid ${color}`,
        boxSizing: 'border-box',
        // A save gets a small filled centre so it reads distinctly from an empty
        // off-target ring even before you reach for the tooltip.
        background: result === 'saved'
          ? `radial-gradient(circle, ${color} 0 30%, transparent 32%)`
          : undefined,
      }}
    />
  );
}

function TeamDots({ so, slots, tone, size }: { so: TeamShootout; slots: number; tone: Tone; size: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.45 }}>
      {Array.from({ length: slots }, (_, i) => {
        const kick = i < so.kicks.length ? so.kicks[i] : null;
        const title = kick ? (kick.player ? `${kick.player} — ${RESULT_LABEL[kick.result]}` : RESULT_LABEL[kick.result]) : undefined;
        return (
          <Dot key={i} result={kick ? kick.result : 'upcoming'} tone={tone} size={size} title={title} />
        );
      })}
    </span>
  );
}

export function ShootoutStrip({
  homeAbbr,
  awayAbbr,
  home,
  away,
  tone = 'dark',
  size = 9,
}: {
  homeAbbr: string;
  awayAbbr: string;
  home: TeamShootout;
  away: TeamShootout;
  tone?: Tone;
  size?: number;
}) {
  const p = PALETTE[tone];
  // The dot sequence comes only from summary commentary; with totals-only data
  // (e.g. a scoreboard fetch that couldn't be enriched) there are no kicks to
  // draw, so the PK score column stands alone.
  if (home.kicks.length === 0 && away.kicks.length === 0) return null;
  // Show five slots during the standard round; once either side has taken more
  // than five, we're in sudden death — drop placeholders and size to the longer
  // sequence so both rows stay aligned.
  const maxKicks = Math.max(home.kicks.length, away.kicks.length);
  const suddenDeath = maxKicks > STD_ROUND;
  const slots = suddenDeath ? maxKicks : STD_ROUND;

  const row = (abbr: string, so: TeamShootout) => (
    <div className="flex items-center justify-between" style={{ gap: 12 }}>
      <span className="flex items-center" style={{ gap: 8 }}>
        <span className="font-display font-bold tabular-nums" style={{ fontSize: 12, color: p.label, width: 30 }}>{abbr}</span>
        <TeamDots so={so} slots={slots} tone={tone} size={size} />
      </span>
      <span className="font-display font-black tnum" style={{ fontSize: 15, color: p.num }}>{so.score}</span>
    </div>
  );

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${p.rule}` }}>
      <div
        className="font-bold uppercase"
        style={{ fontSize: 8.5, letterSpacing: '.1em', color: p.label, marginBottom: 6 }}
      >
        Penalties{suddenDeath ? ' · sudden death' : ''}
      </div>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {row(homeAbbr, home)}
        {row(awayAbbr, away)}
      </div>
    </div>
  );
}
