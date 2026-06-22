# PMSR Phase 3 — Player Page Physical Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Running & physical" card to each player's page showing their tournament top speed (record), total distance (cumulative), total sprints (cumulative), and a per-match physical breakdown table.

**Architecture:** A pure `buildPlayerPmsr()` function in `pmsr.ts` filters all PMSR records for one player (by `fifaId` + `teamAbbr`) and aggregates tournament totals + per-match rows. The server component `page.tsx` calls `getAllPmsr()` (already in `pmsr.server.ts`), builds a date-map from the already-fetched team matches, calls `buildPlayerPmsr()`, then passes the result as a `pmsr` prop to `PlayerWorldCup`. The `PlayerWorldCup` component renders a second `t-card` below the existing match log card.

**Tech Stack:** Next.js 16 server components, TypeScript, existing `pmsr.ts`/`pmsr.server.ts` patterns, test runner: `node --experimental-strip-types`

## Global Constraints

- Physical only — no per-player xG anywhere on player pages.
- Player is identified by `fifaId` (the route param `athleteId`). Only match PMSR rows where `p.fifaId === fifaId`. Never match by name.
- Aggregation rules (same as Phase 2): **top speed = max single reading**; **distance + sprints = cumulative sum** across matches.
- Per-match rows sorted newest-first (descending by `eventId` string — IDs are sequential so string sort is correct).
- `buildPlayerPmsr` returns `null` when the player has no PMSR data — the UI silently omits the card.
- `pmsr.ts` stays client-safe (no `fs`). All `fs` usage stays in `pmsr.server.ts`.
- No test framework — tests are assertion scripts: `node --experimental-strip-types tests/pmsr/<name>.test.mjs`.
- Do not modify `pmsr.server.ts` — `getAllPmsr()` is already there from Phase 2.

---

## File Map

| File | Change |
|------|--------|
| `src/lib/pmsr.ts` | Add `PmsrMatchRow`, `PlayerPmsrSummary` interfaces; add `buildPlayerPmsr()` |
| `tests/pmsr/player-pmsr.test.mjs` | New test for `buildPlayerPmsr` |
| `src/app/player/[athleteId]/page.tsx` | Import `getAllPmsr`, `buildPlayerPmsr`; add to `Promise.all`; build `matchDates`; pass `pmsr` prop |
| `src/app/player/[athleteId]/PlayerWorldCup.tsx` | Add `pmsr` prop; add `PhysicalRows` + `PlayerPhysical` components; render when non-null |
| `src/app/player/[athleteId]/player.css` | Add `.wc-log.phys` grid rule |

---

## Task 1: `buildPlayerPmsr()` — pure function, types, and test

**Files:**
- Modify: `src/lib/pmsr.ts`
- Create: `tests/pmsr/player-pmsr.test.mjs`

**Interfaces:**
- Consumes: existing `PmsrData`, `PmsrPlayerPhysical` types from `pmsr.ts`
- Produces:
  - `PmsrMatchRow` interface (exported)
  - `PlayerPmsrSummary` interface (exported)
  - `buildPlayerPmsr(allPmsr: PmsrData[], fifaId: string, teamAbbr: string, matchDates?: Map<string, string>): PlayerPmsrSummary | null` (exported)

- [ ] **Step 1: Write the failing test at `tests/pmsr/player-pmsr.test.mjs`**

```javascript
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
```

- [ ] **Step 2: Run test — expect failure**

```bash
node --experimental-strip-types tests/pmsr/player-pmsr.test.mjs
```

Expected: error such as `SyntaxError` or `TypeError: buildPlayerPmsr is not a function` (function not yet defined).

- [ ] **Step 3: Add types and `buildPlayerPmsr()` to `src/lib/pmsr.ts`**

Add these interfaces after the existing `PmsrLeaders` interface (around line 50):

```typescript
export interface PmsrMatchRow {
  eventId: string;
  oppAbbr: string;
  date: string;              // ISO string from matchDates, or '' if unknown
  total_distance_m: number;
  sprints: number;
  top_speed_kmh: number;
}

export interface PlayerPmsrSummary {
  matches: PmsrMatchRow[]; // sorted newest-first (eventId descending)
  totals: {
    totalDistanceM: number; // cumulative sum
    sprints: number;        // cumulative sum
    topSpeedKmh: number;    // max single reading
    matchCount: number;
  };
}
```

Add this function at the end of `src/lib/pmsr.ts`:

```typescript
// Build a player's PMSR summary from all available match reports.
// Returns null when the player (by fifaId) has no PMSR data.
export function buildPlayerPmsr(
  allPmsr: PmsrData[],
  fifaId: string,
  teamAbbr: string,
  matchDates?: Map<string, string>,
): PlayerPmsrSummary | null {
  const rows: PmsrMatchRow[] = [];

  for (const pmsr of allPmsr) {
    const isHome = pmsr.home.abbr === teamAbbr;
    const isAway = pmsr.away.abbr === teamAbbr;
    if (!isHome && !isAway) continue;

    const team = isHome ? pmsr.home : pmsr.away;
    const opp = isHome ? pmsr.away : pmsr.home;
    const entry = team.physical.find(p => p.fifaId === fifaId);
    if (!entry) continue;

    rows.push({
      eventId: pmsr.eventId,
      oppAbbr: opp.abbr ?? '',
      date: matchDates?.get(pmsr.eventId) ?? '',
      total_distance_m: entry.total_distance_m,
      sprints: entry.sprints,
      top_speed_kmh: entry.top_speed_kmh,
    });
  }

  if (rows.length === 0) return null;

  rows.sort((a, b) => b.eventId.localeCompare(a.eventId));

  return {
    matches: rows,
    totals: {
      totalDistanceM: rows.reduce((s, r) => s + r.total_distance_m, 0),
      sprints: rows.reduce((s, r) => s + r.sprints, 0),
      topSpeedKmh: Math.max(...rows.map(r => r.top_speed_kmh)),
      matchCount: rows.length,
    },
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
node --experimental-strip-types tests/pmsr/player-pmsr.test.mjs
```

Expected output: `player-pmsr.test.mjs PASS`

- [ ] **Step 5: Run all existing PMSR tests to confirm no regressions**

```bash
node --experimental-strip-types tests/pmsr/names.test.mjs
node --experimental-strip-types tests/pmsr/leaders.test.mjs
node --experimental-strip-types tests/pmsr/agg.test.mjs
node --experimental-strip-types tests/pmsr/ingest-output.test.mjs
```

Expected: all four print `PASS`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pmsr.ts tests/pmsr/player-pmsr.test.mjs
git commit -m "Add buildPlayerPmsr() and player PMSR types for Phase 3"
```

---

## Task 2: Page wiring + UI

Wire `buildPlayerPmsr` into the player page server component and render the physical card in `PlayerWorldCup`.

**Files:**
- Modify: `src/app/player/[athleteId]/page.tsx`
- Modify: `src/app/player/[athleteId]/PlayerWorldCup.tsx`
- Modify: `src/app/player/[athleteId]/player.css`

**Interfaces:**
- Consumes:
  - `getAllPmsr(): Promise<PmsrData[]>` from `@/lib/pmsr.server`
  - `buildPlayerPmsr(allPmsr, fifaId, teamAbbr, matchDates?)` from `@/lib/pmsr`
  - `PmsrMatchRow`, `PlayerPmsrSummary` from `@/lib/pmsr`
  - `m.date: string` on each item in `teamMatches` (type `WorldCupMatchNormalized`)

- [ ] **Step 1: Add imports and wire PMSR data in `src/app/player/[athleteId]/page.tsx`**

Add two new imports near the top of the file (after the existing imports):

```typescript
import { getAllPmsr } from '@/lib/pmsr.server';
import { buildPlayerPmsr } from '@/lib/pmsr';
```

Find the existing `Promise.all` at lines 35–38:

```typescript
const [allSquads, { matches, teamDict }] = await Promise.all([
  fetchFifaSquads(),
  fetchAllMatches(),
]);
```

Replace it with:

```typescript
const [allSquads, { matches, teamDict }, allPmsr] = await Promise.all([
  fetchFifaSquads(),
  fetchAllMatches(),
  getAllPmsr(),
]);
```

After the existing `teamMatches` definition (which filters `matches` to completed team matches), add:

```typescript
const matchDates = new Map(teamMatches.map(m => [m.eventId, m.date]));
const pmsr = buildPlayerPmsr(allPmsr, athleteId, teamCountryCode, matchDates);
```

Find the `<PlayerWorldCup log={wcLog} />` JSX in the return and replace with:

```tsx
<PlayerWorldCup log={wcLog} pmsr={pmsr} />
```

- [ ] **Step 2: Add `PlayerPhysical` component and update props in `src/app/player/[athleteId]/PlayerWorldCup.tsx`**

Add two new imports at the top of the file (the existing imports are `Link`, `Flag`, and type imports from `@/lib/stats-live`):

```typescript
import type { PmsrMatchRow, PlayerPmsrSummary } from '@/lib/pmsr';
```

Add the following two components after the existing `KeeperRows` function (around line 108) and before `PlayerWorldCup`:

```tsx
function PhysicalRows({ rows }: { rows: PmsrMatchRow[] }) {
  return (
    <>
      <div className="wc-log-row head">
        <span>Date</span>
        <span>Opp</span>
        <span style={{ textAlign: 'center' }}>Dist</span>
        <span style={{ textAlign: 'center' }}>Sprints</span>
        <span style={{ textAlign: 'center' }}>Speed</span>
      </div>
      {rows.map(r => (
        <Link className="wc-log-row" key={r.eventId} href={`/match/${r.eventId}`}>
          <span className="wc-date">{r.date ? fmtDate(r.date) : '—'}</span>
          <span className="wc-opp">
            <Flag
              logo={`https://a.espncdn.com/i/teamlogos/countries/500/${r.oppAbbr.toLowerCase()}.png`}
              abbr={r.oppAbbr}
              size={15}
            />
            {r.oppAbbr}
          </span>
          <span className="tnum" style={{ textAlign: 'center' }}>
            {(r.total_distance_m / 1000).toFixed(1)}
            <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 2 }}>km</span>
          </span>
          <span className="tnum" style={{ textAlign: 'center' }}>{r.sprints}</span>
          <span className="tnum" style={{ textAlign: 'center' }}>
            {r.top_speed_kmh.toFixed(1)}
            <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 2 }}>km/h</span>
          </span>
        </Link>
      ))}
    </>
  );
}

function PlayerPhysical({ pmsr }: { pmsr: PlayerPmsrSummary }) {
  const { totals, matches } = pmsr;
  return (
    <div className="t-card" style={{ marginTop: 18 }}>
      <div className="t-card-head"><h3>Running &amp; physical</h3></div>
      <div className="wc-tot">
        <div className="wc-tot-cell">
          <div className="v tnum">{totals.topSpeedKmh.toFixed(1)}</div>
          <div className="k">Top speed</div>
          <div className="s">km/h · best</div>
        </div>
        <div className="wc-tot-cell">
          <div className="v tnum">{(totals.totalDistanceM / 1000).toFixed(1)}</div>
          <div className="k">Distance</div>
          <div className="s">km · total</div>
        </div>
        <div className="wc-tot-cell">
          <div className="v tnum">{totals.sprints}</div>
          <div className="k">Sprints</div>
          <div className="s">total</div>
        </div>
      </div>
      {matches.length > 1 && (
        <div className="wc-log-scroll">
          <div className="wc-log phys">
            <PhysicalRows rows={matches} />
          </div>
        </div>
      )}
    </div>
  );
}
```

Update the `PlayerWorldCup` export signature to accept the new `pmsr` prop and render `PlayerPhysical` when data is present. Replace the existing function:

```tsx
export function PlayerWorldCup({ log, pmsr }: { log: PlayerWorldCupLog; pmsr?: PlayerPmsrSummary | null }) {
  return (
    <>
      <div className="t-card">
        <div className="t-card-head"><h3>At the 2026 World Cup</h3></div>
        {log.rows.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Hasn&apos;t featured yet — stats update after each match.
          </div>
        ) : (
          <>
            <Totals log={log} />
            <div className="wc-log-scroll">
              <div className={`wc-log${log.isGK ? ' gk' : ''}`}>
                {log.isGK ? <KeeperRows rows={log.rows} /> : <OutfieldRows rows={log.rows} />}
              </div>
            </div>
          </>
        )}
      </div>
      {pmsr && <PlayerPhysical pmsr={pmsr} />}
    </>
  );
}
```

- [ ] **Step 3: Add `.wc-log.phys` grid rule to `src/app/player/[athleteId]/player.css`**

After the existing `.wc-log.gk { min-width: 440px; }` line (line 56), add:

```css
.wc-log.phys { min-width: 360px; }
.wc-log.phys .wc-log-row { grid-template-columns: 58px 90px 70px 60px 80px; }
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any errors before committing.

- [ ] **Step 5: Run all PMSR tests once more**

```bash
node --experimental-strip-types tests/pmsr/player-pmsr.test.mjs
node --experimental-strip-types tests/pmsr/agg.test.mjs
node --experimental-strip-types tests/pmsr/names.test.mjs
node --experimental-strip-types tests/pmsr/leaders.test.mjs
```

Expected: all print `PASS`.

- [ ] **Step 6: Commit**

```bash
git add src/app/player/\[athleteId\]/page.tsx src/app/player/\[athleteId\]/PlayerWorldCup.tsx src/app/player/\[athleteId\]/player.css
git commit -m "Add Running & physical card to player pages (Phase 3)"
```
