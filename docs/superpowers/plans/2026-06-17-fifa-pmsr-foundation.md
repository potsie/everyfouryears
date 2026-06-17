# FIFA PMSR Foundation (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ingestion + join foundation for FIFA Post-Match Summary Report (PMSR) data and generalize the match-detail xG/physical prototype to every completed match, with physical leaders linked to player pages.

**Architecture:** A run-on-demand Node orchestrator scrapes the FIFA match-report hub, downloads each new PDF, parses it with the existing `scripts/parse_pmsr.py` (pdftotext), resolves the ESPN event ID (by team-abbr pair) and ESPN athlete IDs (by normalized name match within the match roster), and writes self-contained `data/pmsr/<eventId>.json`. Pages read the committed JSON; nothing runs at request or build time.

**Tech Stack:** Next.js 16 / React 19 / TypeScript; Node 22 (`--experimental-strip-types` to import TS from scripts); Python 3 + `pdftotext` (poppler) for parsing.

## Global Constraints

- **xG is team-level only.** No per-player xG anywhere. (Verified: one xG figure per team; shot log has no per-shot xG.)
- **`src/lib/pmsr.ts` stays client-safe** — types + pure helpers only, no `fs`. The filesystem loader lives in `src/lib/pmsr.server.ts`.
- **Parser uses `pdftotext`, not PyMuPDF** (only an x86_64 PyMuPDF wheel is available; it fails on this arm64 Python).
- **Committed JSON is keyed by ESPN event ID** (`data/pmsr/<eventId>.json`) and is fully resolved at ingest (event ID + athlete IDs baked in).
- **No test framework.** Follow the existing convention: `node --experimental-strip-types <file>.test.mjs` assertion scripts that exit non-zero on failure.
- **ESPN codes == FIFA codes** (AUT, JOR, …); home team is listed first in the PMSR filename.

---

## File Structure

- `src/lib/pmsr.ts` (modify) — add `athleteId` to physical + leader types; add `normalizePmsrName` and `resolveAthleteId` pure helpers; carry `athleteId` through `physicalLeaders`.
- `scripts/pmsr_ingest.mjs` (create) — orchestrator (scrape → download → parse → join → write).
- `scripts/parse_pmsr.py` (unchanged) — existing PDF→JSON parser.
- `data/pmsr/name-overrides.json` (create) — manual `normalizedName → athleteId` overrides.
- `data/pmsr/760431.json` (regenerate) — now includes `athleteId` per physical row.
- `src/app/match/[eventId]/MatchClient.tsx` (modify) — link physical leaders to player pages.
- `tests/pmsr/*.test.mjs` (create) — node assertion scripts.
- `package.json` (modify) — add `"pmsr"` script.

---

### Task 1: Name-resolution helpers + `athleteId` on physical type

**Files:**
- Modify: `src/lib/pmsr.ts`
- Test: `tests/pmsr/names.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `normalizePmsrName(name: string): string`
  - `resolveAthleteId(fifaName: string, roster: { id: string; name: string }[]): string | null`
  - `PmsrPlayerPhysical.athleteId: string | null` (new field)

- [ ] **Step 1: Write the failing test**

Create `tests/pmsr/names.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tests/pmsr/names.test.mjs`
Expected: FAIL — `normalizePmsrName is not a function` (export missing).

- [ ] **Step 3: Add the field and helpers**

In `src/lib/pmsr.ts`, add `athleteId` to the physical interface:

```typescript
export interface PmsrPlayerPhysical {
  number: string;
  name: string;
  athleteId: string | null;
  total_distance_m: number;
  zone1_0_7_m: number;
  zone2_7_15_m: number;
  zone3_15_20_m: number;
  zone4_20_25_m: number;
  zone5_25plus_m: number;
  high_speed_runs: number;
  sprints: number;
  top_speed_kmh: number;
}
```

Append the helpers at the end of the file:

```typescript
// Normalize a player name for cross-source matching: strip diacritics, uppercase,
// drop everything that isn't a letter or digit. "Yazan Al-Arab" and "YAZAN ALARAB"
// both collapse to "YAZANALARAB".
export function normalizePmsrName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // strip combining diacritical marks (accents)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

// Resolve a FIFA physical-row name to an ESPN athlete id within one team's roster.
// Returns the id on a normalized match, else null (never a wrong id).
export function resolveAthleteId(
  fifaName: string,
  roster: { id: string; name: string }[],
): string | null {
  const target = normalizePmsrName(fifaName);
  const hit = roster.find(r => normalizePmsrName(r.name) === target);
  return hit?.id ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tests/pmsr/names.test.mjs`
Expected: `names.test.mjs PASS`

- [ ] **Step 5: Commit**

```bash
git add src/lib/pmsr.ts tests/pmsr/names.test.mjs
git commit -m "Add PMSR name-resolution helpers and athleteId field"
```

---

### Task 2: Carry `athleteId` through `physicalLeaders`

**Files:**
- Modify: `src/lib/pmsr.ts`
- Test: `tests/pmsr/leaders.test.mjs`

**Interfaces:**
- Consumes: `PmsrData`, `PmsrPlayerPhysical.athleteId` (Task 1).
- Produces: `PmsrLeader.athleteId: string | null` (new field), still returned by `physicalLeaders(data: PmsrData): PmsrLeaders`.

- [ ] **Step 1: Write the failing test**

Create `tests/pmsr/leaders.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tests/pmsr/leaders.test.mjs`
Expected: FAIL — `l.topSpeed.athleteId` is `undefined`.

- [ ] **Step 3: Add `athleteId` to the leader type and populate it**

In `src/lib/pmsr.ts`, change the `PmsrLeader` interface:

```typescript
export interface PmsrLeader {
  name: string;
  abbr: string | null;
  athleteId: string | null;
  value: number;
}
```

Update `physicalLeaders` so `best` carries `athleteId`:

```typescript
  const best = (pick: (p: PmsrPlayerPhysical) => number): PmsrLeader =>
    tagged
      .map(({ p, abbr }) => ({ name: p.name, abbr, athleteId: p.athleteId, value: pick(p) }))
      .reduce((a, b) => (b.value > a.value ? b : a));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tests/pmsr/leaders.test.mjs`
Expected: `leaders.test.mjs PASS`

- [ ] **Step 5: Verify the existing typecheck still passes**

Run: `npx tsc --noEmit`
Expected: `No errors found` (the prototype `data/pmsr/760431.json` still lacks `athleteId`, but it is loaded as `PmsrData` via `JSON.parse` cast — no compile error; it is regenerated in Task 3).

- [ ] **Step 6: Commit**

```bash
git add src/lib/pmsr.ts tests/pmsr/leaders.test.mjs
git commit -m "Carry athleteId through physicalLeaders"
```

---

### Task 3: Ingestion orchestrator + npm script + regenerate JSON

**Files:**
- Create: `scripts/pmsr_ingest.mjs`
- Create: `data/pmsr/name-overrides.json`
- Modify: `package.json`
- Regenerate: `data/pmsr/760431.json`
- Test: `tests/pmsr/ingest-output.test.mjs`

**Interfaces:**
- Consumes: `normalizePmsrName`, `resolveAthleteId` (Task 1) imported from `../src/lib/pmsr.ts`; `scripts/parse_pmsr.py` CLI (`python3 scripts/parse_pmsr.py <pdf> <eventId> <out.json>`).
- Produces: `data/pmsr/<eventId>.json` files conforming to `PmsrData` with `athleteId` populated per physical row.

- [ ] **Step 1: Write the failing test (asserts on regenerated output)**

Create `tests/pmsr/ingest-output.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tests/pmsr/ingest-output.test.mjs`
Expected: FAIL — current `data/pmsr/760431.json` rows have no `athleteId` key (`missing athleteId key` assertion).

- [ ] **Step 3: Create the name-overrides file**

Create `data/pmsr/name-overrides.json`:

```json
{}
```

- [ ] **Step 4: Write the orchestrator**

Create `scripts/pmsr_ingest.mjs`:

```javascript
// FIFA PMSR ingestion orchestrator. Scrapes the match-report hub, downloads each
// new report, parses it (scripts/parse_pmsr.py), resolves the ESPN event id and
// athlete ids, and writes data/pmsr/<eventId>.json. Run: npm run pmsr
//
// Run with: node --experimental-strip-types scripts/pmsr_ingest.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizePmsrName, resolveAthleteId } from '../src/lib/pmsr.ts';

const HUB = 'https://www.fifatrainingcentre.com/en/fifa-world-cup-2026/match-report-hub.php';
const HOST = 'https://www.fifatrainingcentre.com';
const SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260720&limit=200';
const SUMMARY = id =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${id}`;
const DATA_DIR = 'data/pmsr';
const OVERRIDES = JSON.parse(readFileSync(`${DATA_DIR}/name-overrides.json`, 'utf8'));
const UA = { headers: { 'User-Agent': 'Mozilla/5.0' } };

async function getText(url) {
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}
async function getJson(url) {
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// Discover available report PDFs from the hub. Filenames are PMSR-M<n>-<HOME>-V-<AWAY>.pdf.
async function discoverPdfs() {
  const html = await getText(HUB);
  const re = /\/media\/native\/[^"')]*PMSR-M\d+-([A-Z]{3})-V-([A-Z]{3})\.pdf/g;
  const out = new Map(); // url -> { home, away }
  for (const m of html.matchAll(re)) out.set(HOST + m[0], { home: m[1], away: m[2] });
  return [...out].map(([url, teams]) => ({ url, ...teams }));
}

// Build "<HOME>|<AWAY>" -> espn event id from the scoreboard.
async function eventIndex() {
  const sb = await getJson(SCOREBOARD);
  const idx = new Map();
  for (const e of sb.events ?? []) {
    const comp = e.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.abbreviation;
    const away = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.abbreviation;
    if (home && away) idx.set(`${home}|${away}`, e.id);
  }
  return idx;
}

// abbr -> [{ id, name }] roster, from the summary endpoint's rosters block.
async function rostersByAbbr(eventId) {
  const sum = await getJson(SUMMARY(eventId));
  const comp = sum.header?.competitions?.[0];
  const teamIdToAbbr = new Map();
  for (const c of comp?.competitors ?? []) teamIdToAbbr.set(c.team?.id, c.team?.abbreviation);
  const out = {};
  for (const tr of sum.rosters ?? []) {
    const abbr = teamIdToAbbr.get(tr.team?.id);
    if (!abbr) continue;
    out[abbr] = (tr.roster ?? []).map(p => ({ id: p.athlete?.id, name: p.athlete?.displayName }));
  }
  return out;
}

function resolveTeam(team, roster) {
  let resolved = 0, missed = [];
  for (const p of team.physical) {
    let id = roster ? resolveAthleteId(p.name, roster) : null;
    if (!id) id = OVERRIDES[normalizePmsrName(p.name)] ?? null;
    p.athleteId = id;
    if (id) resolved++; else missed.push(p.name);
  }
  return { resolved, missed };
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  const [pdfs, idx] = await Promise.all([discoverPdfs(), eventIndex()]);
  console.log(`hub: ${pdfs.length} report(s) available`);

  for (const { url, home, away } of pdfs) {
    const eventId = idx.get(`${home}|${away}`);
    if (!eventId) { console.warn(`! no ESPN event for ${home} v ${away} — skipping`); continue; }
    const outFile = join(DATA_DIR, `${eventId}.json`);
    if (existsSync(outFile)) { console.log(`= ${home} v ${away} (${eventId}) already ingested`); continue; }

    const base = join(tmpdir(), `PMSR-${home}-V-${away}`);
    const pdfPath = `${base}.pdf`, rawPath = `${base}.json`;
    const buf = Buffer.from(await (await fetch(url, UA)).arrayBuffer());
    writeFileSync(pdfPath, buf);
    execFileSync('python3', ['scripts/parse_pmsr.py', pdfPath, eventId, rawPath], { stdio: 'inherit' });
    const data = JSON.parse(readFileSync(rawPath, 'utf8'));

    const rosters = await rostersByAbbr(eventId);
    const h = resolveTeam(data.home, rosters[data.home.abbr]);
    const a = resolveTeam(data.away, rosters[data.away.abbr]);
    writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(`+ ${home} v ${away} (${eventId}) — resolved ${h.resolved + a.resolved} ids`);
    const missed = [...h.missed, ...a.missed];
    if (missed.length) console.warn(`  unresolved: ${missed.join(', ')}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 5: Add the npm script**

In `package.json`, add to `"scripts"`:

```json
    "pmsr": "node --experimental-strip-types scripts/pmsr_ingest.mjs",
```

- [ ] **Step 6: Regenerate the committed JSON**

The existing `data/pmsr/760431.json` blocks re-ingest. Remove it, then run the ingester:

```bash
rm data/pmsr/760431.json
npm run pmsr
```

Expected: log lines including `+ AUT v JOR (760431) — resolved <N> ids` (N ≥ 28). Other matches that have reports will also be written.

- [ ] **Step 7: Run test to verify it passes**

Run: `node --experimental-strip-types tests/pmsr/ingest-output.test.mjs`
Expected: `ingest-output.test.mjs PASS`

- [ ] **Step 8: Inspect unresolved names and add overrides if needed**

If Step 6 logged any `unresolved:` names for event 760431, add each to `data/pmsr/name-overrides.json` as `"<normalized name>": "<espn athlete id>"` (look up the id in the summary roster), then re-run `rm data/pmsr/760431.json && npm run pmsr`. Repeat until the unresolved list for 760431 is empty or only genuinely-absent players remain.

- [ ] **Step 9: Commit**

```bash
git add scripts/pmsr_ingest.mjs package.json data/pmsr/ tests/pmsr/ingest-output.test.mjs
git commit -m "Add PMSR ingestion orchestrator and regenerate match data with athlete ids"
```

---

### Task 4: Link match-detail physical leaders to player pages

**Files:**
- Modify: `src/app/match/[eventId]/MatchClient.tsx`

**Interfaces:**
- Consumes: `PmsrLeader.athleteId` (Task 2); `Link` from `next/link` (already imported at the top of the file).
- Produces: no new exports.

- [ ] **Step 1: Update the leader name to render a link when an id exists**

In `src/app/match/[eventId]/MatchClient.tsx`, inside `PhysicalCard`, replace the leader-name line:

```tsx
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
              {leader.name}{leader.abbr ? <span style={{ color: 'var(--ink-3)' }}> · {leader.abbr}</span> : null}
            </div>
```

with:

```tsx
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
              {leader.athleteId
                ? <Link href={`/player/${leader.athleteId}`} style={{ color: 'var(--ink-2)' }}>{leader.name}</Link>
                : leader.name}
              {leader.abbr ? <span style={{ color: 'var(--ink-3)' }}> · {leader.abbr}</span> : null}
            </div>
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: `No errors found`

- [ ] **Step 3: Smoke-check the rendered route**

With the dev server running (`npm run dev`), fetch the match page and confirm a player link is present in the route bundle for a resolved leader:

Run:
```bash
curl -s "http://localhost:3000/match/760431" -o /tmp/pmsr-page.html -w "HTTP %{http_code}\n"
node -e "const id=require('fs').readFileSync('data/pmsr/760431.json','utf8'); const d=JSON.parse(id); const top=[...d.home.physical,...d.away.physical].sort((a,b)=>b.top_speed_kmh-a.top_speed_kmh)[0]; console.log('top-speed leader athleteId:', top.athleteId)"
```
Expected: HTTP 200, and the printed `athleteId` is non-null. Open `/match/760431` → Stats tab in a browser and confirm the leader name is a clickable link to `/player/<id>`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/match/[eventId]/MatchClient.tsx"
git commit -m "Link match physical leaders to player pages"
```

---

## Self-Review

**Spec coverage (Phase 1 scope):**
- Ingestion pipeline (discover/fetch/parse/join/write) → Task 3 ✓
- Match → event ID join (abbr pair) → Task 3 `eventIndex` ✓
- Name → athlete ID join + override map → Tasks 1 & 3 ✓
- `athleteId` baked into committed JSON → Task 3 ✓
- Match-detail generalized + leaders link to players → Tasks 3 (data) & 4 (links) ✓
- Phases 2–4 (`/stats`, player pages, match cards) and `getAllPmsr()` → intentionally **out of scope**; each gets its own plan after this lands. ✓

**Placeholder scan:** none — every code step shows full code; no TBD/TODO. ✓

**Type consistency:** `athleteId: string | null` added to `PmsrPlayerPhysical` (Task 1) and `PmsrLeader` (Task 2); orchestrator sets `p.athleteId` (Task 3); `PhysicalCard` reads `leader.athleteId` (Task 4). `resolveAthleteId`/`normalizePmsrName` signatures match between definition (Task 1) and use (Task 3). ✓
