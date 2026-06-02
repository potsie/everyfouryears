# Match Center + Team + Player — Design Handoff

Hi-fi design prototypes for `/match/{event_id}`, `/team/{abbr}`, `/team/{abbr}/roster`, and `/player/{athlete_id}`, from Claude Design.
**These are references, not production code** — recreate in Next.js + React + Tailwind wired to the ESPN data layer, the same way the homepage / schedule / groups were handed off. Open the four HTML files in a browser to see the intended result.

They extend the existing "broadcast clean" system with **zero new color tokens** — everything reuses `ds.css` vars. Two new page CSS files (`match.css`, `team.css`) carry all the new component styling.

---

## What's in here

**Prototypes (open these):**
- `Match Center Hi-Fi.html` → `/match/{event_id}` — morphs **pre / live / post** (toggle in the Tweaks panel). Worked example: USA 2–1 ENG, Group B, live snapshot at 67' = 1–1.
- `Team Profile Hi-Fi.html` → `/team/{abbr}` — worked example: USA.
- `Team Roster Hi-Fi.html` → `/team/{abbr}/roster` — 26-man squad.
- `Player Profile Hi-Fi.html` → `/player/{athlete_id}` — worked example: Pulisic.

Cross-links work: nav **Teams** → Team Profile → "Full 26-man squad" → Roster → Pulisic's card → Player Profile → "View team" back. Match Center links out to Schedule and the Group B detail page.

**NEW files (the actual deliverable):**
- `hifi/match.css` — match-center component styles: navy scoreline hero, sub-tab strip, center-spine event timeline, team-stat split bars, possession donut, lineup pitch, commentary feed, odds / win-prob / H2H / MOTM panels.
- `hifi/match.jsx` — `/match` structure + the pre/live/post state machine and tab logic (reference only).
- `hifi/match-data.js` — **the most important file for data mapping.** Mirrors the ESPN summary endpoint: `events`, `stats`, `lineups`, `commentary`, `odds`, `prob`, `h2h`, `motm`, embedded `groupB`. Shows every shape the page consumes.
- `hifi/team.css` — team + roster + player component styles: shared navy hero, quick-stat strip, form pills, squad grid cards, headshot placeholder, WC-history timeline, stat tiles, per-90 bars, club-career timeline.
- `hifi/team-data.js` — `window.WCTeam`: `profile`, 26-man `squad`, `groupB`, and a `players` map (Pulisic detail). The data shapes to map from team / roster / athlete endpoints.
- `hifi/team-shared.jsx` — `Shot` (headshot placeholder), `Arrow`, `GroupMini` helpers shared across the three team/player pages.
- `hifi/team-profile.jsx`, `hifi/team-roster.jsx`, `hifi/player.jsx` — page structures (reference only).

**Dependencies (already in your repo — included so the HTML renders):**
- `hifi/ds.css`, `hifi/pages.css`, `hifi/data.js`, `hifi/components.jsx` (Flag, Pulse, GroupTable…), `hifi/page-shell.jsx` (nav + footer), `hifi/tweaks-panel.jsx`.
- `design-system.md` — the authoritative token + type spec (unchanged).

> ⚠️ `page-shell.jsx` here has the **Teams** nav link pointing at `Team Profile Hi-Fi.html`. In production that's `/team/{userOrDefaultTeam}`. Bracket / Venues / Stats are still `#`.

---

## Load order (each HTML)
React → ReactDOM → Babel → `data.js` → `match-data.js` → (`team-data.js`) → `tweaks-panel.jsx` → `components.jsx` → `page-shell.jsx` → page-specific shared/render file. Babel is in-browser (prototype only); precompile for prod.

---

## `/match/{event_id}` — implementation notes

- **Phase is derived from match `state`, not a toggle.** `pre` → preview + probable lineups + odds; `live` → running clock, timeline builds to current minute, live win-prob; `post` → Full Time score, winner emphasis, Player of the Match, highlights/recap. The Tweaks "Phase" control only exists to demo all three.
- **Losing side fades to `opacity: .55`** in the hero post-match (same convention as homepage cards).
- **Event timeline** is a center spine: home events left, away right, with a minute badge on the spine. Goals get the green tint + running score badge. A Half-Time / Full-Time marker spans full width. `events[]` carry `at` (minute), optional `extra` (stoppage), `team`, `type` (`goal|pen|yellow|red|sub|whistle`), `player`, `detail`, `score`.
- **Team stats** render as dual split bars. `pct: true` stats (possession, pass accuracy) split the bar by the raw values; count stats normalize each side to `max(home, away)`. The first stat (possession) also drives the donut header (CSS `conic-gradient`).
- **Lineups** draw a formation pitch from `lines[]` (GK→FWD); dots are positioned by line index (y) and spread across width (x). Bench list + coach below. For `pre`, header reads "Probable lineups".
- **Right shelf** swaps the top panel by phase (Win probability/odds for pre+live, Player of the Match for post); H2H, Group B, and Where-to-watch/Highlights persist.
- Odds shown are DraftKings moneyline + O/U, matching the ESPN odds block.

## `/team` · `/team/roster` · `/player` — implementation notes

- **Shared navy hero** (`.th`) across team + player: grain overlay, back link, a ranking/value pill, the identity block, and a quick-stat strip. *The hero header uses CSS **grid** (`auto 1fr`), not flexbox — keep it that way; it's both cleaner and renders correctly in static capture tooling.*
- **Headshots are placeholders.** `Shot` renders a striped circle with player initials + a jersey-number badge. In production, drop the ESPN athlete headshot image in as the background/`<img>` — the circle, number badge, and sizing are already specified. Same component is reused at 50px (roster), 58px (key players), 88px (player hero, `dark` variant).
- **Roster** groups by position (GK/DEF/MID/FWD) with a By-position / By-number toggle. Cards link to `/player/{id}` when an athlete id exists.
- **Player page**: tournament stat tiles, per-90 mini-bars (normalized against per-metric reference maxes in `P90_REF` — swap for real maxes/percentiles if you have them), and a vertical club-career timeline with a live dot on the current club.
- Row-tint + advance/best-third conventions in the embedded Group B table are unchanged from the homepage.

## Cross-cutting
- **No new color tokens.** Every new style references existing `ds.css` vars. The only new visual primitives are the **pitch** (green stripes), **headshot placeholder** (neutral stripes), and **split stat bars** — all built from tokens.
- **Tabular numerals** (`.tnum`) on every stat, score, minute, age, and table number.
- **Tweaks panels are prototype-only** (accent / density review affordance, plus match Phase) — ignore for production.
- Responsive breakpoints match the rest of the site (cols stack < 980px; hero scoreline + tiles reflow < 620/520px).
