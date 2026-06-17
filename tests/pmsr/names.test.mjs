import assert from 'node:assert';
import { normalizePmsrName, resolveAthleteId } from '../../src/lib/pmsr.ts';

// normalization collapses case, spaces, punctuation, and diacritics
assert.equal(normalizePmsrName('Yazan Al-Arab'), 'YAZANALARAB');
assert.equal(normalizePmsrName('YAZAN ALARAB'), 'YAZANALARAB');
assert.equal(normalizePmsrName('Marko Arnautović'), 'MARKOARNAUTOVIC');

const roster = [
  { id: '111', name: 'Yazan Al-Arab' },
  { id: '222', name: 'Marko Arnautović' },
];
// FIFA all-caps name resolves to the ESPN athlete id
assert.equal(resolveAthleteId('YAZAN ALARAB', roster), '111');
assert.equal(resolveAthleteId('MARKO ARNAUTOVIC', roster), '222');
// unknown name returns null, never a wrong id
assert.equal(resolveAthleteId('SOME UNKNOWN', roster), null);

console.log('names.test.mjs PASS');
