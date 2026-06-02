# Coding Handoff → Claude Design
**Project:** everyfouryears.futbol — 2026 FIFA World Cup  
**Date:** June 2, 2026  
**Stack:** Next.js 16 · React 19 · Tailwind 4 · ESPN API (live data)

---

## What's built and live

### Previous sessions (unchanged)

**`/`** — Homepage. Three-phase hero (pre-tournament countdown → live match marquee → knockout ties). Date rail, match cards, group standings shelf, live stats drawer.

**`/schedule`** and **`/schedule/[date]`** — 104-match list. Sticky filter bar, compact match rows, live clock.

**`/groups`** — 12-group wall. Standings tables, advance/best-third row tints.

**`/groups/[letter]`** — Group detail. Navy hero, standings, fixtures by matchday.

---

### This session — match center + team + player

**`/match/[eventId]`**  
Full match center. Morphs across three states driven by ESPN `status.type.state`:

- **Pre** — "VS" hero, probable lineups pitch, match preview text, odds panel in shelf, where to watch
- **Live** — running clock in hero, timeline builds event by event, live win probability, real-time stats
- **Post** — final score with loser faded to 55% opacity, "WINNER" tag, Player of the Match in shelf, Full Time marker in timeline

Four sticky tabs:
- **Summary** — key events timeline (center spine, home left / away right, goals tinted green with running score badge) + match stats card (possession donut + first 5 stats) + MOTM post-match
- **Stats** — full 11-stat split bars (possession, shots, saves, corners, fouls, offsides, passes, pass %, yellow/red cards). Possession donut header.
- **Lineups** — formation pitch (green stripes, aspect-ratio 5/7). Player dots positioned by line/column index. Bench list below each side.
- **Commentary** — minute-by-minute feed, key events highlighted

Shelf (right column): Win prob tricolor bar + DraftKings odds → swaps to MOTM post-match · Head-to-head panel (W-D-L track + last 4 games) · Group table mini · Where to watch / highlights

**`/teams`**  
48-team listing, grouped by confederation (UEFA / CONMEBOL / CONCACAF / CAF / AFC / OFC), sorted by FIFA rank. Each card: flag, abbreviation, rank. Links to team profile.

**`/team/[abbr]`**  
Team profile. Navy hero (flag 64px, team name h1, confederation · coach subline, quick-stat strip: world rank / group position / played / pts / WC appearances). Two-column layout:
- Main: "At the 2026 World Cup" card (group mini table + next match strip) · Recent form (last 5: W/D/L pill, score, opponent) · Squad preview (6 players, links to full roster)
- Shelf: Quick facts panel (confederation, coach, FIFA rank)

**`/team/[abbr]/roster`**  
26-man squad. Header with team name, confederation, coach. Toggle: By position (GK / DEF / MID / FWD sections) · By number. Player cards (`.pcard`): headshot circle with initials fallback, name, position code, age, height. Links to `/player/[athleteId]`.

**`/player/[athleteId]`**  
Player profile. Same navy `.th` hero pattern as team, with a larger headshot circle (88px, dark variant). Identity grid: headshot + number/team eyebrow, name h1, position/club/team chips. Quick-stat strip: age, height, nation, weight. Shelf: navy team card linking back to team profile · Quick facts panel.

---

## Data gaps to note — affects design decisions

These fields are **not currently populated** in the static data files. Calling them out so design can decide whether to show/hide vs. placeholder:

| Field | Page(s) affected | Status |
|---|---|---|
| **Jersey number** | Roster cards, player hero | Not in roster JSON — shown as "—" |
| **Club team** | Roster cards, player profile | Not in roster JSON — position shown instead |
| **Head coach** | Team profile hero, quick facts | `null` in `teams-supplemental.json` — shown as "—" |
| **WC history** (past appearances/results) | Team profile shelf | `null` in `teams-supplemental.json` — panel hidden |
| **Tournament stats per player** (goals, assists, rating) | Player profile, team "key players" | Empty-state placeholder — will populate as matches are played |
| **Per-90 mini-bars** | Player profile | Deferred — needs aggregated match stats |

The jersey number and club gaps are the most visible. If Design wants to spec them, data sourcing would be a separate engineering task (club affiliations require a separate scrape or manual curation; jersey numbers come from match-day ESPN lineup data once squads are named).

---

## Needs design — skeleton exists

**`/bracket`**  
A `BracketColumn` component renders knockout matches in columns (R32 → R16 → QF → SF → Final) with real ESPN data. No visual design — just unstyled rows. Needs: connected match cards, winner progression lines, round labels, pre-tournament seed labels ("Winner Group A"), responsive collapse on mobile.

---

## Not yet built

| Route | Notes |
|---|---|
| `/venues` | 16-venue overview. `data/venues.json` has: capacity, lat/lng, roof type (open/retractable/fixed), surface, transit notes, match count. Consider: map + card grid, roof-type callout (several NFL venues installing temporary grass), matches-hosted count. |
| `/venue/[slug]` | Venue detail. Same JSON + Open-Meteo weather widget (free, no key). Leaflet map. Full match list for that venue. |
| `/stats` | Tournament leaderboard. Needs post-match aggregation job: Golden Boot (goals per player), assists, yellow/red cards, clean sheets, saves. No ESPN endpoint for this — must aggregate from per-match summaries. |
| `/news` | ESPN news feed. `site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news` returns headlines, description, publish date, images, ESPN link. |

---

## Design system

All tokens and component CSS are in `src/app/globals.css`. No new color tokens were introduced — every new component reuses existing vars.

**New CSS sections added this session (at the bottom of globals.css):**
- `/* ── Match Center */` — `.mh`, `.mtabs`, `.tl`, `.sbar`, `.poss`, `.pitch`, `.dot`, `.cmt`, `.prob-bar`, `.odds-grid`, `.h2h-*`, `.motm`, `.watch-*`
- `/* ── Team / Roster / Player */` — `.th`, `.th-strip`, `.form-strip`, `.pcard`, `.shot`, `.tiles`, `.p90`, `.career`, `.wc-hist`, `.fact-row`, `.tl-leader`

**New shared components:**
- `src/components/Shot.tsx` — headshot placeholder circle (striped, initials + jersey badge). Props: `size`, `num?`, `name`, `headshotUrl?`, `dark?`. In production: pass `headshotUrl` to swap in the real ESPN CDN image — layout doesn't change.
- `src/components/GroupMini.tsx` — compact 4-row group standings table for shelf panels.

**Hi-fi references for pages built this session:**
- `handoff-team-player/Match Center Hi-Fi.html` — open in browser to see the match center
- `handoff-team-player/Team Profile Hi-Fi.html`
- `handoff-team-player/Team Roster Hi-Fi.html`
- `handoff-team-player/Player Profile Hi-Fi.html`

---

## Priority suggestion for next design pass

1. **`/bracket`** — needed before Jun 28 when knockout begins. The data layer is ready, just needs the visual.
2. **`/venues`** and **`/venue/[slug]`** — high fan utility pre-tournament; weather + transit info. Data is ready.
3. **`/stats`** — leaderboard page. Needs design + a small backend aggregation job.
4. **`/news`** — simplest page, lowest urgency.
5. **Player stats backfill** — jersey numbers + club affiliations would meaningfully improve team/player pages if Design wants to spec them.
