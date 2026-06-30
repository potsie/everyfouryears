/* ============================================================
   bracket-data.ts — types and client-side helpers for /bracket

   Shared type definitions for the knockout tree, plus the two
   runtime helpers used by the bracket UI:
     - isTBD(): narrows a team slot to its TBD placeholder form
     - hydrateClientBracket(): rebuilds the client-only pathForTeam
       function from the serialized bracket sent across the RSC
       boundary

   Live bracket data is produced in bracket-builder.ts from the
   ESPN scoreboard. This file holds no fixture data.
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
  // Penalty-shootout score [a, b] when the tie was decided on penalties; null
  // otherwise. The goal `score` stays level, so this determines the winner.
  shootout: [number, number] | null;
  winner: 'a' | 'b' | null;
  state: TieState;
  clock: string | null;
  // True while the live tie is in a penalty shootout (STATUS_SHOOTOUT); the UI
  // shows "PENALTIES" instead of the frozen "120'" clock.
  isShootout: boolean;
  when: string | null;
  dateISO: string | null;
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

// Fully serializable — safe to pass across the RSC boundary
export interface SerializableBracket {
  columnsL: BracketColumn[];
  columnsR: BracketColumn[];
  final: Tie;
  third: Tie;
  byRound: Record<string, Tie[]>;
  roundMeta: RoundMeta[];
  all: Tie[];
  byId: Record<string, Tie>;
  alive: string[];
  myTeam: string;
  window: string;
}

// Full client-side data (adds the pathForTeam function)
export interface WCBracketData extends SerializableBracket {
  pathForTeam: (code: string | null) => PathResult;
}

// Rebuild client-side: index + pathForTeam from serialized data
export function hydrateClientBracket(s: SerializableBracket): WCBracketData {
  const { all, byId } = s;
  const ORDER: Record<string, number> = { R32: 0, R16: 1, QF: 2, SF: 3, F: 4 };

  function pathForTeam(code: string | null): PathResult {
    const empty: PathResult = { confirmed: new Set(), future: new Set(), conns: new Set(), futureConns: new Set(), eliminated: false, frontier: null };
    if (!code) return empty;
    const has = (t: Tie) => (!isTBD(t.a) && (t.a as TieTeam).code === code) || (!isTBD(t.b) && (t.b as TieTeam).code === code);
    const inTies = all.filter(t => t.round !== '3P' && has(t)).sort((x, y) => (ORDER[x.round] ?? 0) - (ORDER[y.round] ?? 0));
    if (!inTies.length) return empty;
    const confirmed = new Set(inTies.map(t => t.id));
    const conns = new Set<string>();
    for (let i = 0; i < inTies.length - 1; i++) conns.add(`${inTies[i].id}>${inTies[i + 1].id}`);
    const frontier = inTies[inTies.length - 1];
    let eliminated = false;
    let advance = true;
    const future = new Set<string>();
    const futureConns = new Set<string>();
    if (frontier.state === 'post') {
      const won = (frontier.winner === 'a' && !isTBD(frontier.a) && (frontier.a as TieTeam).code === code)
        || (frontier.winner === 'b' && !isTBD(frontier.b) && (frontier.b as TieTeam).code === code);
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

  return { ...s, pathForTeam };
}
