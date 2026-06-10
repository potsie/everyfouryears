# /print — Schedule Print Views

**Date:** 2026-06-09  
**Status:** Approved for implementation

## Overview

A `/print` route offering three visual takes on the full 104-match World Cup schedule, driven by live ESPN data, printable from the browser. Users can switch between looks and hit a Print button to get a PDF or paper copy with current scores and confirmed knockout teams.

## Architecture

### Route structure

```
src/app/print/
  page.tsx          ← server component, fetches ESPN data
  PrintClient.tsx   ← 'use client', owns look state + renders active look
  print.css         ← all print CSS, @page rules, @media print overrides
  looks/
    Editorial.tsx   ← Look B (default)
    WallChart.tsx   ← Look A
    Calendar.tsx    ← Look C
```

### Data flow

1. `page.tsx` calls `fetchAllMatches()` (existing, already used by `/schedule`)
2. Returns `WorldCupMatchNormalized[]` — passed as props to `PrintClient`
3. `PrintClient` groups/formats matches and passes to the active look component
4. No new API routes or data sources needed

### Data source

ESPN pipeline via existing `fetchAllMatches()`. Same data that powers `/schedule`, `/bracket`, `/groups`. Revalidates every 5 minutes (`export const revalidate = 300`).

**Not used:** `worldcup2026.json` from the design handoff (standalone static data — superseded by live ESPN feed).

## UI

### Page chrome

- **Site nav** — existing `<Nav>` component, `activePath="/print"`
- **Print header bar** — full-width, white background, single row containing:
  - Left: page title "Schedule" + subtitle "2026 FIFA World Cup · 104 matches · all times in your local timezone"
  - Center: look switcher tabs — `Wall Chart | Editorial | Calendar`
  - Right: Print button → `window.print()`
- **Look content** — renders below the header, full width

### Look switcher

Three labeled tabs in a pill group (similar to existing toggle patterns on the site). Editorial is the default/pre-selected look. State is local (`useState`), not persisted — intentional, keeps it simple.

### Print button

```tsx
<button onClick={() => window.print()}>
  <PrintIcon /> Print / Save PDF
</button>
```

`@media print` hides the nav, header bar (switcher + print button), and any other site chrome. Only the active look content prints.

## The Three Looks

### Look B — Editorial (default)

- **Canvas:** 816px centered page, `background: #f6f4ee` (warm paper)
- **Layout:** masthead → stage sections → 3-column day-block flow → venue footer
- **Match row:** `time · FLAG CODE v CODE FLAG · badge group · #num · city`
- **Knockout rows:** seed labels until teams confirmed; once ESPN has results, real team codes + flags
- **Scores:** completed matches show final score inline (e.g. `● FINAL: 2–1`)
- **Print:** US Letter portrait, `@page { size: Letter portrait; margin: 0.45in }`

### Look A — Wall Chart

- **Canvas:** 3300×1660px fixed, `transform: scale()` to fit viewport (letterboxed on dark bg)
- **Layout:** venue rows (16) × date columns (weighted — match days full width, rest days ~34%)
- **Header:** month strip → day columns → stage band (Group Stage → R32 → … → Finals)
- **Cells:** match chip per cell (flags + `MEX v RSA` + `GRP A · 3 PM`); KO chips show round + seed
- **Venue column:** 248px wide, left-colored accent by host country (US blue / MX green / CA red)
- **SVG bracket panel:** "Path to the Final" fills empty top-right zone during knockout rounds
- **Print:** A3 landscape, drops `scale()` transform for print

### Look C — Calendar

- **Canvas:** 1400×2160px fixed, `transform: scale()` to fit viewport
- **Layout:** 7-column Sun→Sat grid, 7 week rows (Jun 7 → Jul 25), `grid-auto-rows: 1fr`
- **Day cells:** date number + stack of match chips; out-of-tournament days hatched; rest days tagged
- **Match chips:** group chips (blue left border) and KO chips (red left border)
- **Timezone:** `groupByLocalDate()` logic — matches bucket into the correct calendar day for the visitor's timezone (a late-night ET match shifts to the next day in Europe/Asia)
- **Footer:** 16 host cities grid on dark background
- **Print:** A2 portrait, drops `scale()` transform for print

## Time Formatting

All times use `new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })` inside `PrintClient` (a `'use client'` component), which uses the visitor's browser timezone. No timezone picker — consistent with the rest of the site.

## Knockout Placeholder Handling

ESPN returns placeholder abbreviations for unconfirmed knockout teams (e.g. `"2A"` = runner-up Group A). These are rendered as seed labels rather than flags until real team data is available — same logic already used in `BracketClient`. A helper `isSeedPlaceholder(abbr)` detects these.

## Print CSS

Each look defines its own `@page` size. The `@media print` block:
- Hides: `<Nav>`, print header bar (tabs + button), any non-content chrome
- Removes `transform: scale()` on Wall Chart and Calendar (fixed-canvas looks print at native size)
- Sets `print-color-adjust: exact` so background colors render

## Nav

Add "Print" link to the existing `<Nav>` component, pointing to `/print`.

## Out of scope

- Timezone picker (device timezone is sufficient)
- Live score polling on `/print` (revalidates at build/request time; user can refresh + reprint)
- Saving/exporting to image format (browser PDF covers this)
- Persisting selected look across sessions
