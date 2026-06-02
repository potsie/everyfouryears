# Handoff: everyfouryears.futbol — Homepage

## Overview
This package specifies the **homepage** for everyfouryears.futbol, the 2026 FIFA Men's World Cup data hub. The homepage is the tournament's front door: a score-first hero that morphs across the tournament lifecycle (pre-tournament → live matchday → knockout), a clickable date rail, a grid of match cards for the selected day, and a "data shelf" (My Team, group standings, stat leaders) that can expand from a curated few groups to all twelve.

The design is the product of a wireframe exploration that settled on a **"Hybrid"** direction — a Broadcast-style score-first hero on top of curated, Almanac-style data below.

## About the Design Files
The files in `reference/` are **design references created in HTML/React-via-Babel** — prototypes that demonstrate the intended look, layout, and behavior. **They are not production code to copy directly.**

Your task is to **recreate these designs in the project's real environment** — per the project's `CLAUDE.md`, that is **Next.js 16 + React 19 + Tailwind 4**, using the ESPN API data layer (and the patterns borrowed from the boxscores sister project). Port the markup and visual tokens below into real React components wired to live data. Do **not** ship the Babel/CDN prototype.

The prototype uses an inline **Tweaks panel** (`hifi/tweaks-panel.jsx`) to toggle phase/density/accent for design review. **That panel is a prototyping affordance, not a product feature** — ignore it in implementation. The underlying *states* it toggles (phase, density) ARE real and described below.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and interactions are specified. Recreate the UI pixel-faithfully using the codebase's libraries (Tailwind 4 tokens / CSS variables). Exact values are in **Design Tokens** below and in `reference/hifi/ds.css`.

---

## Screens / Views

This handoff covers **one route: `/` (the homepage / today hub)**. It has three lifecycle *states* (driven by tournament phase, not separate routes) and a density mode.

### Global structure (top → bottom)
1. **Top nav** (sticky)
2. **Hero** (morphs by phase)
3. **Date rail** (horizontal scroll)
4. **"Today" section header**
5. **Two-column body**: match cards (left, fluid) + data shelf (right, fixed 340px)
6. **All-12-groups section** (full width, conditional)
7. **Footer note**

Page container: `max-width: 1240px; margin: 0 auto; padding: 0 24px 96px` (mobile: `0 14px 72px`). Page background `#eef1f6`.

---

### 1. Top Nav
- **Layout**: sticky top, full-bleed white-translucent bar (`rgba(255,255,255,.86)` + `backdrop-filter: blur(12px)`), 1px bottom border `#e2e8f1`. Inner row `max-width 1240`, `height 60px`, `display:flex; align-items:center; gap:26px`.
- **Brand** (left): a 26×26 rounded-7px navy tile with a ⚽ glyph, then wordmark `everyfouryears.futbol` in Archivo Expanded 700, 16px, navy `#0a2240`; the `.` between words is live-green `#16a34a`.
- **Nav links**: `Today (active) · Schedule · Groups · Bracket · Teams · Venues · Stats`. Archivo 600, 13.5px, color `#4a5a6e`; hover/active get `#f1f4f9` bg, 8px radius, ink color. **Hidden below 880px.**
- **Tools** (right): a ghost search icon button (hidden < 760px) and a primary **★ My Team** button (navy fill `#0a2240`, white text, 9px radius, 8px 13px padding).

### 2. Hero (morphs by phase)
Shared shell: navy `#0a2240` block, radius 20px, `box-shadow` = `--sh-2`, margin `20px 0 26px`, inner padding `26px 28px` (mobile `18px 16px`). A non-interactive "grain" overlay layers two radial gradients (subtle white top-right, subtle green `rgba(22,163,74,.16)` bottom-left). Top row: an uppercase kicker (Archivo 700, 12px, letter-spacing .14em, `rgba(255,255,255,.62)`) on the left, a faint link on the right.

- **State A — Live matchday** (default): kicker `● N matches live now` (green pulse dot). Below, a **marquee**: `grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:12px` of live-match tiles. Each tile (`rgba(255,255,255,.06)` bg, 1px `rgba(255,255,255,.12)` border, radius 14px): top meta row (`GROUP X` / clock or `FT`), then two team rows — flag (24px) + code (Archivo Expanded 700, 16px) on the left, score (Archivo Expanded 800, 26px) on the right. The trailing/losing team's row dims to `opacity .55`.
- **State B — Pre-tournament**: kicker `Kicks off in`. Body is a flex row: a **countdown** (four navy-tinted cells, each Archivo Expanded 800 34px number + 10px uppercase label, ticking every second) and an **opening-match card** (label "OPENING MATCH", the two teams with flags, kickoff datetime + TV network).
- **State C — Knockout**: kicker `● Round of 16 · Today`. Body is a flex-wrap row of **tie cards** (`min-width 210px`): two team rows (flag + code), winner's code in light-green `#7ee2a8` with their score; footer line `When · Venue`.

### 3. Date Rail
- **Layout**: a left chevron button, a horizontally-scrolling track (`overflow-x:auto`, hidden scrollbar, `gap:7px`), a right chevron button. Chevrons scroll the track ±240px.
- **Day pill**: white card, 1px border `#e2e8f1`, radius 10px, padding `8px 13px`, min-width 58px, centered. Contents: weekday (10px 700, uppercase, `#7d8b9c`), day number (Archivo Expanded 700, 18px), match-count caption (10px 600, `#7d8b9c`). 
- **Active** pill: filled with `--accent` (default navy), white text. **Knockout-phase** days: day number rendered in danger red `#e0464b` (white when active).
- The active day auto-centers on load.

### 4. "Today" Section Header
- `display:flex; align-items:center; justify-content:space-between`. Left: h2 (Archivo Expanded 700, 19px) reading the section label + a lighter `· Wednesday, June 17` subtitle (Archivo 600, 14px, `#7d8b9c`). Right: an eyebrow `N matches · M live` (11px 700 uppercase, `#7d8b9c`). Both sides `white-space:nowrap`.
- Section label by phase: Live → "Today", Pre → "Opening Fixtures", Knockout → "Round of 16 · Today".

### 5. Body — Match Cards (left column)
- **Grid**: `repeat(auto)` two-up — prototype uses `.cards.c2 { grid-template-columns:1fr 1fr; gap:13px }`, collapsing to one column below 620px.
- **Match card**: white surface, 1px border `#e2e8f1`, radius 14px, `--sh-1`, hover lifts (`translateY(-1px)`, `--sh-2`).
  - **Header bar** (`#f1f4f9` bg, 1px bottom border): left `GROUP X` (11.5px 700, `#4a5a6e`); right status — live: green pulse + clock (e.g. `67'`); post: `FULL TIME` (`#7d8b9c`); pre: kickoff time.
  - **Body**: two team rows. Each: flag (32px) + name block (code in Archivo Expanded 700 17px, full country name beneath in Archivo 600 12px `#7d8b9c`) + score (Archivo Expanded 800 24px). Losing team dims to `opacity .62`. Pre-match shows an `–` placeholder instead of a score.
  - **Scorers** (optional, when goals exist): list of `⚽ 23' Pulisic · USA` lines, 12px, `#4a5a6e`, scorer name in ink 600; `(pen)` muted.
  - **Footer** (1px top border): venue with a pin icon `📍 Lumen Field · Seattle` (12px `#4a5a6e`) + a TV chip (`#f1f4f9` bg, 1px border, 11px 700, e.g. `FOX`).

### 6. Data Shelf (right column, 340px)
A vertical stack (`gap:22px`):
- **My Team card**: navy gradient (`#0a2240`→`#13335c`), radius 14px. Label `★ MY TEAM` (11px 700 uppercase, `rgba(255,255,255,.6)`); main row: flag (36px) + code (Archivo Expanded 800, 22px) + subtitle `Group B · 1st · 4 pts`; a divided "next match" row `Next · vs SEN` / `Sat · 3:00 PM`. (Conditional on a user having pinned a team — `localStorage`.)
- **Standings panel** (white, radius 14px, `--sh-1`): header `Standings` (Archivo Expanded 700, 14px) + `All 12 groups →` link. Body: **curated** group tables (prototype shows the user's group + two with live action). The link expands the full all-12 section (see #7).
- **Stat Leaders panel**: header `Stat Leaders` + `Full stats →`. A horizontal tab row (`Goals · Assists · Clean sheets · Saves`; active tab `#f1f4f9` bg). Then up to 5 leader rows: rank (Archivo Expanded 800, 15px, `#7d8b9c`), name (14px 600) + flag + country (11.5px `#7d8b9c`), value (Archivo Expanded 800, 20px).

#### Group table (used in shelf AND all-12 grid)
- Title `GROUP X` (Archivo Expanded 700, 13px, `#4a5a6e`, letter-spacing .06em).
- Column header row + four team rows. Grid: `grid-template-columns: 18px 1fr 28px 30px 30px` → `# | Team | GD | Pl | Pts`.
- Row: rank (Archivo Expanded 700, `#7d8b9c`), team (flag 18px + code 600), GD (signed, `#4a5a6e`), played, points (Archivo Expanded 700, ink). All numbers `font-variant-numeric: tabular-nums`.
- **Row backgrounds**: 1st–2nd place → advance tint `#eaf7ef` (rank turns green `#0b7a37`); 3rd → best-third tint `#fff7e6`; the user's team → 3px inset left border in `--accent`.

### 7. All-12-Groups Section (conditional, full width)
- Renders when **Density = Dense** OR the user clicks "All 12 groups →". Section header `Standings · All 12 Groups` + `Collapse ▲`.
- Grid: `repeat(auto-fill, minmax(248px,1fr)); gap:13px` (≈4 columns at desktop width) of 12 group-table cards (A–L).
- Followed by a **legend**: swatches for "Advance to Round of 32" (green), "Best-third contention" (amber), "My team" (accent border).

### 8. Footer Note
1px top border, 12px `#7d8b9c`, space-between: left "Data updates live during matches · all times shown in your local timezone"; right "Where to watch: FOX · FS1 · Telemundo · Peacock".

---

## Interactions & Behavior
- **Phase** (pre / live / knock): swaps the hero content and the "Today" section label. In production this is **derived from the current date vs. the tournament calendar**, not a manual toggle. (Group stage Jun 11–27 → live/pre; Jun 28+ → knockout. See `CLAUDE.md` season-type IDs.)
- **Density** (standard / dense): Standard shows a curated subset of group tables in the shelf with an "All 12 groups →" expander; Dense reveals the full 12-group section by default. Consider persisting the user's preference in `localStorage`.
- **Date rail**: clicking a day selects it (active styling, auto-center). **In the prototype only one matchday is modeled** — in production, selecting a date must **filter the match grid to that day's fixtures without a full reload** (client-side, per `CLAUDE.md`'s SSG + client-update model).
- **Expand/collapse** all-12 groups: smooth-scrolls the section into view on expand.
- **Live**: clock/scores should poll the ESPN scoreboard every 30–60s during live windows; the pulse dot and `67'`-style clock animate. The countdown (pre) ticks every second.
- **Hover**: match cards lift; nav links and pills shift background; everything has a pointer cursor where clickable.
- **Match card / group row / leader** are all intended to be **links** (to `/match/{id}`, `/groups/{x}`, `/player/{id}` per the URL structure in `CLAUDE.md`).

## State Management
- `selectedDate` (string `MM-DD`) — drives the match grid.
- `phase` — derived from `selectedDate`/now vs. tournament calendar.
- `density` — `'standard' | 'dense'`, persisted.
- `showAllGroups` — bool; initialized from density, toggled by the expander.
- `myTeam` — team code from `localStorage` (nullable; hides the My Team card when unset).
- `statCategory` — active leaders tab.
- **Data fetching**: scoreboard (date-filtered, polled live), group standings, aggregated stat leaders, news. See `CLAUDE.md` → "Primary data source: ESPN API" for exact endpoints and caching TTLs.

### Mock → real data mapping
The prototype's `hifi/data.js` mirrors the shapes you'll build from ESPN:
| Prototype shape | Real source (per CLAUDE.md) |
|---|---|
| `today[]` (match: a/b/score/state/minute/venue/tv/scorers) | Site API **scoreboard** `?dates=YYYYMMDD`; `keyEvents` from **summary** for scorers |
| `groups[]` (12 × 4 teams with W/D/L/GF/GA/GD/Pts/rank/status) | Core API **group standings** (`/types/1/groups/{id}/standings/0`); `status` from advancement `note` colors |
| `leaders{}` (Goals/Assists/Clean sheets/Saves) | **Aggregated** from per-match summary stats (no direct endpoint) |
| `dates[]` (day + match count + phase) | Computed from scoreboard across `20260611-20260720` |
| `r16[]` | Scoreboard filtered by season type 3 (R16) |
| `team(code)` → name + flag ISO | Teams endpoint; **flags** see Assets |

## Design Tokens

### Color
```
--navy        #0a2240   (primary dark: hero, nav ink, My Team)
--navy-700    #13335c
--navy-600    #234a78
--ink         #0b1d33   (body text)
--ink-2       #4a5a6e   (secondary text)
--ink-3       #7d8b9c   (muted/labels)
--bg          #eef1f6   (page)
--bg-2        #e6eaf1
--surface     #ffffff   (cards)
--inset       #f1f4f9   (score boxes, chips, hover)
--line        #e2e8f1   (borders)
--line-2      #d4dbe6
--live        #16a34a   (live green; pulse, accents)
--live-ink    #0b7a37   (live text on light)
--live-soft   #e6f6ec
--danger      #e0464b   (elimination, knockout day numbers)
--advance     #eaf7ef   (advancing row tint)
--best3       #fff7e6   (best-third row tint)
--link        #2563eb
--accent      #0a2240   (tweakable: navy default; also offered #16a34a, #2563eb, #d98c0a)
```

### Typography
- **Display**: `Archivo Expanded`, weights 600/700/800 — scores, big numbers, team codes, section/headers.
- **UI/body**: `Archivo`, weights 400/500/600/700 — everything else.
- Tabular numerals everywhere numbers align: `font-variant-numeric: tabular-nums`.
- Scale (px): nav brand 16 · nav links 13.5 · section h2 19 · eyebrow/labels 11 · hero kicker 12 · countdown number 34 · marquee score 26 / code 16 · card team code 17 / full name 12 / score 24 · scorers 12 · group table 13 (header 10) · leader name 14 / value 20 · panel title 14 · My Team code 22.

### Spacing / Radius / Shadow
```
Radii:   --r-lg 20px · --r-md 14px · --r-sm 10px · --r-xs 8px
Shadow:  --sh-1  0 1px 2px rgba(11,29,51,.05), 0 2px 8px rgba(11,29,51,.05)
         --sh-2  0 2px 4px rgba(11,29,51,.06), 0 10px 30px rgba(11,29,51,.08)
Layout:  page max-width 1240, side padding 24 (mobile 14)
         body columns: 1fr / 340px, gap 26 (stacks < 980px)
         match cards gap 13 · shelf stack gap 22
Density "dense" tightens card/row/leader paddings (see ds.css `body.dense`).
```

## Assets
- **Flags**: prototype loads real flags from **flagcdn.com** (`https://flagcdn.com/w80/{iso}.png`, e.g. `us`, `gb-eng`, `gb-sct`, `kr`) with a **monogram chip fallback** (navy-tinted rounded rect with the 3-letter code) on load error. In production, decide between flagcdn, the ESPN country-flag CDN (`CLAUDE.md` documents the path/codes), or self-hosted SVGs — keep the monogram fallback for missing assets. The `code → name → ISO` map is in `hifi/data.js`.
- **Icons**: pin, chevron, star, search are inline SVGs in `hifi/components.jsx`. Replace with the codebase's icon set (e.g. lucide-react).
- **Fonts**: Archivo + Archivo Expanded via Google Fonts (`next/font` in production).
- No raster/image assets beyond flags.

## Files
In `screens/` — **reference screenshots** of the built homepage (HQ PNG):
- `01-live.png` — default Live matchday state (hero marquee).
- `02-pre.png` — Pre-tournament state (countdown + opening match).
- `03-knockout.png` — Knockout state (Round-of-16 hero).
- `04-dense-all12.png` — Dense density: the full 12-group standings wall.

In `reference/`:
- **`Homepage Hi-Fi.html`** — the hi-fi prototype entry point (open this).
  - `hifi/ds.css` — **the design system**: all tokens + component styles. Primary styling reference.
  - `hifi/components.jsx` — component vocabulary: `Flag, Nav, Hero, Countdown, DateRail, MatchCard, TeamRow, GroupTable, LeadersPanel, MyTeamCard`.
  - `hifi/app.jsx` — composition, state wiring, phase/density logic.
  - `hifi/data.js` — mock data + the team/flag map (shows expected data shapes).
  - `hifi/tweaks-panel.jsx` — prototype-only review affordance; **ignore for production**.
- **`Homepage Wireframes.html`** (+ `wf/`) — the earlier low-fi exploration that motivated the layout (Hybrid direction, density concept). Context only.

> The project's existing **`CLAUDE.md`** is the authoritative source for data architecture, ESPN endpoints, caching, routing, and the 16-venue / 48-team reference tables. This handoff is the **UI layer** that sits on top of it.
