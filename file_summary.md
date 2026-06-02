# Project Reference: 2026 World Cup Site Data & Utilities

This document serves as a reference for the technical files generated for the `everyfouryears.futbol` project.

## 1. Data Normalization Utilities
- **`soccer.ts`**: Handles the normalization of match data from raw ESPN payloads into typed `SoccerBoxScore` objects for club-level games.
- **`world-cup-normalizer.ts`**: The core normalizer tailored for the 2026 World Cup, handling rosters, live clocks, broadcasters, and tournament stages.

## 2. Type Definitions
- **`soccer-types.ts`**: Interface definitions for club-level soccer data.
- **`world-cup-types.ts`**: Expanded type definitions for World Cup specific data structures including rosters, commentary, and match status.
- **`standings-types.ts`**: Interfaces for group standings and team ranking status.

## 3. Standings Logic
- **`standings.ts`**: Contains `normalizeGroupStandings` for parsing group tables and `generateThirdPlaceTable` for calculating the best 3rd-place teams for the knockout stage.

## 4. Data Compilation Scripts
- **`fetch_rankings.py`**: A Python script designed to fetch live FIFA World Rankings from the v3 FIFA API and cross-reference them against the local `world_cup_2026_rosters.json` to generate `teams-supplemental.json`.
