# CLAUDE.md — everyfouryears.futbol

## Project overview

A comprehensive data site for the 2026 FIFA Men's World Cup. 48 teams, 104 matches, 16 venues across the US, Canada, and Mexico. The site is heavy on data — schedules, live scores, rosters, match stats, group standings, knockout brackets, venue guides — and light on editorial opinion. Think of it as the reference desk for the tournament: "just the data, presented well."

**Domain:** everyfouryears.futbol
**Project root:** /Users/potsie/Desktop/repos/everyfouryears

## Tournament structure

- **48 teams** in 12 groups of 4 (Groups A through L)
- **Group stage:** Jun 11–27 (36 match days, 3 matches per group)
- **Round of 32:** Jun 28–Jul 3 (new for 2026 — top 2 per group + best 8 third-place teams)
- **Round of 16:** Jul 4–7
- **Quarterfinals:** Jul 9–11
- **Semifinals:** Jul 14–15
- **Third-place match:** Jul 18
- **Final:** Jul 19
- **104 total matches**
- Season type IDs in ESPN API: 1=Group, 2=R32, 3=R16, 4=QF, 5=SF, 6=Third, 7=Final

## Primary data source: ESPN API

Free, undocumented, unauthenticated JSON endpoints. No API key required. No SLA — be respectful with polling. All responses are `application/json`.

### API tiers

| Tier | Base URL | Use for |
|------|----------|---------|
| **Site API** | `site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/...` | Scoreboard, summary, teams, news. Pre-joined data — ready to render. **Use this first.** |
| **Core API** | `sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/...` | Individual entities: athletes, venues, groups, standings. Returns `$ref` links that must be dereferenced. |
| **CDN** | `cdn.espn.com/core/soccer/scoreboard?xhr=1&league=fifa.world` | Pre-rendered page data bundle. Same score data as Site API but heavier payload. Fallback only. |

### Key endpoints

**Scoreboard (the workhorse)**
```
GET site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
  ?dates=20260611-20260720  // date range, YYYYMMDD format
  &limit=200                // returns all 104 matches
```
Returns: event ID, date (UTC), team names/logos/abbreviations, score, match status (`pre`/`in`/`post`), display clock, venue (name + city), broadcast info (FOX/FS1/Telemundo/Peacock), season type.

**Match summary (the deep one)**
```
GET site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary
  ?event={event_id}         // from scoreboard response
```
Returns (15 top-level keys):
- `boxscore` — 28 team stats (possession, shots, passes, tackles, etc.) + recent form
- `rosters` — full match-day squad with jersey #, position, starter flag, 14 per-player stats
- `keyEvents` — goals, cards, substitutions with minute, player name/ID, and assist
- `commentary` — minute-by-minute text play-by-play
- `odds` / `pickcenter` — DraftKings moneylines, spreads, over/under
- `headToHeadGames` — recent matchup history
- `gameInfo` — venue details
- `broadcasts` — TV/streaming
- `standings` — embedded group table for the relevant group
- `header` — compact match header with score and status
- `news` — related articles
- `article` — match recap (post-match only)
- `videos` — highlight clips (post-match only)
- `leaders` — top performers per team

**Teams list**
```
GET site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams
```
Returns all 48 teams with IDs, abbreviations, logos, ESPN links. Single call.

**Individual team (Core API)**
```
GET sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/teams/{team_id}
```
Returns: team colors, venue $ref, group $ref, athlete roster $ref.

**Athlete roster (Core API)**
```
GET sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/teams/{team_id}/athletes?limit=50
```
Returns $ref links to individual athletes. Typically 26-man squads.

**Individual athlete (Core API)**
```
GET sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/athletes/{athlete_id}
```
Returns: displayName, shortName, position, age, height (inches), weight (lbs), displayHeight, displayWeight, dateOfBirth, citizenship, headshot URL, status.

**Groups**
```
GET sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1/groups
```
Returns 12 group $refs. Dereference each, then dereference `/standings/0` for the full table.

**Group standings**
```
GET sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1/groups/{group_id}/standings/0
```
Returns standings array with team $ref, records with stats: GP, W, D, L, GF, GA, GD, Pts, rank, streak, home/away splits, PPG. Also has `note` with advancement status (color-coded: green = advance, red = eliminated, light green = best-8 contention).

**News**
```
GET site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news
```
Returns articles with headline, description, published date, images, ESPN link, premium flag.

### ESPN CDN asset URLs

All 500×500px transparent PNGs:
- **Country flag:** `a.espncdn.com/i/teamlogos/countries/500/{code}.png`
- **Country flag (dark):** `a.espncdn.com/i/teamlogos/countries/500-dark/{code}.png`
- **Player headshot:** `a.espncdn.com/i/headshots/soccer/players/full/{athlete_id}.png`
- **League logo:** `a.espncdn.com/i/leaguelogos/soccer/500/4.png`
- **League logo (dark):** `a.espncdn.com/i/leaguelogos/soccer/500-dark/4.png`

Country code is the lowercase ESPN abbreviation from the teams endpoint (`logo` field is authoritative). Non-obvious codes: South Korea = `kors`, Ivory Coast = `civ`.

### API gotchas

- **$ref pattern:** Core API returns everything as `$ref` links. A 26-man roster = 26 sequential HTTP calls. Cache aggressively or use the summary endpoint's inline `rosters` field for match-day data.
- **Roster timing:** The summary endpoint's `rosters` array is empty until lineups are announced (~1 hour before kickoff). Core API `athletes` endpoint has the broader tournament squad available now.
- **Date handling:** All dates are UTC. The `dates` param uses `YYYYMMDD`. ESPN treats the date as local broadcast date, so a late-night UTC match may appear under the previous day's US date.
- **Status states:** `status.type.state` cycles through `"pre"` → `"in"` → `"post"`. The `displayClock` gives match minute during live play (e.g. `"67'"`).
- **No rate limit headers documented.** Be respectful. Cache everything that isn't live-score data.
- **Undocumented API = no SLA.** Endpoints could change without notice.

## Secondary news source: Inoreader API

ESPN's `news` endpoint only surfaces ESPN's own editorial. To broaden the News page beyond a single outlet, pull additional stories from **Inoreader** — a paid RSS aggregator account where we curate World Cup sources into a folder (and/or an active-search rule) and pull the resulting stream via API. Inoreader handles the polling, deduping, and normalization of dozens of RSS feeds; we just consume one clean stream.

### Why Inoreader

- One curated World Cup folder aggregates wire services (Reuters, AP, BBC, Guardian), soccer-specific outlets (ESPN FC editorial, Goal, 90min), FIFA/confederation official feeds, and per-nation beat writers — coverage the ESPN API will never surface.
- Paid tier: API quota is effectively a non-issue for periodic server-side polling, and the subscription/feed-count caps are high enough to be liberal with sources.
- Paid tier also unlocks **active search** + rules: build a saved search across all feeds (matching team names / "World Cup"), cast a wide net with noisy feeds (e.g. Google News topic RSS), then filter down with a rule before items reach the site. Pull the saved-search stream the same way as a folder.

### Auth

Single-user personal site → use the **AppId / AppKey** header approach, not full OAuth (no token-refresh dance). Pass `AppId` and `AppKey` as headers (plus the user auth token). **All Inoreader credentials live server-side only** — never ship the token to the browser. The client only ever sees normalized, cached JSON.

### Key endpoint: Stream Contents

```
GET inoreader.com/reader/api/0/stream/contents/{streamId}
  ?n=50            // item count
  &xt=user/-/state/com.google/read   // optional: exclude read items
```

`streamId` forms:
- **Folder:** `user/-/label/World Cup`
- **Saved search / tag:** same `user/-/label/{name}` shape
- **Single feed:** `feed/{feedUrl}`

Returns an `items[]` array. Map each item to our normalized shape:

| Normalized field | Inoreader field | Notes |
|---|---|---|
| `id` | `items[].id` | |
| `feedTitle` | `items[].origin.title` | origin outlet name |
| `feedId` | `items[].origin.streamId` | |
| `title` | `items[].title` | |
| `summary` | `items[].summary.content` | strip HTML → plain text, truncate |
| `url` | `items[].canonical[0].href` | fallback `alternate[0].href` |
| `author` | `items[].author` | nullable |
| `published` | `items[].published` | **Unix seconds, not ms** → convert to ISO |
| `imageUrl` | `items[].enclosure[0].href` | else parse from content; nullable |
| `categories` | `items[].categories` | filter to folder/tag labels |

Other useful endpoints: `/subscription/list` (render "sources we follow"), `/tag/list` (enumerate folders).

### Content rights

RSS gives headline + summary + link. **Render title, snippet, source name, timestamp, and an outbound link only** — never full article text, even if a feed provides it. The point is to drive traffic back to the source. This keeps republishing clean.

### Unified news model

ESPN news and Inoreader news render through **one source-agnostic component**. Normalize both into a shared item shape with a `source` field (`"espn"` | `"inoreader"`) that drives a small attribution badge:

```jsonc
{
  "id": "...",
  "source": "inoreader",
  "feedTitle": "BBC Sport - Football",
  "title": "...",
  "summary": "...",            // plain-text, truncated
  "url": "https://...",        // canonical outbound link
  "author": "...",             // nullable
  "published": "2026-06-09T14:32:00Z",  // ISO 8601 UTC — the merge sort key
  "imageUrl": "https://...",   // nullable
  "categories": ["World Cup", "Argentina"]
}
```

Cached file is a single merged, sorted, deduped array plus metadata:

```jsonc
{
  "generatedAt": "2026-06-10T18:00:00Z",
  "sources": {
    "espn": { "count": 12, "ok": true },
    "inoreader": { "count": 40, "ok": true, "stream": "user/-/label/World Cup" }
  },
  "items": [ /* normalized items, newest first */ ]
}
```

**Dedup:** ESPN and a wire feed may carry the same story. Dedup on normalized canonical URL (strip query/UTM params, lowercase host), with a fallback fuzzy title match inside a time window. ESPN item wins ties (richer internal linking).

### Data flow

```
Build time / scheduled job:
  Inoreader Stream Contents → normalize → cache JSON
  ESPN news endpoint → (existing flow) → normalize
  → merge + dedup + sort → cached merged feed → page generation

Runtime (client):
  News page renders merged feed from cached JSON
  Optional: poll a Next.js API route returning the cached feed
  (revalidate interval — NEVER direct Inoreader calls; token stays server-side)
```

### Caching

Treat like the ESPN news feed (10-min cache) — news moves fast during a tournament but doesn't need sub-minute freshness. Reasonable cadence: every 10–15 min on match days, hourly otherwise. Implement as an ISR `revalidate` interval or a scheduled function that rewrites the cached JSON, same shape as the ESPN polling layer borrowed from boxscores.

### Broadening further (optional layers)

- **Self-hosted RSS merge** — alternative to Inoreader: fetch a hardcoded feed list server-side, parse with `rss-parser`, merge/dedup/sort. Removes the dependency but rebuilds what Inoreader gives free. Inoreader is the lower-effort path since the account already exists.
- **Google News topic/query RSS** — wide net, noisier. Best added *inside* the Inoreader folder and cleaned up by an active-search rule rather than consumed raw.
- **Editorial layer** — a thin hand-curated/annotated selection on top of the auto feed differentiates from a pure aggregator.

## Supplemental data (gaps the API doesn't cover)

### Static JSON files to build and maintain

**`data/venues.json`** — 16 venue records
ESPN only returns venue name and city. We need to curate:
- Capacity
- Latitude/longitude coordinates (for weather API + maps)
- Roof type: open, retractable, fixed (AT&T = retractable, SoFi = fixed, Mercedes-Benz = retractable, BC Place = retractable; all others open-air)
- Field surface (natural grass vs turf — most NFL venues will install temporary grass)
- Year built / renovated
- Nearest public transit (metro station, rail stop, shuttle info)
- Parking notes
- Official FIFA venue page URL
- Photo URL (if we source or license one)
- ESPN venue ID (for linking to API data)

**`data/teams-supplemental.json`** — 48 team records
ESPN has team names, logos, and abbreviations. We need:
- Current FIFA world ranking (and ranking points if available)
- FIFA confederation (UEFA, CONCACAF, CONMEBOL, CAF, AFC, OFC)
- World Cup history: number of appearances, best finish, years qualified
- Head coach name
- Team nickname (if commonly used)
- ESPN team ID (for linking)

**`data/players-clubs.json`** — ~1,248 player records (48 teams × 26 players)
ESPN athlete bios have position and citizenship but NOT current club team. We need:
- ESPN athlete ID (primary key)
- Current club team name
- Club league (e.g., "Premier League", "La Liga")
This is the largest curation effort. Consider scraping from a reliable source at build time or maintaining manually for high-profile squads.

### Computed / aggregated data

**Tournament stats leaders** — No ESPN endpoint for this. Aggregate from per-match summary data:
- Golden Boot: total goals per player across all matches
- Assists leader
- Yellow/red card counts
- Clean sheets per goalkeeper
- Saves leader
Build this as a scheduled job or post-match-day build step. Pull each completed match's summary, extract player stats, aggregate into a leaderboard JSON.

**Knockout bracket** — No dedicated bracket endpoint. Construct from scoreboard data:
- Filter events by season type: 2 (R32), 3 (R16), 4 (QF), 5 (SF), 6 (Third), 7 (Final)
- Map matchups based on group winners/runners-up feeding into specific R32 slots
- Update bracket as results come in
- Pre-tournament: show empty bracket with group position labels ("Winner Group A vs 3rd Place Group X")

### External API integrations

**Weather — Open-Meteo (free, no key required)**
- Use venue lat/lng + match kickoff time to fetch forecast
- Temperature, humidity, precipitation probability, wind, conditions
- Only useful for matches 7-14 days out (forecast accuracy)
- Note roof status — skip weather for closed-roof venues
- Endpoint: `api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,weather_code`

**Maps — consider Leaflet.js with OpenStreetMap tiles**
- You're already using Leaflet on 30minutedelay.com
- Venue location maps on stadium pages
- Embedded smaller maps on match cards showing venue location
- No API key needed for OSM tiles

## Site architecture decisions

### Rendering strategy

**Static site generation (SSG) with client-side live updates.**

The vast majority of site content is knowable ahead of time or changes infrequently (team profiles, venue guides, group compositions, schedule). Generate static pages at build time. During live matches, use client-side JS to poll the scoreboard and summary endpoints for real-time score updates.

Use **Next.js 16 with React 19 and Tailwind 4** — the same stack as the boxscores project. This is proven, current, and lets us copy the ESPN client/cache layer directly. Next.js gives us:
- Static page generation for all team/venue/match pages
- Client-side hydration for live score widgets
- API route handlers if we need any server-side enrichment

### Caching strategy

**Build-time cache (aggressive):**
- All 48 team rosters (Core API athlete data) — cache at build, refresh daily
- Venue data — static JSON, no API dependency
- Group compositions — cache at build, won't change
- Team supplemental data — static JSON

**Runtime cache (short TTL):**
- Scoreboard — poll every 30-60s during live matches, 5-min cache otherwise
- Match summary for active matches — poll every 60s
- News feed — 10-minute cache

**Never cache:**
- Nothing. Even live scores benefit from a 30s floor.

### ESPN API proxy

The boxscores project confirms that CORS is NOT an issue — ESPN's Site API and Core API both accept cross-origin requests from the browser. No proxy is needed for basic data fetching.

However, a server-side layer is still useful for:
1. Dereferencing Core API `$ref` links and returning pre-joined data (e.g., full roster with inline athlete bios)
2. Aggregating player stats into tournament leaderboards on a schedule
3. Caching aggressively via the file-based cache from boxscores

Next.js API routes (or a scheduled build step) can handle this — no separate proxy infrastructure needed.

### Data flow

```
Build time:
  ESPN Core API → cache rosters, teams, groups → static JSON
  Static JSON files (venues, rankings, history) → page generation
  → Deploy static site

Runtime (client):
  ESPN Site API scoreboard → live score widget (poll 30-60s)
  ESPN Site API summary → match detail page (poll 60s for live matches)
  Open-Meteo → venue weather widget (cache 1 hour)

Runtime (edge/worker — if using proxy):
  Client → proxy → ESPN API → cache → client
  Scheduled job → pull completed match summaries → aggregate stats → update leaderboard JSON
```

### URL structure

```
/                           → Today's matches / tournament hub
/schedule                   → Full 104-match schedule, filterable
/schedule/2026-06-11        → Single day view
/groups                     → All 12 group tables
/groups/a                   → Group A detail with matches
/bracket                    → Knockout bracket visualization
/match/{event_id}           → Match center (box score, stats, events, commentary)
/team/{abbreviation}        → Team profile (e.g., /team/usa)
/team/{abbreviation}/roster → Full roster with player cards
/player/{athlete_id}        → Player profile
/venues                     → All 16 venues overview / map
/venue/{slug}               → Venue detail (e.g., /venue/metlife-stadium)
/stats                      → Tournament stats leaders
/news                       → ESPN news feed
```

### Key UX features

- **Timezone-aware display:** All match times shown in user's local timezone using `Intl.DateTimeFormat`. Store UTC, display local. Include a "show in UTC" toggle for international users.
- **Live match indicators:** Pulsing dot or badge for in-progress matches. Auto-refresh score without full page reload.
- **TV guide integration:** "Where to watch" prominently displayed per match — FOX, FS1, Telemundo, Peacock with channel-appropriate styling.
- **Mobile-first:** Most fans will check scores on their phone. Cards and tables must work at 375px.
- **Dark mode:** ESPN CDN provides dark-mode flag variants. Site should support system-preference dark mode.
- **"My team" quick filter:** Let users flag a favorite team for quick access to their schedule, group, and results. Store in localStorage.

## 16 venues — ESPN IDs

| ESPN ID | Venue | City | Games |
|---------|-------|------|-------|
| 3871 | AT&T Stadium | Arlington, TX | 9 |
| 4727 | MetLife Stadium | East Rutherford, NJ | 8 |
| 7485 | Mercedes-Benz Stadium | Atlanta, GA | 8 |
| 9115 | SoFi Stadium | Inglewood, CA | 8 |
| 4643 | Hard Rock Stadium | Miami Gardens, FL | 7 |
| 10660 | Gillette Stadium | Foxborough, MA | 7 |
| 6262 | NRG Stadium | Houston, TX | 7 |
| 4370 | BC Place | Vancouver, CAN | 7 |
| 10897 | GEHA Field at Arrowhead Stadium | Kansas City, MO | 6 |
| 5960 | Levi's Stadium | Santa Clara, CA | 6 |
| 1421 | Lincoln Financial Field | Philadelphia, PA | 6 |
| 4485 | Lumen Field | Seattle, WA | 6 |
| 10143 | BMO Field | Toronto, CAN | 6 |
| 1672 | Estadio Banorte | Mexico City, MEX | 5 |
| 5009 | Estadio Akron | Guadalajara, MEX | 4 |
| 6351 | Estadio BBVA | Guadalupe, MEX | 4 |

## 48 teams — ESPN IDs

| Abbr | Team | ESPN ID |
|------|------|---------|
| ALG | Algeria | 624 |
| ARG | Argentina | 202 |
| AUS | Australia | 628 |
| AUT | Austria | 474 |
| BEL | Belgium | 459 |
| BIH | Bosnia-Herzegovina | 452 |
| BRA | Brazil | 205 |
| CAN | Canada | 206 |
| CPV | Cape Verde | 2597 |
| COL | Colombia | 208 |
| COD | Congo DR | 2850 |
| CRO | Croatia | 477 |
| CUW | Curaçao | 11678 |
| CZE | Czechia | 450 |
| ECU | Ecuador | 209 |
| EGY | Egypt | 2620 |
| ENG | England | 448 |
| FRA | France | 478 |
| GER | Germany | 481 |
| GHA | Ghana | 4469 |
| HAI | Haiti | 2654 |
| IRN | Iran | 469 |
| IRQ | Iraq | 4375 |
| CIV | Ivory Coast | 4789 |
| JPN | Japan | 627 |
| JOR | Jordan | 2917 |
| MEX | Mexico | 203 |
| MAR | Morocco | 2869 |
| NED | Netherlands | 449 |
| NZL | New Zealand | 2666 |
| NOR | Norway | 464 |
| PAN | Panama | 2659 |
| PAR | Paraguay | 210 |
| POR | Portugal | 482 |
| QAT | Qatar | 4398 |
| KSA | Saudi Arabia | 655 |
| SCO | Scotland | 580 |
| SEN | Senegal | 654 |
| RSA | South Africa | 467 |
| KOR | South Korea | 451 |
| ESP | Spain | 164 |
| SWE | Sweden | 466 |
| SUI | Switzerland | 475 |
| TUN | Tunisia | 659 |
| TUR | Türkiye | 465 |
| USA | United States | 660 |
| URU | Uruguay | 212 |
| UZB | Uzbekistan | 2570 |

## Boxscore stats available (28 team-level fields)

**Discipline:** foulsCommitted, yellowCards, redCards, offsides
**Shooting:** totalShots, shotsOnTarget, shotPct, blockedShots, penaltyKickGoals, penaltyKickShots
**Possession:** possessionPct, wonCorners
**Passing:** accuratePasses, totalPasses, passPct, accurateCrosses, totalCrosses, crossPct, totalLongBalls, accurateLongBalls, longballPct
**Defending:** saves, effectiveTackles, totalTackles, tacklePct, interceptions, effectiveClearance, totalClearance

## Per-player stats available (14 fields)

appearances, foulsCommitted, foulsSuffered, ownGoals, redCards, subIns, yellowCards, goalsConceded, saves, shotsFaced, goalAssists, shotsOnTarget, totalGoals, totalShots

## Key event types from summary endpoint

Goal, Goal - Header, Yellow Card, Red Card, Substitution, Kickoff, Halftime, End Match

Each key event includes: clock.displayValue (minute), type.text, narrative text, participants (athlete name + ID, plus assist provider if applicable).

## File structure (planned)

```
everyfouryears/
├── CLAUDE.md                    ← this file
├── espn-api-guide.html          ← ESPN API reference doc
├── data/
│   ├── venues.json              ← hand-curated venue details (16 records)
│   ├── teams-supplemental.json  ← FIFA rankings, WC history, coaches (48 records)
│   └── players-clubs.json       ← club team affiliations (~1,248 records)
├── src/
│   ├── lib/
│   │   ├── espn.ts              ← ESPN API client with caching
│   │   ├── weather.ts           ← Open-Meteo client
│   │   └── stats.ts             ← Stats aggregation logic
│   ├── pages/                   ← route pages (see URL structure above)
│   └── components/              ← reusable UI components
├── public/
│   └── ...                      ← static assets
└── package.json
```

## Sister project: BoxScoresDaily / AgateTypes.com

**Location:** `/Users/potsie/Desktop/repos/boxscores`

This World Cup site has a sibling project — agatetypes.com (BoxScoresDaily) — that already uses the ESPN API extensively across MLB, NFL, NBA, NHL, soccer, and motorsports. It's a working Next.js 16 app with a mature ESPN integration layer that should inform (and in some cases be directly reused by) this project.

### What to borrow

**ESPN API client + caching layer** — `src/lib/espn/core.ts` and `src/lib/cache.ts` implement a file-based caching wrapper around ESPN fetches. The `espnFetch<T>(url, cacheKey, ttl)` pattern is exactly what this project needs. The cache writes JSON files to `.cache/` with optional TTL expiry. Completed-game data gets cached indefinitely (no TTL), live data gets short TTLs.

**Soccer-specific types and normalizer** — `src/lib/espn/soccer.ts` and `src/lib/espn/soccer-types.ts` already define TypeScript types for the ESPN soccer summary response: `ESPNSoccerSummaryResponse`, `ESPNKeyEvent`, `ESPNSoccerTeamEntry`, etc. The normalizer in `src/lib/normalize/soccer.ts` extracts goals, cards, team stats, and linescores from raw ESPN data into clean typed objects. This can be forked and extended for World Cup-specific needs (the existing version handles club soccer leagues but the response shape is identical for `fifa.world`).

**Shared base types** — `src/lib/espn/types.ts` defines `ESPNScoreboardResponse`, `ESPNScoreboardEvent`, `ESPNCompetitionBasic`, `ESPNCompetitorBasic`, `ESPNPlayersEntry`, `ESPNAthleteStatLine`, etc. These are sport-agnostic and directly reusable.

**Live scoreboard pattern** — `src/components/live/SoccerScoreboardWall.tsx` is a fully working live soccer scoreboard with 60-second polling, split-flap animations, league filtering, goal/card extraction from the `details` array, and summary-endpoint enrichment for half-score linescores. The client-side polling approach (direct fetch to ESPN from the browser) works fine for a single-page live view. This pattern confirms that CORS is not an issue for client-side ESPN Site API calls.

**Date utilities** — `src/lib/dates.ts` has battle-tested helpers: `nowET()` (current time pinned to US Eastern), `todayESPN()` (YYYYMMDD format), `toESPNDate()`, `parseRouteDate()`, `toRouteDate()`. These handle the ESPN date-as-local-broadcast-date quirk correctly.

### Architecture confirmed by boxscores project

- **Next.js 16 with React 19** — the stack is current and working. Tailwind 4 for styling.
- **SSG + client-side polling** — box score pages are statically generated at request time with `fetch()` in server components, cached on disk. Live scoreboards are purely client-side with `useEffect` polling loops. This is exactly the pattern proposed for everyfouryears.futbol.
- **No API proxy needed for Site API** — the boxscores project calls ESPN directly from both server components and client-side code. CORS is not blocked on `site.api.espn.com`. The Core API (`sports.core.api.espn.com`) also works from both contexts.
- **File-based caching** — simple, no Redis dependency. Cache dir is `.cache/` at project root. Works well for Vercel deployment.
- **Normalizer pattern** — raw ESPN response → sport-specific normalizer → clean typed data → component. This separation is essential and should be replicated. The World Cup normalizer will be soccer-specific but will also need to handle tournament-specific concepts (group stage, knockout rounds, season types) that don't exist in the club soccer normalizer.

### What's different for World Cup

- **Single tournament, not multi-league daily scores.** Boxscores is date-driven across many leagues. World Cup is tournament-driven with a fixed 104-match schedule. The data model centers on groups, rounds, and bracket progression rather than daily date navigation.
- **Team = country, not club.** Flags instead of logos (though ESPN CDN serves both). Rosters are national team squads with club team as supplemental data.
- **Group stage + knockout structure.** Standings endpoint becomes critical. Bracket visualization is new. Season type IDs (1-7) control round identification.
- **Richer per-match pages.** Boxscores shows the newspaper-style agate box score. World Cup match pages should be fuller: key events timeline, commentary, player stats, odds, head-to-head, related news, highlight videos — all available from the summary endpoint.
- **Venue is a first-class entity.** Boxscores treats venue as a footnote (name in game notes). World Cup venues get their own pages with transit, weather, capacity, maps.

### Files to reference or copy

| Boxscores file | Reuse strategy |
|---|---|
| `src/lib/espn/core.ts` | Copy directly — `espnFetch()` is generic |
| `src/lib/cache.ts` | Copy directly — file-based cache with TTL |
| `src/lib/espn/types.ts` | Copy — base scoreboard types are sport-agnostic |
| `src/lib/espn/soccer-types.ts` | Fork — extend for WC-specific fields (rosters, odds, commentary) |
| `src/lib/espn/soccer.ts` | Fork — change league slug to `fifa.world`, add WC-specific fetchers |
| `src/lib/normalize/soccer.ts` | Fork — extend for WC match detail, player stats, group standings |
| `src/lib/dates.ts` | Copy — date utilities are fully reusable |
| `src/components/live/SoccerScoreboardWall.tsx` | Reference — live polling pattern, flap animation, goal extraction |
| `next.config.ts` | Reference — minimal config, works |
| `package.json` | Reference — Next.js 16, React 19, Tailwind 4 stack |

## Development notes

- The ESPN API is confirmed working as of May 27, 2026. All endpoints tested live.
- The `dates=20260611-20260720&limit=200` scoreboard call returns all 104 matches.
- Group standings include advancement notes with color coding (green = advance, red = eliminated).
- The flag filename uses lowercase ESPN abbreviation. The `logo` field in the API response is always the authoritative source for the correct code.
- Height is returned in inches, weight in lbs. Convert for international display.
- The `summary` endpoint works for upcoming, live, and completed matches — just returns more data as the match progresses.
