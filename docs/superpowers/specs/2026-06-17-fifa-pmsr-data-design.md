# FIFA PMSR Data Across the Site — Design

**Date:** 2026-06-17
**Status:** Approved (design); pending implementation plan

## Overview

FIFA publishes official Post-Match Summary Reports (PMSR) as per-match PDFs on the
FIFA Training Centre match-report hub. They contain analytics the ESPN API does
not provide. This project ingests those reports and surfaces two metric families
across the site:

- **Expected Goals (xG)** — team-level.
- **Physical / running data** — per-player (total distance, speed-zone distances,
  high-speed runs, sprints, top speed) and a team distance total.

A prototype already proved the parse and rendered xG + physical on one match
(AUT v JOR, ESPN event `760431`). This design generalizes that to all completed
matches and four site surfaces, on a shared ingestion + join + aggregation
foundation.

## Goals

- Ingest PMSR data for every completed match via a repeatable, idempotent script.
- Resolve FIFA reports to ESPN event IDs and FIFA player names to FIFA player IDs
  **at ingest time**, so committed JSON is self-contained and pages read IDs only.
- Surface xG + physical on: match detail, `/stats`, player pages, and match cards.

## Non-goals (explicit deferrals)

- **Shot detail** (per-player outcome / body part / delivery type). The shot log
  parses easily and is a clean future add, but is out of scope for v1.
- **Tactical depth** (pressing, line breaks, passing networks, set-play styles,
  phases of play). Available in the report, intentionally excluded — too much
  surface for this site.
- **Per-player xG.** The report only contains team-level xG (verified: one xG
  figure per team on page 3; the shot log has no per-shot xG). No per-player xG
  anywhere on the site.
- **Build-time or runtime PDF fetching/parsing.** All parsing is offline.

## Data source & constraints

- **Source:** `https://www.fifatrainingcentre.com/.../PMSR-M{n}-{HOME}-V-{AWAY}.pdf`,
  one per completed match. `{HOME}`/`{AWAY}` are FIFA 3-letter codes that match
  ESPN's codes exactly (AUT, JOR, …); the home team is listed first.
- **Parser:** `scripts/parse_pmsr.py` (exists) uses `pdftotext -layout` (poppler),
  not PyMuPDF — chosen because the only available PyMuPDF wheel is x86_64 and
  fails to load on this arm64 Python. Extracts team xG, team total distance, and
  the per-player physical tables for both teams.
- **xG is team-level only** — load-bearing constraint for the surface designs.

## Architecture

### 1. Ingestion pipeline (run on demand, e.g. `npm run pmsr`)

Orchestrator `scripts/pmsr_ingest.mjs`:

1. **Discover & fetch.** Scrape the match-report hub for available PDF hrefs.
   Skip any match that already has `data/pmsr/<eventId>.json`. Idempotent and
   cheap to re-run.
2. **Parse.** Shell out to `scripts/parse_pmsr.py` per new PDF to get the raw
   xG + physical JSON.
3. **Join & write.** Resolve the ESPN event ID and FIFA player IDs (below),
   then write `data/pmsr/<espnEventId>.json`. The operator commits the JSON.

Pages and SSG read the committed JSON. Nothing runs at request time or during the
Vercel build. The script upgrades cleanly to a GitHub Action later without
changing parse/join logic.

### 2. Join layer (resolved at ingest, baked into JSON)

- **Match → ESPN event ID.** From the filename's `(HOME, AWAY)` codes, find the
  ESPN scoreboard event with matching home/away abbreviations. Pairings are unique
  across the tournament, so this is unambiguous. The event ID is the JSON filename.
- **Player name → FIFA player ID.** The `/player/[athleteId]` route is keyed by
  FIFA player id (`fifaId`), not the ESPN athlete id, so the join resolves
  against the **FIFA squads** endpoint (keyed by `IdCountry` = team abbr), not the
  ESPN roster. Normalize both sides (uppercase, strip diacritics, spaces,
  punctuation) and match each physical row within the team's squad. Because PMSR
  and the FIFA squads are both FIFA-sourced, the ALL-CAPS romanized names match
  almost perfectly (the 15-match backfill resolved every player with no
  overrides). Each physical row gets `fifaId` (nullable).
- **Misses are explicit.** Unresolved names are logged at ingest and stored as
  `fifaId: null` (player still renders, just unlinked). A hand-maintained
  `data/pmsr/name-overrides.json` (`"FIFA NAME": "<fifaId>"`) forces stubborn
  cases without code changes.

### 3. Data shape (committed per match)

`data/pmsr/<eventId>.json`:

```jsonc
{
  "eventId": "760431",
  "source": "FIFA Post-Match Summary Report",
  "home": {
    "abbr": "AUT",
    "xg": 1.93,
    "totalDistanceKm": 120.4,
    "physical": [
      {
        "number": "5", "name": "Stefan POSCH", "fifaId": "…",
        "total_distance_m": 11970.4,
        "zone1_0_7_m": 3782.7, "zone2_7_15_m": 5002.7, "zone3_15_20_m": 1983.6,
        "zone4_20_25_m": 752.9, "zone5_25plus_m": 448.5,
        "high_speed_runs": 174.0, "sprints": 60.0, "top_speed_kmh": 32.4
      }
    ]
  },
  "away": { "abbr": "JOR", "xg": 0.53, "totalDistanceKm": 119.2, "physical": [ … ] }
}
```

`fifaId` is the only addition to the prototype's shape.

### 4. Access & aggregation layer

- `src/lib/pmsr.ts` — **client-safe**: types + pure helpers (`physicalLeaders`
  exists; add tournament aggregators). No `fs`.
- `src/lib/pmsr.server.ts` — server-only: `getPmsr(eventId)` (exists) +
  `getAllPmsr()` (reads all `data/pmsr/*.json`).

Aggregation rules (chosen to match how each metric reads):

- **Top speed** → a record: the single best reading across the tournament.
- **Total distance** and **sprints** → cumulative across each player's matches.
- **Team xG performance** → cumulative xG vs actual goals per team
  (over/under-performance).

Unifying principle: **physical = per-player story; xG = per-team story.**

## Surfaces

1. **Match detail** (`/match/[eventId]`). Already built for one match; lights up
   automatically once a match has JSON. Changes: physical-card leaders link to
   player pages via `fifaId`; works for all matches.

2. **`/stats`** (Leaderboard view). Add a **"Running & physical"** block — three
   leader lists (top speed, total distance, total sprints), rows linking to
   players — plus a **team xG performance** table (cumulative xG vs goals).

3. **Player pages** (`/player/[athleteId]`). Add a **"Running & physical"** section
   near the existing World Cup match log: tournament bests/totals (top speed,
   total distance, total sprints) and a per-match breakdown. Physical-only (no
   per-player xG).

4. **Home / match cards.** Lightweight `xG 1.93–0.53` label on **finished** match
   cards only.

## Build order (phased; one foundation, then surfaces)

1. **Foundation + match detail (all matches).** Ingestion orchestrator, joins,
   `fifaId` in JSON, `getAllPmsr()`, leader→player links. Delivers the prototype
   generalized to every completed match. Prerequisite for everything else.
2. **`/stats`** physical leaderboards + team xG table.
3. **Player pages** physical section.
4. **Match cards** xG label.

Each phase is independently shippable once phase 1 lands.

## Risks & mitigations

- **PDF layout drift across the tournament.** The parser targets specific labels
  (`xG (Expected Goals)`, `Total Distance Covered`, `Physical Data` headers). If
  FIFA changes layout, ingestion logs a parse miss for that match rather than
  writing bad data; the parser is adjusted and the match re-ingested.
- **Name-join misses.** Handled by explicit `null` + `name-overrides.json`
  (above). Never silently mis-attributes.
- **Hub scrape fragility.** If the hub markup changes, discovery breaks visibly
  (no new PDFs found) rather than corrupting data. Filename pattern is the stable
  contract.
- **Manual cadence.** Accepted tradeoff for zero runtime/build cost. Idempotent
  re-runs make catch-up trivial; GitHub Action is a later upgrade.

## Testing

- **Parser/join:** unit-test against the committed AUT v JOR fixture — assert
  xG (1.93 / 0.53), team distance (120.4 / 119.2), 16 players/side, and a known
  name→fifaId resolution.
- **Aggregators:** pure-function tests over a small multi-match fixture set
  (top-speed record, cumulative distance/sprints, team xG vs goals).
- **Surfaces:** typecheck + a render smoke check per surface (the prototype's
  approach: confirm data serializes and the component is in the route bundle).
