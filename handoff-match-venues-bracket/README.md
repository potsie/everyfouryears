# Coding Handoff → Claude Design
**Project:** everyfouryears.futbol — 2026 FIFA World Cup  
**Date:** June 2, 2026  
**Stack:** Next.js 16 · React 19 · Tailwind 4 · ESPN API (live data)

---

## What's built and live

**`/` — Homepage**  
Three-phase hero (pre-tournament countdown → live match marquee → knockout ties). Date rail, match cards, group standings shelf, live stats drawer. Full ESPN data. Fully implemented.

**`/schedule`**  
104-match list grouped by day. Sticky filter bar: All / Group Stage / Knockout stage selector, group dropdown (A–L), Hide scores toggle, Jump to today. Compact match rows: kickoff time / live clock / FULL TIME, flags, score box, venue + city, TV badge. Responsive (meta column hides on mobile, TV badge hides at 520px). `/schedule/2026-06-11` (single-day variant) also works.

**`/groups`**  
12-group wall in a responsive grid. Each card: group letter header, fuller standings table (Pl W D L GD Pts), advance/best-third row tints, link to group detail.

**`/groups/[letter]`**  
Navy hero with group letter + 4 team flags. A–L group switcher. Wide standings table (Pl W D L GF GA GD Form Pts). Fixtures grouped by Matchday 1/2/3 with dates. Qualification note updates dynamically once matches are played.

---

## Skeleton only — needs design

**`/bracket`**  
A `BracketColumn` stub exists and renders knockout matches in columns (R32 → R16 → QF → SF → Final). No visual design — just unstyled data. Needs the full bracket visualization: connected match cards, winner progression lines, seed labels pre-tournament, scores post-match.

---

## Not yet built

| Route | Notes |
|---|---|
| `/match/{event_id}` | Match center — the richest page. ESPN summary endpoint has: key events timeline (goals/cards/subs), full box score (28 team stats), rosters, commentary, odds, head-to-head, highlight video links, related news. |
| `/team/{abbreviation}` | Team profile — FIFA ranking, confederation, WC history, head coach, next match. Links to roster. |
| `/team/{abbreviation}/roster` | 26-man squad with position, club, age, headshot. |
| `/player/{athlete_id}` | Player profile — headshot, position, club, stats, tournament appearances. |
| `/venues` | 16-venue overview — map + cards showing capacity, roof type, city, matches hosted. |
| `/venue/{slug}` | Venue detail — transit, weather widget, surface, map, full match list. |
| `/stats` | Tournament leaders — Golden Boot, assists, clean sheets, saves. Aggregated from completed match summaries. |
| `/news` | ESPN news feed — headlines, images, publish dates. |

---

## Design system reference

- **Tokens/CSS:** `src/app/globals.css` (all vars + component classes)
- **Homepage hi-fi:** `handoff/reference/hifi/` (original prototype)
- **Schedule + Groups hi-fi:** `handoff-schedule-groups/` (drove this session's implementation)
- **Typography:** Plain Archivo, no width axis. Display = 600/700/800 weight, UI = 400–700.
- **Color tokens:** Navy `#0a2240`, live green `#16a34a`, page bg `#eef1f6`, surface `#ffffff`

---

## Priority suggestion for next design pass

1. `/match/{event_id}` — most data-rich, most visited during the tournament
2. `/bracket` — needed before Jun 28 when knockout starts
3. `/venues` + `/venue/{slug}` — practical fan utility pre-tournament
4. `/team` + `/stats` — supporting pages, lower urgency

---

## Data available per page (for design context)

**`/match/{event_id}` — ESPN summary endpoint returns:**
- Key events timeline: goals, cards, substitutions (minute + player + assist)
- Team stats: possession, shots, shots on target, passes, tackles, corners, fouls, offsides (28 fields)
- Full match-day rosters (26 players each, with jersey #, position, starter flag)
- Minute-by-minute commentary text
- Odds (DraftKings moneylines, spread, over/under)
- Head-to-head recent results
- Highlight video clips (post-match)
- Match recap article (post-match)
- Embedded group standings

**`/venues` — Static JSON (`data/venues.json`) has:**
- Capacity, lat/lng, roof type (open/retractable/fixed), surface
- Nearest transit, parking notes
- ESPN venue ID, match count

**`/stats` — Aggregated from completed match summaries:**
- Golden Boot (goals per player across all matches)
- Assists leader, yellow/red card counts
- Clean sheets per goalkeeper, saves leader
- Built as a post-match-day aggregation job
