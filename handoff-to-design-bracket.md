# Code → Design Handoff
**Project:** everyfouryears.futbol — 2026 FIFA World Cup  
**From:** Claude Code · **Date:** June 3, 2026  
**This pass:** `/bracket` complete + bracket wired to live data + site status

---

## What just shipped

### `/bracket` — full implementation
- **Full bracket view** — symmetric bracket with SVG connector lines. Hover any team to trace its path; confirmed ties highlight solid, future slots dashed. Everything else fades.
- **Trace dropdown** — filters to still-alive teams only.
- **USA path toggle** — auto-highlights USA's route with a corner check-dot on each confirmed tie.
- **By-round view** — round tabs + large match cards with flag, score, venue, broadcaster. Final tab also shows third-place card.
- **Four tie states**: `post` (winner green-ticked, loser dimmed), `in` (live border + pulse + clock), `pre` (teams known, kickoff time), `tbd` (dashed card, source labels like "Group A 2nd Place").
- **Wired to live ESPN data** — all 31 knockout slots pull from ESPN's pre-assigned event IDs. Teams show as TBD pre-tournament and fill in automatically as group results land.

One known gap: clicking a played tie doesn't navigate to the match page yet — will be `/match/{event_id}` once we wire the bracket event IDs through.

### Normalizer fix (silent but important)
The `seasonTypeId` field (used by schedule filters, the homepage phase detection, and the bracket) was always returning 1 (Group Stage) for knockout matches due to a bug reading the wrong ESPN field. Fixed — knockout matches now correctly classify as R32/R16/QF/SF/Final.

---

## A note on CSS going forward

The prototype's pattern of one big CSS file worked for the prototype. The codebase is moving to co-located per-feature CSS — `bracket.css` next to bracket, `stats.css` next to stats, etc. `globals.css` stays lean: tokens + resets + shared utilities only.

**Nothing changes for your handoff files** — keep shipping separate CSS files in `hifi/`. We import them at the right level on the code side.

---

## Current page inventory

| Route | Status |
|---|---|
| `/` | ✅ Live |
| `/schedule` | ✅ Live |
| `/schedule/[date]` | ✅ Live |
| `/groups` | ✅ Live |
| `/groups/[letter]` | ✅ Live |
| `/bracket` | ✅ Live + wired to live ESPN data |
| `/teams` | ✅ Live |
| `/team/[abbr]` | ✅ Live |
| `/team/[abbr]/roster` | ✅ Live |
| `/player/[athleteId]` | ✅ Live |
| `/venues` | ✅ Live |
| `/venue/[slug]` | ✅ Live |
| `/stats` | ✅ Live (mock data — see below) |
| `/match/[eventId]` | ✅ Live |
| `/news` | ❌ Not built — needs design |

---

## What we need next from Design

### `/news` — the last unbuilt page

Only remaining route without a design pass. ESPN news endpoint:

```
GET site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news
```

Each article: `headline`, `description`, `published` timestamp, `images[]`, `links.web.href` (ESPN article URL), `premium` boolean.

Questions to resolve:
1. **Layout** — grid (consistent with By-round/Stats) or single-column feed with hero lead story?
2. **External links** — every article links out to ESPN. External icon? "Read on ESPN" label?
3. **Premium articles** — hide, or show with a lock badge?
4. **Images** — feature them, or keep text-first?

---

## No design needed — code work remaining

- **Stats page mock data** — `/stats` shows entirely invented players and numbers. Needs to be replaced with aggregated ESPN match summary data (walk completed matches, extract goals/assists/cards/saves per player). Scheduled for after news page ships.
- **Match page penalty shootout display** — need to confirm ESPN surfaces shootout results in the scoreboard normalizer.
- **Player club affiliations** — player profiles show position/nationality but not club team (data gap, not a design gap).
- **Bracket → match page links** — clicking a played bracket tie should navigate to `/match/{event_id}`. Simple wire-up once bracket is in use with live match IDs.

---

## Open bracket questions (carry forward)

1. **Penalty-decided ties** — live data leaves `winner: null` on a draw score and will need the summary endpoint to resolve shootout winner. Design: confirm `5–3 pens` in the status foot is the right display.
2. **View/round URL params** — `localStorage` now. Want `?view=Full&round=QF` for shareability?

---

## Branch / repo

Everything on `main`. `handoff-bracket/` folder committed alongside the implementation for reference.
