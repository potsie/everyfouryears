---
name: design-system
description: "everyfouryears.futbol — design tokens, typography, component patterns, and hi-fi spec location"
metadata: 
  node_type: memory
  type: project
  originSessionId: 8923a119-75af-48b0-bd3f-547c1a58763d
---

## Authoritative design references

- **Hi-fi spec:** `/handoff/README.md` — complete layout, interaction, and token spec for the homepage. Authoritative for design intent.
- **Design tokens (CSS):** `/handoff/reference/hifi/ds.css` — the original prototype CSS. All tokens ported to `src/app/globals.css`.
- **Prototype components:** `/handoff/reference/hifi/components.jsx` — prototype vocab (not production code, reference only)
- **Mock data shapes:** `/handoff/reference/hifi/data.js` — shows expected data shapes, team/flag map
- **Screenshots:** `/handoff/screens/` — 4 PNGs: 01-live, 02-pre, 03-knockout, 04-dense-all12

## Design aesthetic

"Broadcast clean" — deep navy, crisp white, vivid live-green. Light background (`#eef1f6`), navy hero, not a dark/broadcast theme throughout. The `agent_handoff.md` in `/handoff/` describes an older, darker "broadcast" concept — **it is NOT authoritative**. The `/handoff/README.md` is.

## Color tokens

```css
--navy: #0a2240      /* hero bg, nav brand mark, My Team card */
--navy-700: #13335c
--navy-600: #234a78
--ink: #0b1d33       /* body text */
--ink-2: #4a5a6e     /* secondary text */
--ink-3: #7d8b9c     /* muted / labels */
--bg: #eef1f6        /* page background */
--surface: #ffffff   /* cards */
--inset: #f1f4f9     /* card headers, chips, hover states */
--line: #e2e8f1      /* borders */
--line-2: #d4dbe6
--live: #16a34a      /* live green — pulse dot, active accents */
--live-ink: #0b7a37  /* live text on light bg */
--live-soft: #e6f6ec /* live background tint */
--danger: #e0464b    /* elimination, knockout day numbers in date rail */
--advance: #eaf7ef   /* advancing team row tint (group table) */
--best3: #fff7e6     /* best-third contention row tint */
--accent: #0a2240    /* tweakable — defaults to navy */
```

## Typography

- **Display font:** Archivo at **normal width** (weights 600/700/800). Use for: scores, big numbers, team codes, section headers, group table headers.
  - ⚠️ **Updated direction:** do NOT use the 125% width axis / Archivo Expanded. Per design review, plain Archivo reads cleaner at these sizes. Drop `font-stretch: 125%` from `.font-display` and stop loading the `wdth` axis — display and UI share one Archivo family, differentiated only by weight.
- **UI font:** Archivo (weights 400–700). Set globally on `<body>`.
- **Tabular numerals:** `.tnum` class applies `font-variant-numeric: tabular-nums`. Use wherever numbers align vertically.
- Loaded via `next/font/google` as a single Archivo request (no `axes: ['wdth']`), no FOUT.

### Type scale (px)
```
nav brand: 16 (display)     section h2: 19 (display)
nav links: 13.5             eyebrow/labels: 11
hero kicker: 12             countdown number: 34 (display)
marquee score: 26 (display) card team code: 17 (display)
card country name: 12       card score: 24 (display)
scorers: 12                 group table: 13
group header: 10            leader name: 14
leader value: 20 (display)  panel title: 14 (display)
my team code: 22 (display)
```

## Radii / Shadow / Layout

```
--r-lg: 20px   (hero, page-level containers)
--r-md: 14px   (match cards, panels, my team card)
--r-sm: 10px   (date pills, date rail nav buttons)
--r-xs: 8px    (nav links hover, buttons)

--sh-1: 0 1px 2px rgba(11,29,51,.05), 0 2px 8px rgba(11,29,51,.05)   (cards)
--sh-2: 0 2px 4px rgba(11,29,51,.06), 0 10px 30px rgba(11,29,51,.08) (hero, hover lift)

Page container: max-width 1240px, padding 0 24px (mobile: 0 14px)
Body columns: 1fr / 340px, gap 26px (stacks below 980px)
Match cards gap: 13px
Shelf stack gap: 22px
```

## Component patterns

**Flag component:** `<Flag logo={url} abbr="USA" size={32} />`. Shows ESPN CDN logo image; falls back to a navy-tinted monogram chip with 3-letter code on image error. All flag sources come from the normalized match/team data (ESPN CDN URLs already in API response).

**Match card states:**
- Pre: `–` instead of scores, kickoff time in header status
- Live: green pulse dot + clock in header, full opacity on both teams
- Post: "FULL TIME" in header, winning team full opacity, losing team at 0.62 opacity
- Cards show scorer lines when `home.goals` or `away.goals` are populated

**Hero phases** (derived from today's date vs tournament calendar, NOT selected date):
- `pre`: before 2026-06-11 — countdown + opening match card
- `live`: 2026-06-11 through 2026-06-27 (group stage) — live match tiles marquee
- `knockout`: 2026-06-28+ — knockout tie cards

**Group table row colors:**
- `status === 'advancing'` → `background: var(--advance)`, rank in `--live-ink`
- `status === 'bubble'` → `background: var(--best3)`
- User's team → `box-shadow: inset 3px 0 0 var(--accent)`

**Date rail:** Knockout-phase days (Jun 28+) show day number in `--danger` red. Active pill gets `--accent` background.
