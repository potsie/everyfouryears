# /print Schedule Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/print` route with three visual schedule looks (Wall Chart, Editorial, Calendar) driven by live ESPN match data, switchable via labeled tabs, and printable via a browser print button.

**Architecture:** Server component fetches all 104 matches via `fetchAllMatches()`, passes `WorldCupMatchNormalized[]` to `PrintClient` (a `'use client'` component) which owns look-switcher state and renders the active look component. Three look components (`Editorial`, `WallChart`, `Calendar`) are pure render functions over the same match array.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind/CSS modules (per existing patterns), existing ESPN fetcher `fetchAllMatches()`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/print/page.tsx` | Create | Server component — fetch data, render Nav + PrintClient |
| `src/app/print/PrintClient.tsx` | Create | `'use client'` — look switcher state, print button, renders active look |
| `src/app/print/print.css` | Create | All print-specific CSS, `@page` rules, `@media print` overrides |
| `src/app/print/looks/Editorial.tsx` | Create | Look B — newspaper 3-col layout (default) |
| `src/app/print/looks/WallChart.tsx` | Create | Look A — fixed 3300×1660 venue×date matrix |
| `src/app/print/looks/Calendar.tsx` | Create | Look C — fixed 1400×2160 Jun–Jul calendar grid |
| `src/app/print/looks/shared.ts` | Create | Shared helpers: time formatting, date grouping, seed detection |
| `src/components/Nav.tsx` | Modify | Add "Print" nav link |

---

## Task 1: Shared helpers

**Files:**
- Create: `src/app/print/looks/shared.ts`

- [ ] **Create the shared helpers file**

```ts
// src/app/print/looks/shared.ts
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';

export const STAGE_ORDER: Record<number, number> = {
  1: 0, // Group Stage
  2: 1, // Round of 32
  3: 2, // Round of 16
  4: 3, // Quarterfinals
  5: 4, // Semifinals
  6: 5, // Third Place
  7: 6, // Final
};

export const STAGE_LABELS: Record<number, string> = {
  1: 'Group Stage',
  2: 'Round of 32',
  3: 'Round of 16',
  4: 'Quarterfinals',
  5: 'Semifinals',
  6: 'Third Place',
  7: 'Final',
};

export const STAGE_SUBLABELS: Record<number, string> = {
  1: '12 groups · 72 matches',
  2: '16 matches',
  3: '8 matches',
  4: '4 matches',
  5: '2 matches',
  6: '1 match',
  7: '1 match',
};

// Returns true for ESPN placeholder abbreviations like "2A", "1C", "W73", "L88", "3rd"
export function isSeedPlaceholder(abbr: string): boolean {
  return /^\d[A-L]$/.test(abbr) || /^[WL]\d+$/.test(abbr) || abbr === '3rd' || abbr === 'TBD';
}

// Format a UTC ISO string in the visitor's local timezone
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function fmtDayOfWeek(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' });
}

export function fmtDayNum(iso: string): number {
  return new Date(iso).getDate();
}

export function fmtMonthShort(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short' });
}

// Group matches by local calendar date key "YYYY-MM-DD"
export function groupByLocalDate(
  matches: WorldCupMatchNormalized[]
): Map<string, WorldCupMatchNormalized[]> {
  const map = new Map<string, WorldCupMatchNormalized[]>();
  for (const m of matches) {
    const key = new Date(m.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  // Sort each bucket by time
  for (const arr of map.values()) arr.sort((a, b) => a.date.localeCompare(b.date));
  return map;
}

// Group matches by seasonTypeId, preserving STAGE_ORDER
export function groupByStage(
  matches: WorldCupMatchNormalized[]
): Map<number, WorldCupMatchNormalized[]> {
  const map = new Map<number, WorldCupMatchNormalized[]>();
  for (const m of matches) {
    const id = m.seasonTypeId;
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(m);
  }
  return new Map([...map.entries()].sort((a, b) => STAGE_ORDER[a[0]] - STAGE_ORDER[b[0]]));
}

// Score display for completed matches: "2–1"
export function fmtScore(m: WorldCupMatchNormalized): string | null {
  if (m.status.state !== 'post') return null;
  return `${m.home.score}–${m.away.score}`;
}
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/print/looks/shared.ts
git commit -m "Add /print shared helpers (time, grouping, seed detection)"
```

---

## Task 2: Print CSS

**Files:**
- Create: `src/app/print/print.css`

- [ ] **Create the CSS file**

```css
/* src/app/print/print.css */

/* ── Look B tokens (Editorial) ── */
.print-editorial {
  --paper: #f6f4ee;
  --ink: #1b1a17;
  --ink-2: #54514a;
  --ink-3: #8d897e;
  --rule: #d8d4c8;
  --rule-2: #e7e3d8;
  --accent: oklch(0.52 0.16 28);
  --accent-ko: oklch(0.46 0.10 250);
  --chip: #efece3;
  font-family: 'Archivo', sans-serif;
}

.print-editorial .ed-page {
  width: 816px;
  background: var(--paper);
  padding: 54px 56px 46px;
  margin: 0 auto;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
}

/* Masthead */
.ed-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}
.ed-mast { border-bottom: 3px solid var(--ink); padding-bottom: 16px; margin-bottom: 4px; }
.ed-title {
  font-size: 60px;
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--ink);
}
.ed-title em { font-style: normal; color: var(--accent); }
.ed-mast-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 14px; }
.ed-hosts { font-size: 13px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink); }
.ed-hosts span { color: var(--ink-3); }
.ed-meta { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--ink-2); text-align: right; line-height: 1.6; }
.ed-meta b { color: var(--ink); font-weight: 600; }

/* Stage section */
.ed-stage { margin-top: 26px; }
.ed-stage-hd {
  display: flex; align-items: baseline; gap: 12px;
  border-bottom: 1.5px solid var(--ink); padding-bottom: 5px; margin-bottom: 12px;
}
.ed-stage-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); flex: none; align-self: center; }
.ed-stage.ko .ed-stage-dot { background: var(--accent-ko); }
.ed-stage-title { font-size: 19px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink); }
.ed-stage-sub { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: var(--ink-3); margin-left: auto; }

/* Day flow */
.ed-days { column-count: 3; column-gap: 22px; }
.ed-day { break-inside: avoid; margin-bottom: 13px; }
.ed-day-hd {
  display: flex; align-items: baseline; gap: 6px;
  border-bottom: 1px solid var(--rule); padding-bottom: 2px; margin-bottom: 5px;
}
.ed-dow { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-3); }
.ed-dnum { font-size: 14px; font-weight: 800; color: var(--ink); }
.ed-dmon { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
.ed-stage.ko .ed-dmon { color: var(--accent-ko); }

/* Match row */
.ed-match { display: grid; grid-template-columns: 46px 1fr; gap: 7px; padding: 3px 0; align-items: start; }
.ed-match + .ed-match { border-top: 1px dotted var(--rule-2); }
.ed-time { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--ink-2); padding-top: 1px; white-space: nowrap; }
.ed-teams { display: flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; line-height: 1.15; color: var(--ink); }
.ed-teams .v { color: var(--ink-3); font-weight: 500; font-size: 10px; font-style: italic; }
.ed-flag { width: 17px; height: 12px; object-fit: cover; border: 0.5px solid rgba(0,0,0,0.18); flex: none; background: var(--chip); }
.ed-match-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 5px; margin-top: 2px; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--ink-3); }
.ed-badge { font-weight: 700; color: #fff; background: var(--accent); padding: 0.5px 4px; border-radius: 2px; font-size: 8.5px; }
.ed-stage.ko .ed-badge { background: var(--accent-ko); }
.ed-score { font-weight: 700; color: var(--accent); }
.ed-stage.ko .ed-score { color: var(--accent-ko); }

/* Venues footer */
.ed-venues { margin-top: 30px; border-top: 3px solid var(--ink); padding-top: 14px; }
.ed-venues h2 { font-size: 15px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; color: var(--ink); }
.ed-vgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px 22px; }
.ed-venue { display: flex; gap: 8px; align-items: baseline; }
.ed-vnum { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--ink-3); width: 14px; flex: none; }
.ed-vcity { font-size: 11.5px; font-weight: 700; color: var(--ink); line-height: 1.1; }
.ed-vstadium { font-size: 9px; color: var(--ink-3); font-family: 'IBM Plex Mono', monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ed-foot { margin-top: 20px; border-top: 1px solid var(--rule); padding-top: 8px; display: flex; justify-content: space-between; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--ink-3); letter-spacing: 0.04em; }

/* ── Look A tokens (Wall Chart) ── */
.print-wallchart {
  --wc-bg: #0c1120;
  --wc-panel: #10172a;
  --wc-header: #0a0e1a;
  --wc-ink: #f3f5fb;
  --wc-ink-2: #aab2c8;
  --wc-ink-3: #697089;
  --wc-line: rgba(255, 255, 255, 0.09);
  --wc-amber: oklch(0.80 0.13 78);
  --wc-us: oklch(0.62 0.11 250);
  --wc-mx: oklch(0.64 0.12 150);
  --wc-ca: oklch(0.62 0.15 28);
}

.wc-scaler { transform-origin: top center; }
.wc-poster {
  width: 3300px; height: 1660px;
  background: var(--wc-bg);
  position: relative; overflow: hidden;
  color: var(--wc-ink);
  font-family: 'Archivo', sans-serif;
}
.wc-top {
  height: 150px; background: var(--wc-header);
  border-bottom: 2px solid var(--wc-amber);
  display: flex; align-items: center; padding: 0 48px; gap: 40px;
}
.wc-title { font-size: 62px; font-weight: 900; letter-spacing: -0.01em; line-height: 0.9; text-transform: uppercase; white-space: nowrap; }
.wc-title .yr { color: var(--wc-amber); }
.wc-hosts { font-size: 22px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.3; border-left: 2px solid var(--wc-line); padding-left: 32px; color: var(--wc-ink); }
.wc-hosts .dim { color: var(--wc-ink-3); }
.wc-dates { text-align: right; font-family: 'IBM Plex Mono', monospace; font-size: 18px; color: var(--wc-ink-2); line-height: 1.7; }
.wc-grid { position: absolute; left: 0; right: 0; top: 150px; bottom: 0; display: flex; flex-direction: column; }
.wc-vcell {
  flex: none; display: flex; flex-direction: column; justify-content: center;
  padding: 0 12px 0 16px; border-bottom: 1px solid var(--wc-line);
  border-right: 2px solid var(--wc-amber); position: relative;
}
.wc-vcell::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.wc-vcell.us::before { background: var(--wc-us); }
.wc-vcell.mx::before { background: var(--wc-mx); }
.wc-vcell.ca::before { background: var(--wc-ca); }
.wc-vcity { font-size: 23px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.05; }
.wc-stadium { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--wc-ink-3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wc-cell { border-right: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid var(--wc-line); position: relative; }
.wc-cell.us { background: color-mix(in oklab, var(--wc-us) 7%, var(--wc-bg)); }
.wc-cell.mx { background: color-mix(in oklab, var(--wc-mx) 7%, var(--wc-bg)); }
.wc-cell.ca { background: color-mix(in oklab, var(--wc-ca) 7%, var(--wc-bg)); }
.wc-cell.off { background: rgba(0, 0, 0, 0.18); }
.wc-chip {
  position: absolute; inset: 5px 4px; border-radius: 5px;
  background: rgba(10,14,26,0.55); border: 1px solid var(--wc-line);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 4px 2px; overflow: hidden;
}
.wc-chip-flags { display: flex; gap: 5px; align-items: center; margin-bottom: 3px; }
.wc-chip-flags img { width: 30px; height: 21px; object-fit: cover; border: 0.5px solid rgba(255,255,255,0.25); }
.wc-chip-teams { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; color: var(--wc-ink); }
.wc-chip-teams .v { color: var(--wc-amber); font-weight: 600; margin: 0 2px; }
.wc-chip-info { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--wc-ink-2); margin-top: 3px; }
.wc-chip-info .g { color: var(--wc-amber); font-weight: 600; }
.wc-chip.ko { background: rgba(20,26,44,0.7); border-color: rgba(205,214,236,0.22); }
.wc-chip.ko .wc-chip-round { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #cdd6ec; margin-bottom: 3px; }
.wc-chip.ko .wc-chip-seed { font-size: 15px; font-weight: 700; color: var(--wc-ink); }
.wc-chip.ko .wc-chip-seed .v { color: var(--wc-amber); margin: 0 3px; }
.wc-chip.fin { border-color: var(--wc-amber); background: rgba(40,32,12,0.6); }
.wc-dc-col { display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid rgba(255,255,255,0.05); gap: 1px; }
.wc-dc-col.off { opacity: 0.32; }
.wc-dc-dow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.06em; color: var(--wc-ink-3); text-transform: uppercase; }
.wc-dc-dnum { font-size: 22px; font-weight: 800; }
.wc-mlabel { font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 600; letter-spacing: 0.3em; color: var(--wc-amber); display: flex; align-items: center; padding-left: 14px; border-right: 1px solid var(--wc-line); text-transform: uppercase; }
.wc-scol { position: absolute; top: 0; height: 30px; display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--wc-amber); }
.wc-scol.ko { color: #cdd6ec; }
.wc-scol::before { content: ''; position: absolute; left: 6px; right: 6px; top: 50%; height: 1px; background: currentColor; opacity: 0.28; }
.wc-scol span { position: relative; background: var(--wc-bg); padding: 0 10px; }

/* ── Look C tokens (Calendar) ── */
.print-calendar {
  --cal-bg: #f7f9fc;
  --cal-bg-2: #eaeff7;
  --cal-ink: #16203a;
  --cal-ink-2: #46506b;
  --cal-ink-3: #8b93a8;
  --cal-red: oklch(0.58 0.19 25);
  --cal-blue: oklch(0.55 0.15 248);
  --cal-gold: oklch(0.80 0.14 82);
  --cal-rule: #d3dbe9;
  font-family: 'Archivo', sans-serif;
}

.cal-scaler { transform-origin: top center; }
.cal-poster {
  width: 1400px; height: 2160px;
  background: var(--cal-bg);
  background-image: radial-gradient(var(--cal-rule) 0.8px, transparent 0.8px);
  background-size: 7px 7px;
  display: flex; flex-direction: column;
  color: var(--cal-ink);
}
.cal-hd { padding: 42px 56px 26px; border-bottom: 5px solid var(--cal-ink); }
.cal-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 17px; font-weight: 600; letter-spacing: 0.34em; text-transform: uppercase; color: var(--cal-red); margin-bottom: 14px; display: flex; align-items: center; gap: 14px; }
.cal-eyebrow::after { content: ''; flex: 1; height: 2px; background: var(--cal-ink); opacity: 0.25; }
.cal-title { font-family: 'Anton', sans-serif; font-size: 138px; line-height: 0.82; letter-spacing: 0.005em; text-transform: uppercase; color: var(--cal-ink); }
.cal-title .outline { color: var(--cal-bg); -webkit-text-stroke: 3px var(--cal-ink); }
.cal-hd-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 22px; }
.cal-hosts { font-family: 'Anton', sans-serif; font-size: 30px; letter-spacing: 0.04em; text-transform: uppercase; display: flex; gap: 18px; align-items: center; }
.cal-hosts .u { color: var(--cal-blue); }
.cal-hosts .m { color: oklch(0.58 0.13 150); }
.cal-hosts .c { color: var(--cal-red); }
.cal-hosts .sep { color: var(--cal-red); font-size: 18px; }
.cal-stat { text-align: right; font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: var(--cal-ink-2); line-height: 1.65; }
.cal-stat b { display: block; font-family: 'Anton', sans-serif; font-size: 22px; color: var(--cal-ink); font-weight: 400; margin-bottom: 3px; }
.cal-dow-row { display: grid; grid-template-columns: repeat(7, 1fr); background: var(--cal-ink); }
.cal-dow { padding: 9px 0; text-align: center; font-family: 'Anton', sans-serif; font-size: 19px; letter-spacing: 0.18em; color: var(--cal-bg); text-transform: uppercase; }
.cal-dow.we { color: var(--cal-gold); }
.cal-grid { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 1fr; border-top: 2px solid var(--cal-rule); }
.cal-cell { border-right: 2px solid var(--cal-rule); border-bottom: 2px solid var(--cal-rule); padding: 7px 8px 9px; min-height: 0; display: flex; flex-direction: column; }
.cal-cell:nth-child(7n) { border-right: none; }
.cal-cell.we { background: rgba(120, 145, 190, 0.10); }
.cal-cell.empty { background: repeating-linear-gradient(135deg, transparent, transparent 9px, rgba(130,150,185,0.13) 9px, rgba(130,150,185,0.13) 11px); }
.cal-cell-hd { display: flex; align-items: baseline; gap: 6px; margin-bottom: 5px; }
.cal-dnum { font-family: 'Anton', sans-serif; font-size: 30px; line-height: 0.8; color: var(--cal-ink); }
.cal-cell.empty .cal-dnum { color: var(--cal-ink-3); opacity: 0.5; }
.cal-dmon { font-family: 'Anton', sans-serif; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cal-red); }
.cal-rest { margin-left: auto; font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cal-ink-3); align-self: center; }
.cal-mlist { display: flex; flex-direction: column; gap: 3px; }
.cal-chip { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 5px; padding: 2.5px 5px; background: var(--cal-bg-2); border-left: 3px solid var(--cal-blue); border-radius: 0 3px 3px 0; }
.cal-chip.ko { border-left-color: var(--cal-red); background: color-mix(in oklab, var(--cal-red) 9%, var(--cal-bg-2)); }
.cal-chip-flags { display: flex; gap: 2px; align-items: center; }
.cal-chip-flags img { width: 17px; height: 12px; object-fit: cover; border: 0.5px solid rgba(0,0,0,0.25); }
.cal-chip-teams { font-size: 13px; font-weight: 800; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--cal-ink); }
.cal-chip-teams .v { color: var(--cal-ink-3); font-weight: 600; margin: 0 1px; }
.cal-chip-time { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--cal-ink-2); white-space: nowrap; }
.cal-chip-meta { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; color: var(--cal-blue); grid-column: 2 / -1; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cal-chip.ko .cal-chip-meta { color: var(--cal-red); }
.cal-chip.ko .cal-chip-teams { font-size: 11px; }
.cal-chip-stg { font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--cal-red); grid-column: 1/-1; line-height: 1; margin-bottom: 1px; }
.cal-foot { flex: none; height: 182px; background: var(--cal-ink); color: var(--cal-bg); padding: 22px 56px; display: flex; flex-direction: column; }
.cal-foot h3 { font-family: 'Anton', sans-serif; font-size: 22px; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 14px; }
.cal-foot h3::after { content: ''; flex: 1; height: 2px; background: rgba(255,255,255,0.18); }
.cal-vrow { display: grid; grid-template-columns: repeat(8, 1fr); gap: 9px 20px; }
.cal-vc { display: flex; gap: 7px; align-items: center; }
.cal-vc img { width: 18px; height: 13px; object-fit: cover; border: 0.5px solid rgba(255,255,255,0.3); flex: none; }
.cal-vc-city { font-family: 'Anton', sans-serif; font-size: 15px; line-height: 1; }
.cal-vc-stad { font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; color: #9aa3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── Print chrome ── */
.print-chrome {
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 50;
}
.print-chrome-title { flex: 1; }
.print-chrome-title h1 { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
.print-chrome-title p { font-size: 12px; color: #64748b; margin-top: 1px; }
.print-switcher { display: flex; gap: 2px; background: #f1f5f9; border-radius: 8px; padding: 3px; }
.print-switcher-btn {
  padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
  color: #64748b; cursor: pointer; background: none; border: none; white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.print-switcher-btn.active { background: #0f172a; color: #fff; font-weight: 700; }
.print-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 16px; background: #0f172a; color: #fff;
  border: none; border-radius: 7px; font-size: 12px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
}
.print-btn:hover { background: #1e293b; }

/* ── @page rules per look ── */
@media print {
  /* Hide site chrome */
  nav, .print-chrome { display: none !important; }

  /* Editorial: US Letter portrait */
  body.look-editorial {
    background: #fff !important;
  }
  body.look-editorial .ed-page {
    box-shadow: none;
    width: auto;
    padding: 0;
  }
  @page {
    size: Letter portrait;
    margin: 0.45in;
  }

  /* Wall Chart: A3 landscape, no scale transform */
  body.look-wallchart {
    background: #fff !important;
  }
  body.look-wallchart .wc-scaler {
    transform: none !important;
  }
  @page {
    size: A3 landscape;
    margin: 0;
  }

  /* Calendar: A2 portrait, no scale transform */
  body.look-calendar {
    background: #fff !important;
  }
  body.look-calendar .cal-scaler {
    transform: none !important;
  }
  @page {
    size: A2 portrait;
    margin: 0;
  }

  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
```

- [ ] **Commit**

```bash
git add src/app/print/print.css
git commit -m "Add /print CSS — all three look tokens + print @page rules"
```

---

## Task 3: Editorial look (Look B)

**Files:**
- Create: `src/app/print/looks/Editorial.tsx`

- [ ] **Create Editorial.tsx**

```tsx
// src/app/print/looks/Editorial.tsx
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { STAGE_LABELS, STAGE_SUBLABELS, isSeedPlaceholder, fmtTime, fmtDayOfWeek, fmtDayNum, fmtMonthShort, groupByLocalDate, groupByStage, fmtScore } from './shared';
import { VENUES } from '@/lib/venues';

interface Props { matches: WorldCupMatchNormalized[]; }

const VENUE_CITY: Record<string, string> = Object.fromEntries(
  VENUES.map(v => [v.name, v.city])
);

function venueCity(name: string): string {
  return VENUE_CITY[name] ?? name;
}

function Flag({ logo, abbr }: { logo: string; abbr: string }) {
  if (!logo) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="ed-flag" src={logo} alt={abbr} />;
}

function MatchRow({ m, ko }: { m: WorldCupMatchNormalized; ko: boolean }) {
  const homeIsSeed = isSeedPlaceholder(m.home.abbr);
  const awayIsSeed = isSeedPlaceholder(m.away.abbr);
  const score = fmtScore(m);

  return (
    <div className="ed-match">
      <div className="ed-time">{fmtTime(m.date)}</div>
      <div>
        <div className="ed-teams">
          {!homeIsSeed && <Flag logo={m.home.logo} abbr={m.home.abbr} />}
          <span>{homeIsSeed ? m.home.abbr : m.home.abbr}</span>
          <span className="v">v</span>
          <span>{awayIsSeed ? m.away.abbr : m.away.abbr}</span>
          {!awayIsSeed && <Flag logo={m.away.logo} abbr={m.away.abbr} />}
        </div>
        <div className="ed-match-meta">
          {ko
            ? <span className="ed-badge">{m.stage.replace('Round of ', 'R')}</span>
            : <span className="ed-badge">{m.groupLetter ? `GRP ${m.groupLetter}` : m.stage}</span>
          }
          <span>#{m.eventId.slice(-2)}</span>
          <span>{venueCity(m.venue)}</span>
          {score && <span className="ed-score">● {score}</span>}
        </div>
      </div>
    </div>
  );
}

export function Editorial({ matches }: Props) {
  const byStage = groupByStage(matches);

  return (
    <div className="print-editorial">
      <div className="ed-page">
        {/* Masthead */}
        <header className="ed-mast">
          <div className="ed-kicker">FIFA World Cup · United 2026</div>
          <h1 className="ed-title">The 2026<br />World Cup <em>Schedule</em></h1>
          <div className="ed-mast-row">
            <div className="ed-hosts">Canada <span>·</span> Mexico <span>·</span> United States</div>
            <div className="ed-meta">
              <b>48 teams · 104 matches · 16 cities</b><br />
              Jun 11 – Jul 19, 2026
            </div>
          </div>
        </header>

        {/* Stages */}
        {[...byStage.entries()].map(([stageId, stageMatches]) => {
          const ko = stageId > 1;
          const byDate = groupByLocalDate(stageMatches);
          return (
            <section key={stageId} className={`ed-stage${ko ? ' ko' : ''}`}>
              <div className="ed-stage-hd">
                <span className="ed-stage-dot" />
                <h2 className="ed-stage-title">{STAGE_LABELS[stageId]}</h2>
                <span className="ed-stage-sub">{STAGE_SUBLABELS[stageId]}</span>
              </div>
              <div className="ed-days">
                {[...byDate.entries()].map(([dateKey, dayMatches]) => {
                  const iso = dayMatches[0].date;
                  return (
                    <div key={dateKey} className="ed-day">
                      <div className="ed-day-hd">
                        <span className="ed-dow">{fmtDayOfWeek(iso)}</span>
                        <span className="ed-dnum">{fmtDayNum(iso)}</span>
                        <span className="ed-dmon">{fmtMonthShort(iso)}</span>
                      </div>
                      {dayMatches.map(m => (
                        <MatchRow key={m.eventId} m={m} ko={ko} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Venues footer */}
        <section className="ed-venues">
          <h2>16 Host Cities</h2>
          <div className="ed-vgrid">
            {VENUES.map((v, i) => (
              <div key={v.slug} className="ed-venue">
                <span className="ed-vnum">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="ed-vcity">{v.city}</div>
                  <div className="ed-vstadium">{v.name}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="ed-foot">
          <span>2026 FIFA WORLD CUP · UNITED</span>
          <span>SCHEDULE SUBJECT TO CHANGE</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/print/looks/Editorial.tsx
git commit -m "Add Editorial look (Look B) for /print"
```

---

## Task 4: Wall Chart look (Look A)

**Files:**
- Create: `src/app/print/looks/WallChart.tsx`

- [ ] **Create WallChart.tsx**

```tsx
// src/app/print/looks/WallChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { isSeedPlaceholder, fmtTime } from './shared';
import { VENUES } from '@/lib/venues';

interface Props { matches: WorldCupMatchNormalized[]; }

const VENUE_COL_WIDTH = 248;
const POSTER_W = 3300;
const POSTER_H = 1660;
const HEADER_H = 150;
const MONTH_H = 30;
const DCOLS_H = 58;
const STAGE_H = 30;
const TOP_H = MONTH_H + DCOLS_H + STAGE_H;

// Venue → host country for colour coding
const VENUE_COUNTRY: Record<string, 'us' | 'mx' | 'ca'> = {
  'MetLife Stadium': 'us', 'AT&T Stadium': 'us', 'SoFi Stadium': 'us',
  'Hard Rock Stadium': 'us', 'Gillette Stadium': 'us', 'NRG Stadium': 'us',
  'GEHA Field at Arrowhead Stadium': 'us', "Levi's Stadium": 'us',
  'Lincoln Financial Field': 'us', 'Lumen Field': 'us',
  'Estadio Banorte': 'mx', 'Estadio Akron': 'mx', 'Estadio BBVA': 'mx',
  'BC Place': 'ca', 'BMO Field': 'ca',
};

const STAGE_BANDS = [
  { label: 'Group Stage', ids: [1], ko: false },
  { label: 'Round of 32', ids: [2], ko: true },
  { label: 'Round of 16', ids: [3], ko: true },
  { label: 'Quarters', ids: [4], ko: true },
  { label: 'Semis', ids: [5], ko: true },
  { label: 'Finals', ids: [6, 7], ko: true },
];

const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildDays(): Date[] {
  const days: Date[] = [];
  const d = new Date(Date.UTC(2026, 5, 11)); // Jun 11 UTC
  const end = new Date(Date.UTC(2026, 6, 19)); // Jul 19 UTC
  while (d <= end) { days.push(new Date(d)); d.setUTCDate(d.getUTCDate() + 1); }
  return days;
}

function utcDateKey(iso: string): string {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

export function WallChart({ matches }: Props) {
  const scalerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fit() {
      if (!scalerRef.current) return;
      const s = Math.min(window.innerWidth / POSTER_W, window.innerHeight / POSTER_H);
      scalerRef.current.style.transform = `scale(${s})`;
      document.body.style.height = `${POSTER_H * s}px`;
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const days = buildDays();
  const matchDates = new Set(matches.map(m => utcDateKey(m.date)));
  const gridW = POSTER_W - VENUE_COL_WIDTH;

  // Weighted column widths
  const weights = days.map(d => matchDates.has(d.toISOString().slice(0, 10)) ? 1 : 0.34);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map(w => (w * gridW) / weightSum);
  const colLefts: number[] = [];
  let acc = VENUE_COL_WIDTH;
  colWidths.forEach(w => { colLefts.push(acc); acc += w; });

  // Match index: "venue|YYYY-MM-DD" → match
  const matchIdx: Record<string, WorldCupMatchNormalized> = {};
  matches.forEach(m => { matchIdx[`${m.venue}|${utcDateKey(m.date)}`] = m; });

  const rowH = (POSTER_H - HEADER_H - TOP_H) / VENUES.length;

  // Month groupings
  type MonthSpan = { month: string; width: number; left: number };
  const monthSpans: MonthSpan[] = [];
  let runStart = 0;
  const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  for (let i = 0; i <= days.length; i++) {
    if (i === days.length || days[i].getUTCMonth() !== days[runStart].getUTCMonth()) {
      const left = colLefts[runStart];
      const right = colLefts[i - 1] + colWidths[i - 1];
      monthSpans.push({ month: MONTHS[days[runStart].getUTCMonth() + 1], width: right - left, left });
      runStart = i;
    }
  }

  return (
    <div className="print-wallchart" style={{ background: '#05070d', display: 'flex', justifyContent: 'center' }}>
      <div ref={scalerRef} className="wc-scaler">
        <div className="wc-poster">
          {/* Header */}
          <div className="wc-top">
            <h1 className="wc-title"><span className="yr">2026</span> World&nbsp;Cup</h1>
            <div className="wc-hosts">Canada <span className="dim">·</span> Mexico <span className="dim">·</span> USA</div>
            <div style={{ flex: 1 }} />
            <div className="wc-dates">
              <b style={{ color: '#f3f5fb', fontWeight: 600 }}>48 TEAMS · 104 MATCHES · 16 CITIES</b><br />
              Jun 11 – Jul 19, 2026
            </div>
          </div>

          {/* Grid */}
          <div className="wc-grid">
            {/* Month strip + day columns + stage band */}
            <div style={{ display: 'flex' }}>
              <div style={{ width: VENUE_COL_WIDTH, background: '#0a0e1a', borderRight: '2px solid oklch(0.80 0.13 78)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                {/* Month strip */}
                <div style={{ display: 'flex', height: MONTH_H }}>
                  {monthSpans.map((ms, i) => (
                    <div key={i} className="wc-mlabel" style={{ width: ms.width }}>{ms.month}</div>
                  ))}
                </div>
                {/* Day columns */}
                <div style={{ display: 'flex', height: DCOLS_H, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
                  {days.map((d, i) => {
                    const key = d.toISOString().slice(0, 10);
                    const off = !matchDates.has(key);
                    return (
                      <div key={i} className={`wc-dc-col${off ? ' off' : ''}`} style={{ width: colWidths[i] }}>
                        <span className="wc-dc-dow">{DOWS[d.getUTCDay()]}</span>
                        <span className="wc-dc-dnum">{d.getUTCDate()}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Stage band */}
                <div style={{ height: STAGE_H, position: 'relative', borderBottom: '2px solid oklch(0.80 0.13 78)' }}>
                  {STAGE_BANDS.map(({ label, ids, ko }) => {
                    const stageMatches = matches.filter(m => ids.includes(m.seasonTypeId));
                    if (!stageMatches.length) return null;
                    const dayIdxes = stageMatches.map(m => days.findIndex(d => d.toISOString().slice(0, 10) === utcDateKey(m.date)));
                    const lo = Math.min(...dayIdxes);
                    const hi = Math.max(...dayIdxes);
                    if (lo < 0) return null;
                    const left = colLefts[lo] - VENUE_COL_WIDTH;
                    const right = colLefts[hi] + colWidths[hi] - VENUE_COL_WIDTH;
                    return (
                      <div key={label} className={`wc-scol${ko ? ' ko' : ''}`} style={{ left, width: right - left }}>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Venue rows */}
            {VENUES.map(v => {
              const co = VENUE_COUNTRY[v.name] ?? 'us';
              return (
                <div key={v.slug} style={{ display: 'flex', height: rowH }}>
                  <div className={`wc-vcell ${co}`} style={{ width: VENUE_COL_WIDTH, height: rowH }}>
                    <div className="wc-vcity">{v.city}</div>
                    <div className="wc-stadium">{v.name}</div>
                  </div>
                  {days.map((d, i) => {
                    const dayKey = d.toISOString().slice(0, 10);
                    const off = !matchDates.has(dayKey);
                    const m = matchIdx[`${v.name}|${dayKey}`];
                    const ko = m && m.seasonTypeId > 1;
                    const isFin = m && (m.seasonTypeId === 6 || m.seasonTypeId === 7);
                    return (
                      <div key={i} className={`wc-cell${off ? ' off' : ` ${co}`}`} style={{ width: colWidths[i], height: rowH }}>
                        {m && (
                          ko ? (
                            <div className={`wc-chip ko${isFin ? ' fin' : ''}`}>
                              <div className="wc-chip-round">{m.stage}</div>
                              <div className="wc-chip-seed">
                                {isSeedPlaceholder(m.home.abbr) ? m.home.abbr : m.home.abbr}
                                <span className="v">v</span>
                                {isSeedPlaceholder(m.away.abbr) ? m.away.abbr : m.away.abbr}
                              </div>
                              <div className="wc-chip-info">{fmtTime(m.date)}</div>
                            </div>
                          ) : (
                            <div className="wc-chip">
                              <div className="wc-chip-flags">
                                {m.home.logo && <img src={m.home.logo} alt={m.home.abbr} />}
                                {m.away.logo && <img src={m.away.logo} alt={m.away.abbr} />}
                              </div>
                              <div className="wc-chip-teams">
                                {m.home.abbr}<span className="v">v</span>{m.away.abbr}
                              </div>
                              <div className="wc-chip-info">
                                <span className="g">{m.groupLetter ? `GRP ${m.groupLetter}` : ''}</span>
                                {m.groupLetter ? ' · ' : ''}{fmtTime(m.date)}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/print/looks/WallChart.tsx
git commit -m "Add Wall Chart look (Look A) for /print"
```

---

## Task 5: Calendar look (Look C)

**Files:**
- Create: `src/app/print/looks/Calendar.tsx`

- [ ] **Create Calendar.tsx**

```tsx
// src/app/print/looks/Calendar.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { isSeedPlaceholder, fmtTime, groupByLocalDate } from './shared';
import { VENUES } from '@/lib/venues';

interface Props { matches: WorldCupMatchNormalized[]; }

const POSTER_W = 1400;
const POSTER_H = 2160;
const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Jun 7 → Jul 25 (7 full weeks)
function buildCalDays(): Date[] {
  const days: Date[] = [];
  const d = new Date(2026, 5, 7); // local
  const end = new Date(2026, 6, 25);
  while (d <= end) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

const T_START = new Date(2026, 5, 11);
const T_END   = new Date(2026, 6, 19);

export function Calendar({ matches }: Props) {
  const scalerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fit() {
      if (!scalerRef.current) return;
      const s = Math.min(window.innerWidth / POSTER_W, window.innerHeight / POSTER_H);
      scalerRef.current.style.transform = `scale(${s})`;
      document.body.style.height = `${POSTER_H * s}px`;
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const byDate = groupByLocalDate(matches); // Map<"YYYY-MM-DD", matches[]>
  const calDays = buildCalDays();

  return (
    <div className="print-calendar" style={{ background: '#0e1426', display: 'flex', justifyContent: 'center' }}>
      <div ref={scalerRef} className="cal-scaler">
        <div className="cal-poster">
          {/* Header */}
          <div className="cal-hd">
            <div className="cal-eyebrow">FIFA World Cup 26 · June 11 – July 19</div>
            <h1 className="cal-title">World&nbsp;Cup<br /><span className="outline">2026</span> Calendar</h1>
            <div className="cal-hd-row">
              <div className="cal-hosts">
                <span className="c">Canada</span>
                <span className="sep">×</span>
                <span className="m">Mexico</span>
                <span className="sep">×</span>
                <span className="u">USA</span>
              </div>
              <div className="cal-stat">
                <b>48 TEAMS · 104 MATCHES</b>
                16 host cities · 39 days
              </div>
            </div>
          </div>

          {/* Day-of-week header */}
          <div className="cal-dow-row">
            {DOWS.map((d, i) => (
              <div key={d} className={`cal-dow${i === 0 || i === 6 ? ' we' : ''}`}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="cal-grid">
            {calDays.map(d => {
              const inT = d >= T_START && d <= T_END;
              const we = d.getDay() === 0 || d.getDay() === 6;
              const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
              const dayMatches = byDate.get(key) ?? [];
              const isFirst = d.getDate() === 1 || (d.getMonth() === 5 && d.getDate() === 11);

              let cls = 'cal-cell';
              if (we) cls += ' we';
              if (!inT) cls += ' empty';
              else if (!dayMatches.length) cls += ' rest';

              return (
                <div key={key} className={cls}>
                  <div className="cal-cell-hd">
                    <span className="cal-dnum">{d.getDate()}</span>
                    {inT && isFirst && (
                      <span className="cal-dmon">{d.toLocaleDateString([], { month: 'short' })}</span>
                    )}
                    {inT && !dayMatches.length && <span className="cal-rest">Rest day</span>}
                  </div>
                  {dayMatches.length > 0 && (
                    <div className="cal-mlist">
                      {dayMatches.map(m => {
                        const ko = m.seasonTypeId > 1;
                        const homeIsSeed = isSeedPlaceholder(m.home.abbr);
                        const awayIsSeed = isSeedPlaceholder(m.away.abbr);
                        return (
                          <div key={m.eventId} className={`cal-chip${ko ? ' ko' : ''}`}>
                            {ko && (
                              <div className="cal-chip-stg">{m.stage} · #{m.eventId.slice(-2)}</div>
                            )}
                            <div className="cal-chip-flags">
                              {!homeIsSeed && m.home.logo && <img src={m.home.logo} alt={m.home.abbr} />}
                              {!awayIsSeed && m.away.logo && <img src={m.away.logo} alt={m.away.abbr} />}
                            </div>
                            <div className="cal-chip-teams">
                              {m.home.abbr}<span className="v">v</span>{m.away.abbr}
                            </div>
                            <div className="cal-chip-time">{fmtTime(m.date)}</div>
                            <div className="cal-chip-meta">
                              {ko ? m.venueCity : `GRP ${m.groupLetter} · ${m.venueCity}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer — venues */}
          <div className="cal-foot">
            <h3>The 16 Host Cities</h3>
            <div className="cal-vrow">
              {VENUES.map(v => (
                <div key={v.slug} className="cal-vc">
                  <div>
                    <div className="cal-vc-city">{v.city}</div>
                    <div className="cal-vc-stad">{v.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/print/looks/Calendar.tsx
git commit -m "Add Calendar look (Look C) for /print"
```

---

## Task 6: PrintClient — look switcher + print button

**Files:**
- Create: `src/app/print/PrintClient.tsx`

- [ ] **Create PrintClient.tsx**

```tsx
// src/app/print/PrintClient.tsx
'use client';

import { useState } from 'react';
import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { Editorial } from './looks/Editorial';
import { WallChart } from './looks/WallChart';
import { Calendar } from './looks/Calendar';
import './print.css';

type Look = 'editorial' | 'wallchart' | 'calendar';

const LOOKS: { id: Look; label: string }[] = [
  { id: 'wallchart', label: 'Wall Chart' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'calendar',  label: 'Calendar'  },
];

interface Props {
  matches: WorldCupMatchNormalized[];
}

export function PrintClient({ matches }: Props) {
  const [look, setLook] = useState<Look>('editorial');

  function handlePrint() {
    document.body.className = `look-${look}`;
    window.print();
    document.body.className = '';
  }

  return (
    <>
      {/* Print chrome — hidden on print via @media print */}
      <div className="print-chrome">
        <div className="print-chrome-title">
          <h1>Schedule</h1>
          <p>2026 FIFA World Cup · 104 matches · all times in your local timezone</p>
        </div>
        <div className="print-switcher" role="group" aria-label="Schedule look">
          {LOOKS.map(({ id, label }) => (
            <button
              key={id}
              className={`print-switcher-btn${look === id ? ' active' : ''}`}
              onClick={() => setLook(id)}
              aria-pressed={look === id}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="print-btn" onClick={handlePrint}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print / Save PDF
        </button>
      </div>

      {/* Active look */}
      {look === 'editorial'  && <Editorial matches={matches} />}
      {look === 'wallchart'  && <WallChart  matches={matches} />}
      {look === 'calendar'   && <Calendar   matches={matches} />}
    </>
  );
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/print/PrintClient.tsx
git commit -m "Add PrintClient — look switcher and print button for /print"
```

---

## Task 7: Server page + Nav link

**Files:**
- Create: `src/app/print/page.tsx`
- Modify: `src/components/Nav.tsx`

- [ ] **Create page.tsx**

```tsx
// src/app/print/page.tsx
import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { Nav } from '@/components/Nav';
import { PrintClient } from './PrintClient';

export const revalidate = 300;

export const metadata = {
  title: 'Print Schedule',
  description: 'Printable 2026 FIFA World Cup schedule — wall chart, editorial, and calendar views.',
};

export default async function PrintPage() {
  const { matches } = await fetchAllMatches();
  return (
    <>
      <Nav activePath="/print" />
      <PrintClient matches={matches} />
    </>
  );
}
```

- [ ] **Add Print link to Nav** — open `src/components/Nav.tsx`, find the links array and add a Print entry. Look for the pattern where existing links like `/schedule`, `/groups`, `/bracket` are defined and add:

```ts
{ href: '/print', label: 'Print' }
```

in the same array.

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Start dev server and open http://localhost:3000/print**

```bash
npm run dev
```

Check:
- Editorial look renders with correct newspaper layout
- Wall Chart tab switches to dark poster look
- Calendar tab switches to month grid
- Print button triggers browser print dialog
- Times show in local timezone

- [ ] **Commit**

```bash
git add src/app/print/page.tsx src/components/Nav.tsx
git commit -m "Add /print route and Nav link"
```

---

## Task 8: Visual polish pass

This task is done in the browser on dev. No code targets upfront — fix whatever looks wrong.

- [ ] **Check Editorial look**
  - Masthead typography renders correctly (Archivo 900)
  - 3-column day flow doesn't overflow
  - Completed match scores show in accent color
  - Knockout rows show seed labels or real teams depending on ESPN data
  - IBM Plex Mono loads for times/meta

- [ ] **Check Wall Chart look**
  - Poster scales to fit viewport correctly
  - Venue rows align with date columns
  - Match chips readable at scaled size
  - Host-country row tints visible (US blue / MX green / CA red)
  - Stage band spans correct date range

- [ ] **Check Calendar look**
  - Poster scales to fit viewport correctly
  - All 7 weeks render (Jun 7 → Jul 25)
  - Match chips stack correctly in busy days
  - Out-of-tournament days have hatch pattern
  - Rest days tagged

- [ ] **Test print dialog** — Cmd+P or Print button:
  - Editorial: US Letter portrait, no chrome visible
  - Wall Chart: A3 landscape
  - Calendar: A2 portrait
  - Background colors print (check browser print preview)

- [ ] **Commit any fixes**

```bash
git add -p
git commit -m "Visual polish for /print looks"
```

---

## Self-Review

**Spec coverage:**
- ✅ `/print` route — Task 7
- ✅ Server component fetches `fetchAllMatches()` — Task 7
- ✅ `PrintClient` with look switcher — Task 6
- ✅ Editorial look (default) — Task 3
- ✅ Wall Chart look — Task 4
- ✅ Calendar look — Task 5
- ✅ Shared helpers (time, grouping, seed detection) — Task 1
- ✅ Print CSS + `@page` rules per look — Task 2
- ✅ Print button → `window.print()` — Task 6
- ✅ `body.className` set before print for `@page` scoping — Task 6
- ✅ Nav link — Task 7
- ✅ `revalidate = 300` — Task 7
- ✅ Local timezone via `toLocaleTimeString` in client components — Tasks 1, 3, 4, 5
- ✅ Seed placeholder detection — Task 1, used in 3, 4, 5
- ✅ Scores on completed matches — Task 1 (`fmtScore`), Task 3 (Editorial)
- ✅ Venue footer in Editorial — Task 3
- ✅ Venue footer in Calendar — Task 5

**No placeholders found.**

**Type consistency:** `WorldCupMatchNormalized` used consistently throughout. `VENUES` from `@/lib/venues` used in Tasks 3, 4, 5. `isSeedPlaceholder`, `fmtTime`, `groupByLocalDate`, `fmtScore` all defined in Task 1 and imported in Tasks 3–5.
