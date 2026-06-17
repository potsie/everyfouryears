import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync('data/pmsr/760431.json', 'utf8'));
assert.equal(d.eventId, '760431');
assert.equal(d.home.abbr, 'AUT');
assert.equal(d.away.abbr, 'JOR');
assert.equal(d.home.xg, 1.93);
assert.equal(d.away.xg, 0.53);
assert.equal(d.home.physical.length, 16);
assert.equal(d.away.physical.length, 16);

// every physical row has the athleteId key, and most resolve to a real id
const rows = [...d.home.physical, ...d.away.physical];
for (const r of rows) assert.ok('athleteId' in r, `missing athleteId key: ${r.name}`);
const resolved = rows.filter(r => r.athleteId);
assert.ok(resolved.length >= 28, `expected >=28 resolved ids, got ${resolved.length}`);

console.log('ingest-output.test.mjs PASS');
