import assert from 'node:assert';
import { buildPmsrStats } from '../../src/lib/stats-live.ts';

const makePlayer = (name, fifaId, distance, sprints, speed) => ({
  number: '1', name, fifaId,
  total_distance_m: distance,
  zone1_0_7_m: 0, zone2_7_15_m: 0, zone3_15_20_m: 0, zone4_20_25_m: 0, zone5_25plus_m: 0,
  high_speed_runs: 0, sprints, top_speed_kmh: speed,
});

// Two matches for USA — Player A appears in both, B only in match 1, C only in match 2
const pmsrData = [
  {
    eventId: 'e1', source: 's',
    home: { abbr: 'USA', xg: 2.0, totalDistanceKm: 110, physical: [
      makePlayer('Player A', 'F1', 10000, 8, 32.0),
      makePlayer('Player B', 'F2',  9000, 15, 35.0),
    ]},
    away: { abbr: 'MEX', xg: 1.0, totalDistanceKm: 105, physical: [] },
  },
  {
    eventId: 'e2', source: 's',
    home: { abbr: 'USA', xg: 1.5, totalDistanceKm: 108, physical: [
      makePlayer('Player A', 'F1', 11000, 6, 30.0),
      makePlayer('Player C', 'F3', 12000, 3, 28.0),
    ]},
    away: { abbr: 'CAN', xg: 0.5, totalDistanceKm: 100, physical: [] },
  },
];

const matchScores = new Map([
  ['e1', { homeAbbr: 'USA', homeGoals: 2, awayAbbr: 'MEX', awayGoals: 0 }],
  ['e2', { homeAbbr: 'USA', homeGoals: 1, awayAbbr: 'CAN', awayGoals: 1 }],
]);

const { physicalLeaders, xgPerformance } = buildPmsrStats(pmsrData, matchScores);

// Distance is cumulative: A = 10000+11000=21000, C = 12000, B = 9000
assert.equal(physicalLeaders.mostDistance[0].fifaId, 'F1', 'distance leader should be Player A');
assert.equal(physicalLeaders.mostDistance[0].value, 21000, 'A total distance 21000m');
assert.equal(physicalLeaders.mostDistance[1].fifaId, 'F3', 'second is Player C at 12000');

// Sprints cumulative: B=15, A=8+6=14, C=3
assert.equal(physicalLeaders.mostSprints[0].fifaId, 'F2', 'sprint leader is Player B');
assert.equal(physicalLeaders.mostSprints[0].value, 15);
assert.equal(physicalLeaders.mostSprints[1].fifaId, 'F1', 'second is Player A');
assert.equal(physicalLeaders.mostSprints[1].value, 14);

// Top speed is max single reading: B=35.0, A=max(32,30)=32.0, C=28.0
assert.equal(physicalLeaders.topSpeed[0].fifaId, 'F2', 'speed leader is Player B');
assert.equal(physicalLeaders.topSpeed[0].value, 35.0);
assert.equal(physicalLeaders.topSpeed[1].fifaId, 'F1', 'second is Player A at 32');
assert.equal(physicalLeaders.topSpeed[1].value, 32.0);

// Team xG: USA=3.5, MEX=1.0, CAN=0.5 — sorted desc
assert.equal(xgPerformance[0].t, 'USA');
assert.equal(xgPerformance[0].xg, 3.5);
assert.equal(xgPerformance[0].goals, 3); // 2+1
assert.equal(xgPerformance[0].matches, 2);
assert.equal(xgPerformance[1].t, 'MEX');
assert.equal(xgPerformance[1].xg, 1.0);
assert.equal(xgPerformance[1].goals, 0); // MEX scored 0 in e1
assert.equal(xgPerformance[2].t, 'CAN');
assert.equal(xgPerformance[2].xg, 0.5);
assert.equal(xgPerformance[2].goals, 1);

// xgPerformance is sorted descending by xg
assert.ok(xgPerformance[0].xg >= xgPerformance[1].xg, 'sorted desc by xg');

console.log('agg.test.mjs PASS');
