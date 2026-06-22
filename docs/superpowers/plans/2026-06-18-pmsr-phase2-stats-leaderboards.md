# PMSR Phase 2 — /stats Leaderboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface FIFA PMSR physical/xG data on the /stats page as a "Running & physical" section with per-player leaders (top speed, distance, sprints) and a team xG-vs-goals table.

**Architecture:** Add `getAllPmsr()` to the existing server loader, add a pure `buildPmsrStats()` aggregator alongside the existing `buildTournamentStats()`, extend the `/api/stats` route to merge the PMSR block into the JSON response, then add two UI panels to `StatsClient.tsx` that consume the new fields. No new routes, no new pages — all changes are additive to existing files.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, existing `pmsr.server.ts` + `stats-live.ts` patterns, test runner: `node --experimental-strip-types`

## Global Constraints

- `pmsr.ts` stays client-safe (no `fs` imports). All `fs` usage stays in `pmsr.server.ts`.
- xG is TEAM-level only. No per-player xG anywhere.
- Physical aggregation rules: **top speed = max single reading** across matches; **distance + sprints = cumulative sum** across matches.
- Player links use `fifaId` (the `/player/[athleteId]` route key). When `fifaId` is null, render a non-linking row (same pattern as existing `RowLink`).
- No test framework — tests are assertion scripts run with `node --experimental-strip-types tests/pmsr/<name>.test.mjs`.
- PMSR `abbr` values (e.g. `"USA"`, `"MEX"`) are the same codes ESPN uses — safe to join directly with match score data.
- The new `physicalLeaders` and `xgPerformance` fields on `TournamentStats` must always be present (never missing from the API response) so the client can safely destructure them without optional checks.

---

## File Map

| File | Change |
|------|--------|
| `src/lib/pmsr.server.ts` | Add `getAllPmsr(): Promise<PmsrData[]>` |
| `src/lib/stats-live.ts` | Add `PhysicalLeaderEntry`, `XgTeamEntry` interfaces; extend `TournamentStats`; add `buildPmsrStats()` |
| `src/app/api/stats/route.ts` | Call `getAllPmsr()` + `buildPmsrStats()`, merge into response |
| `src/app/stats/StatsClient.tsx` | Add `PhysicalPanel` + `XgTeamCard` components; wire into Leaderboard + Spotlight views |
| `tests/pmsr/agg.test.mjs` | Test `buildPmsrStats` aggregation rules |

---

## Task 1: Server aggregation layer

Add `getAllPmsr()` and the pure `buildPmsrStats()` function. No UI changes yet — this task ends when the test passes.

**Files:**
- Modify: `src/lib/pmsr.server.ts`
- Modify: `src/lib/stats-live.ts`
- Create: `tests/pmsr/agg.test.mjs`

**Interfaces:**
- Produces:
  - `getAllPmsr(): Promise<PmsrData[]>` in `pmsr.server.ts`
  - `PhysicalLeaderEntry`, `XgTeamEntry` interfaces exported from `stats-live.ts`
  - `buildPmsrStats(pmsrData: PmsrData[], matchScores: Map<string, MatchScore>): PmsrStats` exported from `stats-live.ts`
  - Extended `TournamentStats` with `physicalLeaders` and `xgPerformance` fields

- [ ] **Step 1: Add `getAllPmsr()` to `src/lib/pmsr.server.ts`**

Replace the entire file with:

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import type { PmsrData } from './pmsr';

export async function getPmsr(eventId: string): Promise<PmsrData | null> {
  try {
    const file = path.join(process.cwd(), 'data', 'pmsr', `${eventId}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8')) as PmsrData;
  } catch {
    return null;
  }
}

export async function getAllPmsr(): Promise<PmsrData[]> {
  try {
    const dir = path.join(process.cwd(), 'data', 'pmsr');
    const files = await fs.readdir(dir);
    const results = await Promise.all(
      files
        .filter(f => f.endsWith('.json') && f !== 'name-overrides.json')
        .map(async f => {
          try {
            return JSON.parse(await fs.readFile(path.join(dir, f), 'utf8')) as PmsrData;
          } catch {
            return null;
          }
        }),
    );
    return results.filter((r): r is PmsrData => r !== null);
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Add new types and `buildPmsrStats()` to `src/lib/stats-live.ts`**

Add the following interfaces after the existing `TeamStatEntry` interface (around line 9):

```typescript
export interface PhysicalLeaderEntry {
  p: string;             // player name
  t: string;             // team abbreviation (ESPN/FIFA code)
  fifaId: string | null;
  value: number;         // km/h for speed, metres for distance, count for sprints
}

export interface XgTeamEntry {
  t: string;    // team abbreviation
  xg: number;   // cumulative expected goals (rounded to 2 dp)
  goals: number; // actual goals scored
  matches: number;
}
```

Extend `TournamentStats` by adding two new required fields at the bottom:

```typescript
export interface TournamentStats {
  tallies: TallyItem[];
  goldenBoot: ScorerEntry[];
  assists: LeadEntry[];
  cleanSheets: LeadEntry[];
  saves: LeadEntry[];
  discipline: DisciplineEntry[];
  young: YoungEntry[];
  teamStats: TeamStatEntry[];
  physicalLeaders: {
    topSpeed: PhysicalLeaderEntry[];
    mostDistance: PhysicalLeaderEntry[];
    mostSprints: PhysicalLeaderEntry[];
  };
  xgPerformance: XgTeamEntry[];
}
```

Add the following import at the top of `stats-live.ts` (after the existing imports):

```typescript
import type { PmsrData } from './pmsr';
```

Add `buildPmsrStats()` at the end of `src/lib/stats-live.ts`:

```typescript
// ─── PMSR aggregation ──────────────────────────────────────────────────────

interface MatchScore {
  homeAbbr: string;
  homeGoals: number;
  awayAbbr: string;
  awayGoals: number;
}

export function buildPmsrStats(
  pmsrData: PmsrData[],
  matchScores: Map<string, MatchScore>,
): {
  physicalLeaders: TournamentStats['physicalLeaders'];
  xgPerformance: XgTeamEntry[];
} {
  const playerMap = new Map<
    string,
    { name: string; abbr: string; fifaId: string | null; totalDistanceM: number; sprints: number; topSpeedKmh: number }
  >();
  const teamMap = new Map<string, { xg: number; goals: number; matches: number }>();

  for (const pmsr of pmsrData) {
    const score = matchScores.get(pmsr.eventId);
    const sides: [typeof pmsr.home, boolean][] = [
      [pmsr.home, true],
      [pmsr.away, false],
    ];

    for (const [team, isHome] of sides) {
      if (!team.abbr) continue;

      // xG accumulation (team-level)
      if (team.xg !== null) {
        if (!teamMap.has(team.abbr)) teamMap.set(team.abbr, { xg: 0, goals: 0, matches: 0 });
        const t = teamMap.get(team.abbr)!;
        t.xg += team.xg;
        t.matches++;
        if (score) t.goals += isHome ? score.homeGoals : score.awayGoals;
      }

      // Player physical accumulation
      for (const p of team.physical) {
        const key = p.fifaId ?? `${team.abbr}|${p.name}`;
        if (!playerMap.has(key)) {
          playerMap.set(key, {
            name: p.name,
            abbr: team.abbr,
            fifaId: p.fifaId,
            totalDistanceM: 0,
            sprints: 0,
            topSpeedKmh: 0,
          });
        }
        const acc = playerMap.get(key)!;
        acc.totalDistanceM += p.total_distance_m;   // cumulative
        acc.sprints += p.sprints;                    // cumulative
        if (p.top_speed_kmh > acc.topSpeedKmh) acc.topSpeedKmh = p.top_speed_kmh;  // max
      }
    }
  }

  const players = Array.from(playerMap.values());

  const top = (pick: (p: (typeof players)[0]) => number, n = 8): PhysicalLeaderEntry[] =>
    [...players]
      .sort((a, b) => pick(b) - pick(a))
      .slice(0, n)
      .map(p => ({ p: p.name, t: p.abbr, fifaId: p.fifaId, value: pick(p) }));

  const physicalLeaders =
    players.length === 0
      ? { topSpeed: [], mostDistance: [], mostSprints: [] }
      : {
          topSpeed: top(p => p.topSpeedKmh),
          mostDistance: top(p => p.totalDistanceM),
          mostSprints: top(p => p.sprints),
        };

  const xgPerformance: XgTeamEntry[] = Array.from(teamMap.entries())
    .map(([abbr, t]) => ({
      t: abbr,
      xg: Math.round(t.xg * 100) / 100,
      goals: t.goals,
      matches: t.matches,
    }))
    .sort((a, b) => b.xg - a.xg);

  return { physicalLeaders, xgPerformance };
}
```

- [ ] **Step 3: Write the failing test at `tests/pmsr/agg.test.mjs`**

```javascript
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
```

- [ ] **Step 4: Run test — expect failure**

```bash
node --experimental-strip-types tests/pmsr/agg.test.mjs
```

Expected: error like `SyntaxError` or `TypeError: buildPmsrStats is not a function` (function doesn't exist yet).

- [ ] **Step 5: Run test again after implementing Step 2 — expect PASS**

```bash
node --experimental-strip-types tests/pmsr/agg.test.mjs
```

Expected output: `agg.test.mjs PASS`

- [ ] **Step 6: Run existing PMSR tests to confirm no regressions**

```bash
node --experimental-strip-types tests/pmsr/names.test.mjs
node --experimental-strip-types tests/pmsr/leaders.test.mjs
node --experimental-strip-types tests/pmsr/ingest-output.test.mjs
```

Expected: all three print `PASS` on the last line.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pmsr.server.ts src/lib/stats-live.ts tests/pmsr/agg.test.mjs
git commit -m "Add getAllPmsr() and buildPmsrStats() aggregator for Phase 2"
```

---

## Task 2: Wire PMSR into `/api/stats`

Extend the existing route to call `getAllPmsr()` and `buildPmsrStats()`, then merge the result into the JSON response.

**Files:**
- Modify: `src/app/api/stats/route.ts`

**Interfaces:**
- Consumes:
  - `getAllPmsr(): Promise<PmsrData[]>` from `@/lib/pmsr.server`
  - `buildPmsrStats(pmsrData, matchScores)` from `@/lib/stats-live`
  - `completed` matches array (already in scope: `match.eventId`, `match.home.abbr`, `match.home.score`, `match.away.abbr`, `match.away.score`)
- Produces: JSON response shape now includes `physicalLeaders` and `xgPerformance`

- [ ] **Step 1: Add imports and wire into `src/app/api/stats/route.ts`**

Add to the existing imports at the top:

```typescript
import { getAllPmsr } from '@/lib/pmsr.server';
import { buildTournamentStats, buildPmsrStats } from '@/lib/stats-live';
```

(Note: `buildTournamentStats` is already imported — replace that import line with the above.)

Inside the `GET()` function, after the `const completed = ...` line, add the PMSR fetch in parallel with the existing summary fetches. Replace the block from `const summaries = await Promise.all(...)` down through `const stats = buildTournamentStats(...)` with:

```typescript
    // Fetch summaries + all PMSR data in parallel
    const [summaries, allPmsr] = await Promise.all([
      Promise.all(
        completed.map(m =>
          espnFetch<ESPNMatchSummaryFull>(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${m.eventId}`,
            `wc-match-${m.eventId}`,
            undefined,
          ),
        ),
      ),
      getAllPmsr(),
    ]);

    // Build FIFA id map (existing code — unchanged)
    const fifaIdByKey = new Map<string, string>();
    try {
      const squads = await fetchFifaSquads();
      for (const squad of squads) {
        for (const p of squad.players) {
          if (p.jerseyNum != null) fifaIdByKey.set(`${squad.countryCode}|${p.jerseyNum}`, p.fifaId);
        }
      }
    } catch (e) {
      console.warn('[/api/stats] FIFA squad join skipped:', e);
    }

    const stats = buildTournamentStats(summaries, dobMap, totalGoals, fifaIdByKey);

    // Build matchScores map for PMSR join
    const matchScores = new Map<
      string,
      { homeAbbr: string; homeGoals: number; awayAbbr: string; awayGoals: number }
    >();
    for (const m of completed) {
      matchScores.set(m.eventId, {
        homeAbbr: m.home.abbr,
        homeGoals: parseInt(m.home.score) || 0,
        awayAbbr: m.away.abbr,
        awayGoals: parseInt(m.away.score) || 0,
      });
    }
    const { physicalLeaders, xgPerformance } = buildPmsrStats(allPmsr, matchScores);
```

Then update the return statement to spread the PMSR fields into the response:

```typescript
    return NextResponse.json(
      { ...stats, physicalLeaders, xgPerformance },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
```

(The photo join for golden boot scorers can remain between `buildTournamentStats` and the return — leave it exactly as-is.)

- [ ] **Step 2: Verify the route compiles and returns PMSR data**

```bash
curl -s http://localhost:3000/api/stats | python3 -m json.tool | grep -A5 '"physicalLeaders"'
```

Expected: output shows `physicalLeaders` object with `topSpeed`, `mostDistance`, `mostSprints` arrays (non-empty given current PMSR data), and `xgPerformance` array with team entries.

If the dev server isn't running, start it with `npm run dev` first (in a separate terminal or background).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stats/route.ts
git commit -m "Wire getAllPmsr and buildPmsrStats into /api/stats"
```

---

## Task 3: UI — Running & physical section in StatsClient

Add a `PhysicalPanel` (tabbed: Top speed / Distance / Sprints) and an `XgTeamCard` to `StatsClient.tsx`. Both appear in a new "Running & physical" section below the existing leaderboards, in both Leaderboard and Spotlight views.

**Files:**
- Modify: `src/app/stats/StatsClient.tsx`

**Interfaces:**
- Consumes:
  - `PhysicalLeaderEntry`, `XgTeamEntry` from `@/lib/stats-live`
  - `physicalLeaders: { topSpeed: PhysicalLeaderEntry[]; mostDistance: PhysicalLeaderEntry[]; mostSprints: PhysicalLeaderEntry[] }` and `xgPerformance: XgTeamEntry[]` from the `stats` state

- [ ] **Step 1: Add new type imports in `StatsClient.tsx`**

Find the existing import from `@/lib/stats-live` (currently around line 9) and add the two new types:

```typescript
import type {
  TournamentStats,
  ScorerEntry,
  LeadEntry,
  DisciplineEntry,
  YoungEntry,
  TeamStatEntry,
  TallyItem,
  PhysicalLeaderEntry,
  XgTeamEntry,
} from '@/lib/stats-live';
```

- [ ] **Step 2: Update `EMPTY_STATS` to include the new fields**

Find the `EMPTY_STATS` object (around line 62) and add two new fields so it satisfies the extended `TournamentStats` interface:

```typescript
const EMPTY_STATS: TournamentStats = {
  tallies: [
    { k: 'Goals scored',  v: '—', sub: 'this tournament' },
    { k: 'Goals / match', v: '—', sub: 'avg' },
    { k: 'Penalties',     v: '—', sub: 'scored / taken' },
    { k: 'Clean sheets',  v: '—', sub: 'by goalkeepers' },
    { k: 'Yellow',        v: '—', sub: 'cards this tournament', v2: '—', k2: 'Red' },
    { k: 'Hat-tricks',    v: '—', sub: 'this tournament' },
  ],
  goldenBoot: [],
  assists: [],
  cleanSheets: [],
  saves: [],
  discipline: [],
  young: [],
  teamStats: [],
  physicalLeaders: { topSpeed: [], mostDistance: [], mostSprints: [] },
  xgPerformance: [],
};
```

- [ ] **Step 3: Add `PhysicalPanel` component**

Add the following component after the `YoungPanel` function (around line 239) and before `TeamStatsCard`:

```tsx
type PhysTab = 'Top speed' | 'Distance' | 'Sprints';

function PhysicalPanel({
  leaders,
}: {
  leaders: TournamentStats['physicalLeaders'];
}) {
  const [tab, setTab] = useState<PhysTab>('Top speed');
  const TABS: Array<{ key: PhysTab; rows: PhysicalLeaderEntry[]; unit: string }> = [
    { key: 'Top speed', rows: leaders.topSpeed,    unit: 'km/h' },
    { key: 'Distance',  rows: leaders.mostDistance, unit: 'km' },
    { key: 'Sprints',   rows: leaders.mostSprints,  unit: '' },
  ];
  const active = TABS.find(t => t.key === tab)!;

  return (
    <div className="panel">
      <div className="panel-head"><h3>Running &amp; physical</h3></div>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)' }}>
        <div className="seg" style={{ width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
              {t.key}
            </button>
          ))}
        </div>
      </div>
      {active.rows.length === 0 ? (
        <EmptyLeaders label="physical data" />
      ) : (
        active.rows.slice(0, 6).map((r, i) => (
          <RowLink className="lead-card" key={`${r.fifaId ?? r.p}-${r.t}`} fifaId={r.fifaId ?? undefined}>
            <span className="lc-rank tnum">{i + 1}</span>
            <div className="lc-info">
              <div className="lc-name">{r.p}</div>
              <div className="lc-meta">
                <Flag logo={teamFlagUrl(r.t)} abbr={r.t} size={13} />
                {countryName(r.t)}
              </div>
            </div>
            <span className="lc-val tnum">
              {tab === 'Distance'
                ? (r.value / 1000).toFixed(1)
                : tab === 'Top speed'
                ? r.value.toFixed(1)
                : r.value}
              {active.unit && (
                <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, marginLeft: 3 }}>
                  {active.unit}
                </span>
              )}
            </span>
          </RowLink>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add `XgTeamCard` component**

Add the following component immediately after `PhysicalPanel`:

```tsx
function XgTeamCard({ rows }: { rows: XgTeamEntry[] }) {
  if (rows.length === 0) return null;
  const maxXg = Math.max(...rows.map(r => r.xg));
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Expected goals</h3>
        <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>xG · actual</span>
      </div>
      <div className="tstat-row head">
        <span className="ts-rank">#</span>
        <span>Team</span>
        <span className="ts-num">xG</span>
        <span className="ts-num" style={{ textAlign: 'right' }}>Goals</span>
      </div>
      {rows.map((t, i) => (
        <div className="tstat-row" key={t.t}>
          <span className="ts-rank tnum">{i + 1}</span>
          <span className="ts-team">
            <Flag logo={teamFlagUrl(t.t)} abbr={t.t} size={18} />
            {countryName(t.t)}
          </span>
          <span className="ts-num" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ts-bar" style={{ flex: 1 }}>
              <i style={{ width: `${(t.xg / maxXg) * 100}%` }} />
            </span>
            <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
              {t.xg.toFixed(1)}
            </span>
          </span>
          <span className="ts-poss tnum">{t.goals}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Destructure new fields and add PMSR section to `StatsClient`**

In the `StatsClient` function body, find the destructure line (around line 372):

```typescript
const { tallies, goldenBoot, assists, cleanSheets, saves, discipline, young, teamStats } = stats;
```

Replace it with:

```typescript
const { tallies, goldenBoot, assists, cleanSheets, saves, discipline, young, teamStats, physicalLeaders, xgPerformance } = stats;
```

Then add the `hasPmsr` computed variable right after:

```typescript
const hasPmsr = xgPerformance.length > 0 || physicalLeaders.topSpeed.length > 0;
```

Now add the PMSR section to the **Leaderboard view** (inside `view === 'Leaderboard'`), immediately after the closing `</div>` of the existing `stats-duo`:

```tsx
{hasPmsr && (
  <>
    <div className="section-head" style={{ marginTop: 28 }}>
      <h2>Running &amp; physical</h2>
      <span className="eyebrow">FIFA match report data</span>
    </div>
    <div className="stats-duo" style={{ marginTop: 14 }}>
      <XgTeamCard rows={xgPerformance} />
      <PhysicalPanel leaders={physicalLeaders} />
    </div>
  </>
)}
```

Apply the same block to the **Spotlight view** (inside the `else` branch), in the same position after the existing `stats-duo` closing tag.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors appear, fix them before proceeding.

- [ ] **Step 7: Visual check in browser**

With `npm run dev` running, open `http://localhost:3000/stats`. Verify:

1. A "Running & physical" section heading appears below the existing leaders.
2. Two panels side-by-side: left = "Expected goals" table (teams ranked by cumulative xG with bar + goals column), right = "Running & physical" tabbed panel.
3. Clicking "Top speed" / "Distance" / "Sprints" tabs switches the right panel correctly.
4. Player rows in the physical panel link to `/player/{fifaId}` when a fifaId is present.
5. Both Leaderboard and Spotlight views show the section.
6. On mobile (≤760px), the two panels stack vertically (via existing `.stats-duo` responsive rule).

- [ ] **Step 8: Commit**

```bash
git add src/app/stats/StatsClient.tsx
git commit -m "Add Running & physical section to /stats (Phase 2 UI)"
```
