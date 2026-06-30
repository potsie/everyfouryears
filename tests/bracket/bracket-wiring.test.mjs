import assert from 'node:assert';
import { buildBracketFromMatches } from '../../src/lib/bracket-builder.ts';

// The knockout bracket wiring (which game feeds which, and where each box sits)
// is hardcoded in bracket-builder's SLOT_MAP. It MUST match the official FIFA
// bracket. We validate against two pieces of ground truth:
//
//  1. eventId -> FIFA matchNumber, from ESPN's Core API
//     (sports.core.api.../events/{id} -> competition.matchNumber). R32 = M73-M88,
//     R16 = M89-M96, QF = M97-M100, SF = M101/M102, Final = M104.
//  2. The fixed FIFA bracket pairings by match number (PAIR below) — these never
//     change for the tournament.
//
// A regression (e.g. mapping "Round of 32 5" by kickoff order instead of FIFA
// match number) puts games in the wrong bracket spots — the bug this guards.

const MN = {
  '760486': 73, '760489': 74, '760488': 75, '760487': 76, '760492': 77, '760490': 78,
  '760491': 79, '760495': 80, '760494': 81, '760493': 82, '760496': 83, '760497': 84,
  '760498': 85, '760500': 86, '760501': 87, '760499': 88,
  '760503': 89, '760502': 90, '760504': 91, '760505': 92, '760506': 93, '760507': 94,
  '760509': 95, '760508': 96,
  '760510': 97, '760511': 98, '760512': 99, '760513': 100,
  '760514': 101, '760515': 102, '760516': 103, '760517': 104,
};
const num2ev = Object.fromEntries(Object.entries(MN).map(([ev, n]) => [n, ev]));

// FIFA fixed structure: matchNumber -> [two feeder matchNumbers]
const PAIR = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100], 104: [101, 102], 103: [101, 102],
};

const b = buildBracketFromMatches([]); // teams TBD; we only assert wiring
const sortNums = a => [...a].sort((x, y) => x - y);

// ── Every non-R32 tie's feeders match the FIFA pairing for its match number ──
for (const [ev, n] of Object.entries(MN)) {
  if (n <= 88) continue; // R32 has no feeders
  const tie = b.byId[ev];
  const expected = sortNums(PAIR[n].map(fn => num2ev[fn]).map(e => MN[e]));
  const actual = sortNums(tie.feeders.map(f => MN[f]));
  assert.deepEqual(actual, expected, `M${n} (${ev}) feeders should be ${PAIR[n].map(x => 'M' + x)}`);
}

// ── R32 placement: each R16's two feeders are R32 boxes on the same side at
// adjacent ranks (2k-1, 2k), on the same side as the R16 itself. ──────────────
for (const [ev, n] of Object.entries(MN)) {
  if (n < 89 || n > 96) continue;
  const r16 = b.byId[ev];
  const [x, y] = r16.feeders.map(f => b.byId[f]);
  assert.equal(x.round, 'R32'); assert.equal(y.round, 'R32');
  assert.equal(x.side, y.side, `M${n} feeders share a side`);
  assert.equal(x.side, r16.side, `M${n} sits on its feeders' side`);
  assert.equal(Math.min(x.rk, y.rk) % 2, 1, `M${n} feeders start on an odd rank`);
  assert.equal(Math.abs(x.rk - y.rk), 1, `M${n} feeders are adjacent`);
}

// ── Left half is the M101 semifinal subtree, right half is M102 ──────────────
const LEFT = new Set([97, 98, 89, 90, 93, 94]);
const RIGHT = new Set([99, 100, 91, 92, 95, 96]);
for (const [ev, n] of Object.entries(MN)) {
  if (LEFT.has(n)) assert.equal(b.byId[ev].side, 'L', `M${n} should be on the left`);
  if (RIGHT.has(n)) assert.equal(b.byId[ev].side, 'R', `M${n} should be on the right`);
}

// ── Key real-world check: PAR's R16 (M89) is fed by GER/PAR (M74) and FRA/SWE
// (M77) — i.e. PAR plays the FRA/SWE winner, not CIV/NOR. (The reported bug.) ──
assert.deepEqual(
  sortNums(b.byId['760503'].feeders.map(f => MN[f])), [74, 77],
  'M89 (PAR) is fed by M74 and M77',
);

// All 16 R32 boxes placed exactly once, 8 per side.
const r32pos = Object.entries(MN).filter(([, n]) => n <= 88)
  .map(([ev]) => `${b.byId[ev].side}${b.byId[ev].rk}`);
assert.equal(new Set(r32pos).size, 16, 'all 16 R32 positions distinct');

console.log('bracket-wiring.test.mjs PASS');
