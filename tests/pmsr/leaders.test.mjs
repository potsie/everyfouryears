import assert from 'node:assert';
import { physicalLeaders } from '../../src/lib/pmsr.ts';

const data = {
  eventId: 't', source: 's',
  home: { abbr: 'AAA', xg: 1, totalDistanceKm: 100, physical: [
    { number: '1', name: 'Fast Guy', athleteId: 'A1', total_distance_m: 9000,
      zone1_0_7_m: 0, zone2_7_15_m: 0, zone3_15_20_m: 0, zone4_20_25_m: 0,
      zone5_25plus_m: 0, high_speed_runs: 0, sprints: 10, top_speed_kmh: 35.0 },
  ]},
  away: { abbr: 'BBB', xg: 0, totalDistanceKm: 90, physical: [
    { number: '2', name: 'Runner', athleteId: 'B2', total_distance_m: 12000,
      zone1_0_7_m: 0, zone2_7_15_m: 0, zone3_15_20_m: 0, zone4_20_25_m: 0,
      zone5_25plus_m: 0, high_speed_runs: 0, sprints: 40, top_speed_kmh: 30.0 },
  ]},
};

const l = physicalLeaders(data);
assert.equal(l.topSpeed.athleteId, 'A1');   // leaders now carry the athlete id
assert.equal(l.topSpeed.value, 35.0);
assert.equal(l.mostDistance.athleteId, 'B2');
assert.equal(l.mostSprints.athleteId, 'B2');

console.log('leaders.test.mjs PASS');
