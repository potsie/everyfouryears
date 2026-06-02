# 📋 Coding Agent Handoff: everyfouryears.futbol Dashboard Integration

## 🚀 Project Overview
We are building a premium, high-contrast, network television **"Broadcast" aesthetic** web dashboard for the 2026 World Cup using **Next.js (App Router)** and **Tailwind CSS**. 

The core data layer is 100% complete and normalized from raw ESPN payloads. Your task is to wire the existing TypeScript data utilities up to the client-side UI components and the background live-polling infrastructure to allow seamless local dev server testing.

---

## 📂 Master Directory & File Map
Ensure all existing files are moved to these exact locations relative to the project root (`/everyfouryears`):

everyfouryears/
├── src/
│   ├── types/
│   │   ├── world-cup-types.ts      # Raw ESPN API response shapes
│   │   └── standings-types.ts      # Internal group table & advancement interfaces
│   ├── lib/
│   │   └── normalize/
│   │       ├── world-cup-normalizer.ts # Transforms match payloads to UI states
│   │       └── standings.ts            # Parses group tables & 3rd-place wildcards
│   ├── components/
│   │   ├── ScheduleSwiper.tsx      # Chronological horizontal matchday selector
│   │   ├── MatchCard.tsx           # Broadcast-style match card with mechanical score blocks
│   │   └── LiveStatsDrawer.tsx     # Animated slide-out contextual panel for live analytics
│   └── app/
│       ├── page.tsx                # Master Dashboard Hub (With lifecycle test dock)
│       └── api/
│           └── matches/
│               └── route.ts        # Background live-polling endpoint

---

## 🛠 Functional & Architectural Requirements

### 1. Data Fetching & Polling Strategy (`/api/matches/route.ts`)
* **Source Endpoint:** Consume the unauthenticated ESPN Site API Scoreboard endpoint to avoid N+1 dref chaining: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200`.
* **Filtering:** Filter out group stage matches to isolate tournament rounds (Season Type IDs `2` through `7`) when processing the knockout state. Map all extracted data arrays through the `normalizeWorldCupGame` function.
* **Client-Side Trigger:** The `BracketTabController` or global `DashboardHub` must execute a background client-side poll every 30 seconds *only* if active matches are detected in an in-progress state (`match.status.state === 'in'`). If no matches are live, the polling interval must remain completely clear.

### 2. UI Layout Architecture
* **The Schedule Swiper:** Must utilize native CSS horizontal scroll snapping (`snap-x snap-mandatory`) to ensure mobile touch-swipe momentum mechanics work fluidly without third-party carousel weights. Tapping a day must seamlessly update the visible card stack.
* **Contextual Data Disclosure:** Do not cram match statistics inside the core bracket tree node or match card. Statistics (`possessionPct`, `totalShots`, `shotsOnTarget`) must layer inside the `<LiveStatsDrawer />` overlay, which slides out from the right on desktop and up from the bottom on mobile.
* **State Alignment:** Ensure data changes occurring in the root poll immediately cascade down to the comparative analytics progress bars inside the open drawer without forcing layout flickering or element re-renders.

### 3. Progressive Disclosure (Mobile Mitigation)
* **The Issue:** Rendering a 32-team knockout layout at once introduces vertical scroll fatigue and breaks viewports on small mobile screens.
* **The Resolution:** Implement a round-by-round progressive tab toggle deck on mobile screens (`[Round of 32]`, `[Round of 16]`, etc.) to show matches as neat vertical stacks, transitioning into a multi-column swipeable carousel structure on wide viewports.

---

## 🎨 The Broadcast Palette Style Guide

This color and layout system balances an authoritative sports network presence with clean data readability.

| Layer | Color | Hex | Tailwind Class | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Core** | Deep Space Navy | #0a2540 | bg-[#0a2540] | Headers, matchday banners, container crowns. |
| **Pitch Canvas** | Stadium White | #f8fafc | bg-slate-50 | Main application background. |
| **Surface Elevate**| Pure Ice White | #ffffff | bg-white | Individual match nodes, tables, sliding drawers. |
| **Live Pulse** | Electric Emerald | #10b981 | bg-emerald-500 | Active match clocks, glowing live indicators. |
| **Network Accent** | Broadcast Blue | #3b82f6 | text-blue-500 | TV channel labels, hyper-focused callouts. |
| **Event Highlight**| Ticker Amber | #f59e0b | text-amber-500 | Goal scorer minutes, key stats metrics. |
| **Structural Line** | Soft Slate | #f1f5f9 | border-slate-100 | Match card dividers, table borders. |

### 📐 Key Design Motifs (The "Network Layout")

#### A. Mechanical Score Blocks
Avoid rendering live scores as flat text strings. To capture the television ticker feeling, scores must be isolated inside prominent physical card slots:
* Give each score its own container using `bg-slate-50`, rounded corners (`rounded-lg`), a crisp border (`border-slate-200`), and a subtle shadow (`shadow-sm`).
* Use ultra-bold, high-contrast typography (`font-black text-slate-900`) so scores are instantly recognizable when scanning down a layout grid.

#### B. High-Contrast Spatial Separation
* **The Crown Element:** Every main content panel or match group should be anchored by a high-contrast top banner utilizing the Deep Space Navy hue (`bg-[#0a2540]`) and tracking caps font styles (`text-[11px] font-bold tracking-widest uppercase text-white`).
* **The Metadata Footer:** Ground match cards with a light, muted background block (`bg-slate-50`) to isolate venue details and broadcast network tags distinctly from the core scores.

#### C. Kinetic Animation Indicators
* **The Live Ticker:** Any actively running game clock must feature a pulsing live node. Use a relative flex wrapper housing an engine pulse effect (`animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]`) so the screen feels dynamic.
* **Score Ingestion Shifting:** When a score updates via the background live-polling handler, execute a micro-interaction transform animation (like a `slideFadeUp` cubic-bezier transition) to draw the eye gracefully to the changed value.

---

## ⚙️ Tailwind Global Configuration Additions

Inject this configuration extension directly into your local Tailwind configuration to standardize your custom weight overrides:

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        broadcastNavy: '#0a2540',
        stadiumWhite: '#f8fafc',
        liveEmerald: '#10b981',
        networkBlue: '#3b82f6',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        black: '900', // Captures the ultra-heavy network scoreboard font weight
      }
    },
  },
  plugins: [],
}

---

---

## 🗺️ Host City Venue Guide Module Extension

When a user triggers the "View Full Venue Guide" link from the interactive map sidebar, the application must route them to a dedicated, dynamic host city portal. Each guide is structured around an interactive match-day control center and travel utility ecosystem divided into four specific operational layers:

### 1. The Architectural Broadcast Banner
* **Hero Visuals:** High-contrast stadium header presentation mirroring network television layouts.
* **Live Climate Panel:** A weather widget component highlighting open-air vs. fixed-roof operational data variables.
* **Time-Zone Context:** Localized match countdown clocks displaying stadium-native time zone abbreviations alongside user local time.

### 2. Live Transportation & Transit Logistics
* **Transit Hub Metrics:** Walking route instructions, parking designations, and rail/shuttle connection maps.
* **Security Line Tickers:** Integrated real-time gate security queue latency metrics.
* **Gate Navigation Routing:** Dynamic path tracking based on user-inputted ticket stub gate letters.

### 3. Progressive Match Schedule Matrix
* **Tournament Path Progression:** Explicit mapping highlighting group stage assignments or knockout branches advancing straight to the venue.
* **Historical Archive:** Post-match scoreboard cards featuring direct deep links back to localized live match analytics drawers.

### 4. Concourse & Fan Zone Explorer
* **National Flavor Spotlights:** Directory highlighting local culinary features and venue-specific hospitality options.
* **Official Fan Shops:** High-contrast map callouts tracking FIFA merchandise drops inside the stadium security perimeter.

---

## 📂 Venue Guide Technical Specifications & Data Anchors

### 1. Data Layer Supplement
* **File Path:** `/everyfouryears/src/lib/data/venues-supplemental.json`
* **Purpose:** Stores static transit and geographical metadata to supplement dynamic API structures.

{
  "metlife": {
    "venueId": "ny",
    "fullName": "MetLife Stadium",
    "location": "East Rutherford, NJ",
    "coordinates": { "lat": 40.8128, "lng": -74.0745 },
    "transitGuide": {
      "rail": "Meadowlands Station via NJ Transit",
      "rideshare": "Lot E Drop-off Zone"
    }
  }
}

### 2. Dynamic Route Aggregator
* **File Path:** `/everyfouryears/src/app/venues/[venueId]/page.tsx`
* **Purpose:** Server-rendered route fetching all tournament games and isolating venue-specific schedules on demand.

import type { ESPNWorldCupSummaryResponse } from '@/lib/espn/world-cup-types';
import { normalizeWorldCupGame } from '@/lib/normalize/world-cup-normalizer';

interface VenuePageProps {
  params: { venueId: string };
}

export default async function VenueGuidePage({ params }: VenuePageProps) {
  const { venueId } = params;

  // Fetch the 104-game master schedule array from the scoreboard endpoint
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200');
  const data = await res.json();

  // Filter schedules cleanly by cross-referencing normalized venue fields against the parameter string
  const venueMatches = data.events
    .map((event: any) => normalizeWorldCupGame(event.id, event))
    .filter((match: any) => match.venue.toLowerCase().includes(venueId));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Implement layout matching the 4-module architectural blueprint */}
    </div>
  );
}

🛠️ The Architecture: Where the Grid Lives
On your local development server, the match grid component will sit directly below the ScheduleSwiper on your homepage. It will listen to the selectedDate state from the calendar and filter your normalized array of matches instantly.  File Path: /everyfouryears/src/components/MatchGrid.tsx💻 Code Implementation: MatchGrid.tsxAppend this component file specification straight into your master AGENT_HANDOFF.md file so your coding agent can build out the core homepage grid layout cleanly.

TypeScript

// components/MatchGrid.tsx
'use client';

import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import { MatchCard } from '@/components/MatchCard';

interface MatchGridProps {
  matches: WorldCupMatchNormalized[];
  selectedDate: string; // Format: YYYYMMDD from ScheduleSwiper
}

export function MatchGrid({ matches, selectedDate }: MatchGridProps) {
  // 1. Filter matches cleanly to display ONLY games matching the selected swiper date
  // Note: Converts API UTC dates to local YYYYMMDD to evaluate criteria matches
  const filteredMatches = matches.filter((match) => {
    const formattedMatchDate = match.date.replace(/-/g, '').slice(0, 8);
    return formattedMatchDate === selectedDate;
  });

  // 2. Count live games actively in progress for broadcast indicator badges
  const liveGamesCount = filteredMatches.filter(m => m.status.state === 'in').length;

  return (
    <div className="w-full space-y-4">
      {/* Grid Sub-Header Section */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Match Grid & Live Analytics
          </h2>
          {liveGamesCount > 0 && (
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
              {liveGamesCount} LIVE
            </span>
          )}
        </div>
        
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {filteredMatches.length} Fixtures
        </span>
      </div>

      {/* 3. Empty State Handling if a specific date contains no scheduled fixtures */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm">
          <p className="font-semibold text-sm">No matches scheduled for this date.</p>
          <p className="text-xs text-slate-400 mt-1">Select another day on the calendar swiper above.</p>
        </div>
      ) : (
        /* 4. Responsive Grid Matrix: Stacks vertically on mobile, splits to 2 columns on desktop */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
          {filteredMatches.map((match) => (
            <MatchCard key={match.eventId} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

📂 Final Handoff Update
Have your coding agent import this component directly into your root page (/app/page.tsx), swapping out the temporary match wrapper container we drafted earlier.With this engine block locked down, the coding agent has clear blueprints for every single section mentioned in your structural plan: the Hero Zone, the Calendar Swiper, the Match Grid, and the expandable Live Analytics drawer.  


## ⚡ Local Dev Server Initialization Script
To test the visual hierarchy transitions across the tournament's lifecycle phases, use the built-in testing developer dock located at the bottom of `/src/app/page.tsx`. Toggling between **Pre-Match**, **Live Day**, and **Bracket** will instantly alter the hero state to showcase countdown logic, active neon live marquees, or high-stakes single-elimination tracking grids.

## Relates to getting the local dev server started and tailwind configuration

Perfect, starting fresh makes it even easier. Since you are building the workspace from a blank canvas, having the coding agent drop that exact tailwind.config.js file into your project root will configure your design variables correctly on the very first initialization.When you run npx create-next-app@latest to spin up the local development server, the setup wizard will ask you a few standard initialization questions. To ensure your project matches this architecture perfectly, tell your coding agent or select these exact configuration choices during setup:Would you like to use TypeScript? → Yes (This handles your typed data layers flawlessly).  Would you like to use Tailwind CSS? → Yes (Enables your broadcast style utility layout classes).  Would you like to use src/ directory? → Yes (Matches your structural directory maps perfectly).Would you like to use App Router? → Yes (Required for your optimized server fetching and background routing setup).Once the installation wraps up, overwrite the default configuration file with your layout file, drop in your data utilities, and you are officially ready to boot up your local dashboard!