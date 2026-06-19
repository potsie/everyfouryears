import assert from 'node:assert';
import { buildPlayerPmsr } from '../../src/lib/pmsr.ts';

const makePlayer = (name, fifaId, distance, sprints, speed) => ({
  number: '10', name, fifaId,
  total_distance_m: distance,
  zone1_0_7_m: 0, zone2_7_15_m: 0, zone3_15_20_m: 0,
  zone4_20_25_m: 0, zone5_25plus_m: 0,
  high_speed_runs: 5, sprints, top_speed_kmh: speed,
});

const allPmsr = [
  // e1: USA (home) vs MEX — player appears as home player
  {
    eventId: 'e1', source: 's',
    home: { abbr: 'USA', xg: 1.5, totalDistanceKm: 110, physical: [makePlayer('Matt FREESE', 'F1', 11000, 8, 32.0)] },
    away: { abbr: 'MEX', xg: 0.5, totalDistanceKm: 105, physical: [] },
  },
  // e2: BRA (home) vs USA — player appears as away player
  {
    eventId: 'e2', source: 's',
    home: { abbr: 'BRA', xg: 2.0, totalDistanceKm: 112, physical: [] },
    away: { abbr: 'USA', xg: 0.8, totalDistanceKm: 108, physical: [makePlayer('Matt FREESE', 'F1', 10000, 6, 34.0)] },
  },
  // e3: FRA vs GER — no USA, player should not appear
  {
    eventId: 'e3', source: 's',
    home: { abbr: 'FRA', xg: 1.0, totalDistanceKm: 109, physical: [] },
    away: { abbr: 'GER', xg: 0.5, totalDistanceKm: 107, physical: [] },
  },
];

const matchDates = new Map([
  ['e1', '2026-06-12T01:00Z'],
  ['e2', '2026-06-17T18:00Z'],
]);

const result = buildPlayerPmsr(allPmsr, 'F1', 'USA', matchDates);

// Should find 2 matches
assert.ok(result !== null, 'result should not be null');
assert.equal(result.matches.length, 2, 'should have 2 match rows');

// Sorted newest-first by eventId descending
assert.equal(result.matches[0].eventId, 'e2', 'newest match first');
assert.equal(result.matches[0].oppAbbr, 'BRA', 'opp is the other team');
assert.equal(result.matches[0].date, '2026-06-17T18:00Z', 'date from matchDates');
assert.equal(result.matches[0].total_distance_m, 10000);
assert.equal(result.matches[0].sprints, 6);
assert.equal(result.matches[0].top_speed_kmh, 34.0);

assert.equal(result.matches[1].eventId, 'e1');
assert.equal(result.matches[1].oppAbbr, 'MEX');
assert.equal(result.matches[1].date, '2026-06-12T01:00Z');

// Totals: distance and sprints are cumulative; top speed is max
assert.equal(result.totals.totalDistanceM, 21000, 'distance cumulative: 11000+10000');
assert.equal(result.totals.sprints, 14, 'sprints cumulative: 8+6');
assert.equal(result.totals.topSpeedKmh, 34.0, 'top speed is max single reading');
assert.equal(result.totals.matchCount, 2);

// matchDates is optional — omitting it returns empty date strings, still works
const resultNoDates = buildPlayerPmsr(allPmsr, 'F1', 'USA');
assert.ok(resultNoDates !== null);
assert.equal(resultNoDates.matches[0].date, '', 'empty date when matchDates omitted');

// Unknown fifaId returns null
assert.equal(buildPlayerPmsr(allPmsr, 'UNKNOWN', 'USA', matchDates), null);

console.log('player-pmsr.test.mjs PASS');
