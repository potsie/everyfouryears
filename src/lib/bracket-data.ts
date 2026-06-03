/* ============================================================
   bracket-data.ts — knockout tree for /bracket
   Mock snapshot: R32 & R16 complete, QF in progress.
   In production, replace buildMockBracket() with data from
   fetchAllMatches() filtered by seasonTypeId 2-7.
   ============================================================ */

export type TieState = 'post' | 'in' | 'pre' | 'tbd';
export type TieRound = 'R32' | 'R16' | 'QF' | 'SF' | 'F' | '3P';
export type TieSide = 'L' | 'R' | 'C';

export interface TieTeam {
  code: string;
  name: string;
  flag: string;
}

export interface TBDTeam {
  tbd: true;
  src: string;
}

export type AnyTeam = TieTeam | TBDTeam;

export function isTBD(t: AnyTeam): t is TBDTeam {
  return (t as TBDTeam).tbd === true;
}

export interface Tie {
  id: string;
  round: TieRound;
  side: TieSide;
  rk: number;
  tag: string | null;
  a: AnyTeam;
  b: AnyTeam;
  score: [number, number] | null;
  winner: 'a' | 'b' | null;
  state: TieState;
  clock: string | null;
  when: string | null;
  venue: string | null;
  city: string | null;
  tv: string | null;
  feeders: [string, string] | null;
  parent: string | null;
}

export interface RoundMeta {
  key: string;
  label: string;
  abbr: string;
  n: number;
}

export interface BracketColumn {
  key: string;
  side: TieSide;
  ties: Tie[];
}

export interface PathResult {
  confirmed: Set<string>;
  future: Set<string>;
  conns: Set<string>;
  futureConns: Set<string>;
  eliminated: boolean;
  frontier: string | null;
}

export interface WCBracketData {
  columnsL: BracketColumn[];
  columnsR: BracketColumn[];
  final: Tie;
  third: Tie;
  byRound: Record<string, Tie[]>;
  roundMeta: RoundMeta[];
  all: Tie[];
  byId: Record<string, Tie>;
  pathForTeam: (code: string | null) => PathResult;
  alive: string[];
  myTeam: string;
  window: string;
}

function espnFlag(code: string): string {
  return `https://a.espncdn.com/i/teamlogos/countries/500/${code.toLowerCase()}.png`;
}

const TEAMS: Record<string, { name: string; flag: string }> = {
  ARG: { name: 'Argentina', flag: espnFlag('ARG') },
  NOR: { name: 'Norway', flag: espnFlag('NOR') },
  ESP: { name: 'Spain', flag: espnFlag('ESP') },
  GHA: { name: 'Ghana', flag: espnFlag('GHA') },
  CRO: { name: 'Croatia', flag: espnFlag('CRO') },
  SEN: { name: 'Senegal', flag: espnFlag('SEN') },
  BRA: { name: 'Brazil', flag: espnFlag('BRA') },
  SRB: { name: 'Serbia', flag: espnFlag('SRB') },
  MAR: { name: 'Morocco', flag: espnFlag('MAR') },
  POR: { name: 'Portugal', flag: espnFlag('POR') },
  TUN: { name: 'Tunisia', flag: espnFlag('TUN') },
  NED: { name: 'Netherlands', flag: espnFlag('NED') },
  ECU: { name: 'Ecuador', flag: espnFlag('ECU') },
  FRA: { name: 'France', flag: espnFlag('FRA') },
  RSA: { name: 'South Africa', flag: espnFlag('RSA') },
  ENG: { name: 'England', flag: espnFlag('ENG') },
  SUI: { name: 'Switzerland', flag: espnFlag('SUI') },
  GER: { name: 'Germany', flag: espnFlag('GER') },
  SWE: { name: 'Sweden', flag: espnFlag('SWE') },
  BEL: { name: 'Belgium', flag: espnFlag('BEL') },
  CIV: { name: 'Ivory Coast', flag: espnFlag('CIV') },
  USA: { name: 'United States', flag: espnFlag('USA') },
  AUT: { name: 'Austria', flag: espnFlag('AUT') },
  COL: { name: 'Colombia', flag: espnFlag('COL') },
  TUR: { name: 'Türkiye', flag: espnFlag('TUR') },
  URU: { name: 'Uruguay', flag: espnFlag('URU') },
  MEX: { name: 'Mexico', flag: espnFlag('MEX') },
  CZE: { name: 'Czechia', flag: espnFlag('CZE') },
  SCO: { name: 'Scotland', flag: espnFlag('SCO') },
  PAR: { name: 'Paraguay', flag: espnFlag('PAR') },
  AUS: { name: 'Australia', flag: espnFlag('AUS') },
};

function tm(code: string): TieTeam {
  const t = TEAMS[code] || { name: code, flag: espnFlag(code) };
  return { code, name: t.name, flag: t.flag };
}

function tbd(src: string): TBDTeam {
  return { tbd: true, src };
}

interface TieOptions {
  tag?: string;
  state?: TieState;
  score?: [number, number];
  winner?: 'a' | 'b';
  clock?: string;
  when?: string;
  venue?: string;
  city?: string;
  tv?: string;
  feeders?: [string, string];
}

function T(round: TieRound, side: TieSide, rk: number, a: AnyTeam, b: AnyTeam, o: TieOptions = {}): Tie {
  let winner = o.winner || null;
  if (!winner && o.state === 'post' && o.score) {
    winner = o.score[0] > o.score[1] ? 'a' : 'b';
  }
  return {
    id: `${round}-${side}-${rk}`,
    round, side, rk,
    tag: o.tag || null,
    a, b,
    score: o.score || null,
    winner,
    state: o.state || 'pre',
    clock: o.clock || null,
    when: o.when || null,
    venue: o.venue || null,
    city: o.city || null,
    tv: o.tv || null,
    feeders: o.feeders || null,
    parent: null,
  };
}

function post(score: [number, number], extra: Omit<TieOptions, 'state' | 'score'> = {}): TieOptions {
  return { state: 'post', score, ...extra };
}

export function buildBracketData(): WCBracketData {
  /* ---------- LEFT HALF ---------- */
  const R32L = [
    T('R32', 'L', 1, tm('ARG'), tm('PAR'), post([2, 0], { venue: 'NRG Stadium', city: 'Houston', tv: 'FOX' })),
    T('R32', 'L', 2, tm('NOR'), tm('AUS'), post([1, 0], { venue: 'BC Place', city: 'Vancouver', tv: 'FS1' })),
    T('R32', 'L', 3, tm('ESP'), tm('GHA'), post([3, 1], { venue: "Levi's Stadium", city: 'Santa Clara', tv: 'FOX' })),
    T('R32', 'L', 4, tm('CRO'), tm('SEN'), post([2, 1], { venue: 'Lincoln Financial', city: 'Philadelphia', tv: 'Telemundo' })),
    T('R32', 'L', 5, tm('BRA'), tm('SRB'), post([2, 0], { venue: 'SoFi Stadium', city: 'Inglewood', tv: 'Telemundo' })),
    T('R32', 'L', 6, tm('MAR'), tm('JPN'), post([1, 0], { venue: 'Mercedes-Benz', city: 'Atlanta', tv: 'FS1' })),
    T('R32', 'L', 7, tm('POR'), tm('TUN'), post([2, 1], { venue: 'Gillette Stadium', city: 'Foxborough', tv: 'FOX' })),
    T('R32', 'L', 8, tm('NED'), tm('ECU'), post([3, 1], { venue: 'Estadio Akron', city: 'Guadalajara', tv: 'Universo' })),
  ];
  const R16L = [
    T('R16', 'L', 1, tm('ARG'), tm('NOR'), post([2, 1], { feeders: ['R32-L-1', 'R32-L-2'], venue: 'AT&T Stadium', city: 'Arlington', tv: 'FOX' })),
    T('R16', 'L', 2, tm('ESP'), tm('CRO'), post([1, 0], { feeders: ['R32-L-3', 'R32-L-4'], venue: 'Lumen Field', city: 'Seattle', tv: 'FS1' })),
    T('R16', 'L', 3, tm('BRA'), tm('MAR'), post([2, 1], { feeders: ['R32-L-5', 'R32-L-6'], venue: 'SoFi Stadium', city: 'Inglewood', tv: 'Telemundo' })),
    T('R16', 'L', 4, tm('POR'), tm('NED'), post([1, 1], { feeders: ['R32-L-7', 'R32-L-8'], winner: 'a', clock: '5–3 pens', venue: 'Hard Rock', city: 'Miami', tv: 'FOX' })),
  ];
  const QFL = [
    T('QF', 'L', 1, tm('ARG'), tm('ESP'), { tag: 'QF1', state: 'in', score: [1, 1], clock: "63'", feeders: ['R16-L-1', 'R16-L-2'], venue: 'MetLife Stadium', city: 'East Rutherford', tv: 'FOX' }),
    T('QF', 'L', 2, tm('BRA'), tm('POR'), { tag: 'QF2', state: 'pre', when: 'Sat · 3:00 PM', feeders: ['R16-L-3', 'R16-L-4'], venue: 'SoFi Stadium', city: 'Inglewood', tv: 'Telemundo' }),
  ];
  const SFL = [
    T('SF', 'L', 1, tbd('QF1 Winner'), tbd('QF2 Winner'), { tag: 'SF1', state: 'tbd', when: 'Jul 14 · 8:00 PM', feeders: ['QF-L-1', 'QF-L-2'], venue: 'AT&T Stadium', city: 'Arlington', tv: 'FOX' }),
  ];

  /* ---------- RIGHT HALF ---------- */
  const R32R = [
    T('R32', 'R', 1, tm('FRA'), tm('RSA'), post([4, 0], { venue: 'Arrowhead', city: 'Kansas City', tv: 'FOX' })),
    T('R32', 'R', 2, tm('ENG'), tm('SUI'), post([2, 1], { venue: 'BMO Field', city: 'Toronto', tv: 'FS1' })),
    T('R32', 'R', 3, tm('GER'), tm('SWE'), post([2, 0], { venue: 'Lumen Field', city: 'Seattle', tv: 'Telemundo' })),
    T('R32', 'R', 4, tm('BEL'), tm('CIV'), post([3, 1], { venue: 'Estadio BBVA', city: 'Monterrey', tv: 'Universo' })),
    T('R32', 'R', 5, tm('USA'), tm('AUT'), post([2, 1], { venue: 'MetLife Stadium', city: 'East Rutherford', tv: 'FOX' })),
    T('R32', 'R', 6, tm('COL'), tm('TUR'), post([1, 0], { venue: 'Hard Rock', city: 'Miami', tv: 'FS1' })),
    T('R32', 'R', 7, tm('URU'), tm('MEX'), post([2, 1], { venue: 'Estadio Banorte', city: 'Mexico City', tv: 'Telemundo' })),
    T('R32', 'R', 8, tm('CZE'), tm('SCO'), post([1, 0], { venue: 'Gillette Stadium', city: 'Foxborough', tv: 'FOX' })),
  ];
  const R16R = [
    T('R16', 'R', 1, tm('FRA'), tm('ENG'), post([2, 1], { feeders: ['R32-R-1', 'R32-R-2'], venue: 'AT&T Stadium', city: 'Arlington', tv: 'FOX' })),
    T('R16', 'R', 2, tm('GER'), tm('BEL'), post([1, 0], { feeders: ['R32-R-3', 'R32-R-4'], venue: 'Lumen Field', city: 'Seattle', tv: 'FS1' })),
    T('R16', 'R', 3, tm('USA'), tm('COL'), post([2, 1], { feeders: ['R32-R-5', 'R32-R-6'], venue: 'MetLife Stadium', city: 'East Rutherford', tv: 'FOX' })),
    T('R16', 'R', 4, tm('URU'), tm('CZE'), post([3, 0], { feeders: ['R32-R-7', 'R32-R-8'], venue: 'NRG Stadium', city: 'Houston', tv: 'Telemundo' })),
  ];
  const QFR = [
    T('QF', 'R', 1, tm('FRA'), tm('GER'), post([1, 0], { tag: 'QF3', feeders: ['R16-R-1', 'R16-R-2'], venue: 'Lincoln Financial', city: 'Philadelphia', tv: 'FOX' })),
    T('QF', 'R', 2, tm('USA'), tm('URU'), post([2, 1], { tag: 'QF4', feeders: ['R16-R-3', 'R16-R-4'], venue: 'Arrowhead', city: 'Kansas City', tv: 'FS1' })),
  ];
  const SFR = [
    T('SF', 'R', 1, tm('FRA'), tm('USA'), { tag: 'SF2', state: 'pre', when: 'Jul 15 · 8:00 PM', feeders: ['QF-R-1', 'QF-R-2'], venue: 'Mercedes-Benz', city: 'Atlanta', tv: 'FOX' }),
  ];

  /* ---------- CENTER ---------- */
  const FIN = T('F', 'C', 1, tbd('SF1 Winner'), tbd('SF2 Winner'), { tag: 'Final', state: 'tbd', when: 'Jul 19 · 3:00 PM', feeders: ['SF-L-1', 'SF-R-1'], venue: 'MetLife Stadium', city: 'East Rutherford', tv: 'FOX' });
  const TP = T('3P', 'C', 1, tbd('SF1 Loser'), tbd('SF2 Loser'), { tag: '3rd Place', state: 'tbd', when: 'Jul 18 · 3:00 PM', feeders: ['SF-L-1', 'SF-R-1'], venue: 'Hard Rock', city: 'Miami', tv: 'FS1' });

  const all = [...R32L, ...R16L, ...QFL, ...SFL, ...R32R, ...R16R, ...QFR, ...SFR, FIN, TP];
  const byId: Record<string, Tie> = {};
  all.forEach((t) => { byId[t.id] = t; });

  // parent links (main progression only — 3P doesn't claim feeders)
  all.forEach((t) => {
    if (t.round === '3P' || !t.feeders) return;
    t.feeders.forEach((fid) => { if (byId[fid]) byId[fid].parent = t.id; });
  });

  const ORDER: Record<string, number> = { R32: 0, R16: 1, QF: 2, SF: 3, F: 4 };

  function pathForTeam(code: string | null): PathResult {
    const empty: PathResult = { confirmed: new Set(), future: new Set(), conns: new Set(), futureConns: new Set(), eliminated: false, frontier: null };
    if (!code) return empty;
    const has = (t: Tie) => (!isTBD(t.a) && t.a.code === code) || (!isTBD(t.b) && t.b.code === code);
    const inTies = all.filter((t) => t.round !== '3P' && has(t)).sort((x, y) => (ORDER[x.round] ?? 0) - (ORDER[y.round] ?? 0));
    if (!inTies.length) return empty;
    const confirmed = new Set(inTies.map((t) => t.id));
    const conns = new Set<string>();
    for (let i = 0; i < inTies.length - 1; i++) conns.add(`${inTies[i].id}>${inTies[i + 1].id}`);
    const frontier = inTies[inTies.length - 1];
    let eliminated = false;
    let advance = true;
    const future = new Set<string>();
    const futureConns = new Set<string>();
    if (frontier.state === 'post') {
      const won = (frontier.winner === 'a' && !isTBD(frontier.a) && frontier.a.code === code)
        || (frontier.winner === 'b' && !isTBD(frontier.b) && frontier.b.code === code);
      if (!won) { eliminated = true; advance = false; }
    }
    if (advance) {
      let cur: Tie = frontier;
      while (cur.parent && byId[cur.parent]) {
        const p = byId[cur.parent];
        futureConns.add(`${cur.id}>${p.id}`);
        future.add(p.id);
        cur = p;
      }
    }
    return { confirmed, future, conns, futureConns, eliminated, frontier: frontier.id };
  }

  // Still-alive teams (for Trace dropdown)
  const aliveSet = new Set<string>();
  all.forEach((t) => {
    if (t.round === '3P') return;
    (['a', 'b'] as const).forEach((s) => {
      const team = t[s];
      if (!team || isTBD(team)) return;
      if (t.state === 'post') { if (t.winner === s) aliveSet.add(team.code); }
      else aliveSet.add(team.code);
    });
  });
  const alive = [...aliveSet].sort();

  return {
    columnsL: [
      { key: 'R32', side: 'L', ties: R32L },
      { key: 'R16', side: 'L', ties: R16L },
      { key: 'QF', side: 'L', ties: QFL },
      { key: 'SF', side: 'L', ties: SFL },
    ],
    columnsR: [
      { key: 'SF', side: 'R', ties: SFR },
      { key: 'QF', side: 'R', ties: QFR },
      { key: 'R16', side: 'R', ties: R16R },
      { key: 'R32', side: 'R', ties: R32R },
    ],
    final: FIN,
    third: TP,
    byRound: {
      R32: [...R32L, ...R32R],
      R16: [...R16L, ...R16R],
      QF: [...QFL, ...QFR],
      SF: [...SFL, ...SFR],
      F: [FIN],
      '3P': [TP],
    },
    roundMeta: [
      { key: 'R32', label: 'Round of 32', abbr: 'R32', n: 16 },
      { key: 'R16', label: 'Round of 16', abbr: 'R16', n: 8 },
      { key: 'QF', label: 'Quarterfinals', abbr: 'QF', n: 4 },
      { key: 'SF', label: 'Semifinals', abbr: 'SF', n: 2 },
      { key: 'F', label: 'Final', abbr: 'Final', n: 1 },
    ],
    all, byId, pathForTeam, alive,
    myTeam: 'USA',
    window: 'Round of 32 · Jun 28 → Final · Jul 19',
  };
}
