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

// every physical row has the fifaId key, and most resolve to a real id
const rows = [...d.home.physical, ...d.away.physical];
for (const r of rows) assert.ok('fifaId' in r, `missing fifaId key: ${r.name}`);
const resolved = rows.filter(r => r.fifaId);
assert.ok(resolved.length >= 28, `expected >=28 resolved ids, got ${resolved.length}`);

// fifaId must be the FIFA player id (what /player/[athleteId] is keyed on),
// NOT the ESPN summary-roster id. Noor Al-Rawabdeh's FIFA id is 431230.
const noor = rows.find(r => r.name.toUpperCase().includes('RAWABDEH'));
assert.ok(noor, 'expected a row for Al-Rawabdeh');
assert.equal(noor.fifaId, '431230', `Noor fifaId should be 431230, got ${noor.fifaId}`);

console.log('ingest-output.test.mjs PASS');
