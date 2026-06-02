# Schedule + Groups — Design Handoff

Hi-fi design prototypes for `/schedule`, `/groups`, and `/groups/{x}`, from Claude Design.
**These are references, not production code** — recreate in Next.js + React + Tailwind wired to the ESPN data layer, the same way the homepage was handed off. Open the three HTML files in a browser to see intended results.

## What's in here

**Prototypes (open these):**
- `Schedule Hi-Fi.html` → `/schedule` (and `/schedule/{date}` = same layout scoped to one day)
- `Groups Hi-Fi.html` → `/groups`
- `Group Detail Hi-Fi.html` → `/groups/{x}` (reads `?g=A`…`?g=L`)

**NEW files (the actual deliverable):**
- `hifi/pages.css` — new component styles (schedule rows, full group tables, filters, group-detail header). Most directly portable. Uses only existing `ds.css` tokens — no new colors.
- `hifi/schedule.jsx` — `/schedule` structure + filter logic (reference only)
- `hifi/groups.jsx` — `/groups` structure (reference only)
- `hifi/group-detail.jsx` — `/groups/{x}` structure; standings COMPUTED from fixtures in the prototype (use `fetchAllGroupStandings` in prod)
- `hifi/page-shell.jsx` — shared nav (with cross-links) + footer
- `hifi/schedule-data.js` — mock fixture generator; shows the match/standings DATA SHAPES to map from `fetchAllMatches` / `fetchAllGroupStandings`

**Dependencies (already in your repo — included so the HTML renders):**
- `hifi/ds.css`, `hifi/data.js`, `hifi/components.jsx`, `hifi/tweaks-panel.jsx`

## ⚠️ Typography change (applies site-wide)
Drop the Archivo **width axis** — do NOT use `font-stretch: 125%` / "Archivo Expanded" anywhere.
Display and UI share **one plain Archivo family**, differentiated by weight only (display 600/700/800, UI 400–700).
Remove `axes: ['wdth']` from the `next/font/google` load and the `.font-display { font-stretch }` rule.
`design-system.md` (included) is already updated with this corrected direction.

## Implementation notes
- **Calendar is authoritative:** group stage Jun 11–27, knockout starts Jun 28 — no day mixes group + knockout. Final matchday (Jun 23–27) has simultaneous kickoffs.
- Match objects mirror `WorldCupMatchNormalized` (`group`, `stage`, `round`, `state`, `score`, `venue`/`city`, `tv`).
- **Knockout fixtures use schematic seed labels** (`1A`, `3C/E/F`, `W73`) since matchups aren't known pre-tournament — your bracket logic replaces these.
- Row-tint system is unchanged from the homepage: advance = green tint, best-third = amber, "My Team" = accent left-border.
- Tweaks panels are prototype-only (accent/density review affordance) — ignore for production.
