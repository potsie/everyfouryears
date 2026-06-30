/* ============================================================
   bracket-builder.ts
   Converts live ESPN scoreboard matches into WCBracketData.

   ESPN pre-assigns all 31 knockout event IDs. Team slots are
   TBD pre-tournament (empty logo, placeholder abbreviation like
   "2A", "1C", "RD32") and fill in as results are confirmed.

   Feeder map derived from ESPN's own source labels:
     R16: "RD32 vs RD32" (pairs from bracket ordering)
     QF:  "RD16 W1 vs RD16 W2" etc.
     SF:  "QFW1 vs QFW2" / "QFW3 vs QFW4"
     F/3P: "SFW1 vs SFW2" / "SF L1 vs SF L2"
   ============================================================ */

import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import type { SerializableBracket, Tie, TieTeam, AnyTeam, RoundMeta, TieRound, TieSide, BracketColumn } from '@/lib/bracket-data';
import { isTBD } from '@/lib/bracket-data';

/* ---------- bracket slot definitions ---------- */

interface SlotDef {
  round: TieRound;
  side: TieSide;
  rk: number;
  tag: string | null;
  feeders: [string, string] | null; // [eventId, eventId]
}

// Keyed by ESPN event ID
const SLOT_MAP: Record<string, SlotDef> = {
  // ── R32 Left half (feeds SF1 via QF1+QF2) ──────────────────
  '760486': { round: 'R32', side: 'L', rk: 1, tag: null, feeders: null },
  '760487': { round: 'R32', side: 'L', rk: 2, tag: null, feeders: null },
  '760489': { round: 'R32', side: 'L', rk: 3, tag: null, feeders: null },
  '760488': { round: 'R32', side: 'L', rk: 4, tag: null, feeders: null },
  '760493': { round: 'R32', side: 'L', rk: 5, tag: null, feeders: null },
  '760494': { round: 'R32', side: 'L', rk: 6, tag: null, feeders: null },
  '760497': { round: 'R32', side: 'L', rk: 7, tag: null, feeders: null },
  '760496': { round: 'R32', side: 'L', rk: 8, tag: null, feeders: null },

  // ── R32 Right half (feeds SF2 via QF3+QF4) ─────────────────
  '760490': { round: 'R32', side: 'R', rk: 1, tag: null, feeders: null },
  '760492': { round: 'R32', side: 'R', rk: 2, tag: null, feeders: null },
  '760491': { round: 'R32', side: 'R', rk: 3, tag: null, feeders: null },
  '760495': { round: 'R32', side: 'R', rk: 4, tag: null, feeders: null },
  '760498': { round: 'R32', side: 'R', rk: 5, tag: null, feeders: null },
  '760499': { round: 'R32', side: 'R', rk: 6, tag: null, feeders: null },
  '760500': { round: 'R32', side: 'R', rk: 7, tag: null, feeders: null },
  '760501': { round: 'R32', side: 'R', rk: 8, tag: null, feeders: null },

  // ── R16 Left ────────────────────────────────────────────────
  '760502': { round: 'R16', side: 'L', rk: 1, tag: null, feeders: ['760486', '760487'] },
  '760503': { round: 'R16', side: 'L', rk: 2, tag: null, feeders: ['760489', '760488'] },
  '760506': { round: 'R16', side: 'L', rk: 3, tag: null, feeders: ['760493', '760494'] },
  '760507': { round: 'R16', side: 'L', rk: 4, tag: null, feeders: ['760497', '760496'] },

  // ── R16 Right ───────────────────────────────────────────────
  '760504': { round: 'R16', side: 'R', rk: 1, tag: null, feeders: ['760490', '760492'] },
  '760505': { round: 'R16', side: 'R', rk: 2, tag: null, feeders: ['760491', '760495'] },
  '760509': { round: 'R16', side: 'R', rk: 3, tag: null, feeders: ['760498', '760499'] },
  '760508': { round: 'R16', side: 'R', rk: 4, tag: null, feeders: ['760500', '760501'] },

  // ── QF Left ─────────────────────────────────────────────────
  '760510': { round: 'QF', side: 'L', rk: 1, tag: 'QF1', feeders: ['760502', '760503'] },
  '760511': { round: 'QF', side: 'L', rk: 2, tag: 'QF2', feeders: ['760506', '760507'] },

  // ── QF Right ────────────────────────────────────────────────
  '760512': { round: 'QF', side: 'R', rk: 1, tag: 'QF3', feeders: ['760504', '760505'] },
  '760513': { round: 'QF', side: 'R', rk: 2, tag: 'QF4', feeders: ['760509', '760508'] },

  // ── SF ──────────────────────────────────────────────────────
  '760514': { round: 'SF', side: 'L', rk: 1, tag: 'SF1', feeders: ['760510', '760511'] },
  '760515': { round: 'SF', side: 'R', rk: 1, tag: 'SF2', feeders: ['760512', '760513'] },

  // ── Center ──────────────────────────────────────────────────
  '760517': { round: 'F',  side: 'C', rk: 1, tag: 'Final',     feeders: ['760514', '760515'] },
  '760516': { round: '3P', side: 'C', rk: 1, tag: '3rd Place', feeders: ['760514', '760515'] },
};

/* ---------- helpers ---------- */

function flagUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/countries/500/${abbr.toLowerCase()}.png`;
}

function isPlaceholder(abbr: string, logo: string): boolean {
  if (!logo) return true;
  // Also catch any remaining placeholders (belt-and-suspenders)
  return /^\d|^RD|^QF|^SF/i.test(abbr);
}

function srcLabel(abbr: string, displayName: string): string {
  // ESPN gives us a readable displayName like "Group A 2nd Place" — use it
  // but shorten for compact bracket display
  if (displayName && !isPlaceholder(abbr, 'non-empty')) {
    return displayName;
  }
  // Fallback to abbreviation
  return abbr || '?';
}

function toTeam(abbr: string, displayName: string, logo: string): AnyTeam {
  if (isPlaceholder(abbr, logo)) {
    return { tbd: true, src: displayName || abbr || 'TBD' };
  }
  return { code: abbr, name: displayName, flag: logo || flagUrl(abbr) };
}

/* ---------- main builder ---------- */

export function buildBracketFromMatches(matches: WorldCupMatchNormalized[]): SerializableBracket {
  const knockoutMatches = matches.filter(m => m.seasonTypeId > 1);

  const byId: Record<string, Tie> = {};

  // Build all known slots, filling in data from ESPN where we have it
  for (const [eventId, slot] of Object.entries(SLOT_MAP)) {
    const m = knockoutMatches.find(m => m.eventId === eventId);

    let a: AnyTeam, b: AnyTeam;
    let score: [number, number] | null = null;
    let shootout: [number, number] | null = null;
    let winner: 'a' | 'b' | null = null;
    let state: Tie['state'] = 'tbd';
    let clock: string | null = null;
    let when: string | null = null;
    let dateISO: string | null = null;
    let venue: string | null = null;
    let city: string | null = null;
    let tv: string | null = null;

    if (m) {
      a = toTeam(m.home.abbr, m.home.name, m.home.logo);
      b = toTeam(m.away.abbr, m.away.name, m.away.logo);
      venue = m.venue || null;
      city = m.venueCity || null;
      tv = m.broadcaster || null;

      // Teams known but not yet played → 'pre'; neither known → 'tbd'
      const bothTbd = isTBD(a) && isTBD(b);
      state = bothTbd ? 'tbd' : m.status.state === 'in' ? 'in' : m.status.state === 'post' ? 'post' : 'pre';

      if (state === 'in') {
        clock = m.status.clock || null;
      }

      if (state === 'post') {
        const hs = Number(m.home.score);
        const as_ = Number(m.away.score);
        score = [hs, as_];
        winner = hs > as_ ? 'a' : as_ > hs ? 'b' : null;
        // Level on goals → decided by penalties. The shootout score (sourced
        // from the scoreboard + commentary) breaks the tie.
        if (winner === null && m.home.shootout && m.away.shootout) {
          const sh = m.home.shootout.score;
          const sa = m.away.shootout.score;
          shootout = [sh, sa];
          winner = sh > sa ? 'a' : sa > sh ? 'b' : null;
        }
      }

      // Raw ISO stored; BracketClient formats in visitor's local timezone
      dateISO = m.date || null;
    } else {
      // Slot not in fetched matches — fully TBD
      a = { tbd: true, src: 'TBD' };
      b = { tbd: true, src: 'TBD' };
    }

    const tie: Tie = {
      id: eventId,
      round: slot.round,
      side: slot.side,
      rk: slot.rk,
      tag: slot.tag,
      a, b, score, shootout, winner, state, clock, when, dateISO, venue, city, tv,
      feeders: slot.feeders,
      parent: null,
    };

    byId[eventId] = tie;
  }

  const all = Object.values(byId);

  // Wire parent links (main progression — skip 3P so it doesn't claim SF feeders)
  all.forEach(t => {
    if (t.round === '3P' || !t.feeders) return;
    t.feeders.forEach(fid => { if (byId[fid]) byId[fid].parent = t.id; });
  });

  // Layout helpers
  const R32L = all.filter(t => t.round === 'R32' && t.side === 'L').sort((a, b) => a.rk - b.rk);
  const R16L = all.filter(t => t.round === 'R16' && t.side === 'L').sort((a, b) => a.rk - b.rk);
  const QFL  = all.filter(t => t.round === 'QF'  && t.side === 'L').sort((a, b) => a.rk - b.rk);
  const SFL  = all.filter(t => t.round === 'SF'  && t.side === 'L').sort((a, b) => a.rk - b.rk);
  const SFR  = all.filter(t => t.round === 'SF'  && t.side === 'R').sort((a, b) => a.rk - b.rk);
  const QFR  = all.filter(t => t.round === 'QF'  && t.side === 'R').sort((a, b) => a.rk - b.rk);
  const R16R = all.filter(t => t.round === 'R16' && t.side === 'R').sort((a, b) => a.rk - b.rk);
  const R32R = all.filter(t => t.round === 'R32' && t.side === 'R').sort((a, b) => a.rk - b.rk);
  const FIN  = byId['760517'];
  const TP   = byId['760516'];

  const aliveSet = new Set<string>();
  all.forEach(t => {
    if (t.round === '3P') return;
    (['a', 'b'] as const).forEach(s => {
      const team = t[s];
      if (!team || isTBD(team)) return;
      if (t.state === 'post') { if (t.winner === s) aliveSet.add((team as TieTeam).code); }
      else aliveSet.add((team as TieTeam).code);
    });
  });
  const alive = [...aliveSet].sort();

  // Determine tournament window from first/last knockout event dates
  const koMatches = knockoutMatches.sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = koMatches[0]?.date;
  const lastDate = koMatches[koMatches.length - 1]?.date;
  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch { return ''; }
  }
  const window = firstDate && lastDate
    ? `Round of 32 · ${fmtDate(firstDate)} → Final · ${fmtDate(lastDate)}`
    : 'Round of 32 · Jun 28 → Final · Jul 19';

  const roundMeta: RoundMeta[] = [
    { key: 'R32', label: 'Round of 32', abbr: 'R32', n: 16 },
    { key: 'R16', label: 'Round of 16', abbr: 'R16', n: 8 },
    { key: 'QF',  label: 'Quarterfinals', abbr: 'QF', n: 4 },
    { key: 'SF',  label: 'Semifinals', abbr: 'SF', n: 2 },
    { key: 'F',   label: 'Final', abbr: 'Final', n: 1 },
  ];

  return {
    columnsL: [
      { key: 'R32', side: 'L', ties: R32L },
      { key: 'R16', side: 'L', ties: R16L },
      { key: 'QF',  side: 'L', ties: QFL },
      { key: 'SF',  side: 'L', ties: SFL },
    ],
    columnsR: [
      { key: 'SF',  side: 'R', ties: SFR },
      { key: 'QF',  side: 'R', ties: QFR },
      { key: 'R16', side: 'R', ties: R16R },
      { key: 'R32', side: 'R', ties: R32R },
    ],
    final: FIN,
    third: TP,
    byRound: {
      R32: [...R32L, ...R32R],
      R16: [...R16L, ...R16R],
      QF:  [...QFL, ...QFR],
      SF:  [...SFL, ...SFR],
      F:   [FIN],
      '3P': [TP],
    },
    roundMeta, all, byId, alive,
    myTeam: '',
    window,
  };
}
