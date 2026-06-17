import assert from 'node:assert';
import { normalizePmsrName, resolveFifaId } from '../../src/lib/pmsr.ts';

// normalization collapses case, spaces, punctuation, and diacritics
assert.equal(normalizePmsrName('Yazan Al-Arab'), 'YAZANALARAB');
assert.equal(normalizePmsrName('YAZAN ALARAB'), 'YAZANALARAB');
assert.equal(normalizePmsrName('Marko Arnautović'), 'MARKOARNAUTOVIC');

const roster = [
  { id: '111', name: 'Yazan Al-Arab' },
  { id: '222', name: 'Marko Arnautović' },
];
// FIFA all-caps name resolves to the FIFA player id
assert.equal(resolveFifaId('YAZAN ALARAB', roster), '111');
assert.equal(resolveFifaId('MARKO ARNAUTOVIC', roster), '222');
// unknown name returns null, never a wrong id
assert.equal(resolveFifaId('SOME UNKNOWN', roster), null);

console.log('names.test.mjs PASS');
