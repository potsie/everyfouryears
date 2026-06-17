// Prototype layer over FIFA Post-Match Summary Reports (PMSR). The PDFs are
// parsed offline by scripts/parse_pmsr.py into data/pmsr/<eventId>.json. This
// surfaces the two highest-value fields ESPN doesn't give us: Expected Goals
// and per-player physical/running data.
//
// This module is client-safe (types + pure helpers only). The filesystem
// loader lives in pmsr.server.ts so client components can import physicalLeaders
// without pulling `fs` into the browser bundle.

export interface PmsrPlayerPhysical {
  number: string;
  name: string;
  athleteId: string | null;
  total_distance_m: number;
  zone1_0_7_m: number;
  zone2_7_15_m: number;
  zone3_15_20_m: number;
  zone4_20_25_m: number;
  zone5_25plus_m: number;
  high_speed_runs: number;
  sprints: number;
  top_speed_kmh: number;
}

export interface PmsrTeam {
  abbr: string | null;
  xg: number | null;
  totalDistanceKm: number | null;
  physical: PmsrPlayerPhysical[];
}

export interface PmsrData {
  eventId: string;
  source: string;
  home: PmsrTeam;
  away: PmsrTeam;
}

export interface PmsrLeader {
  name: string;
  abbr: string | null;
  value: number;
}

export interface PmsrLeaders {
  topSpeed: PmsrLeader | null;
  mostSprints: PmsrLeader | null;
  mostDistance: PmsrLeader | null;
}

// Highest value across both squads for each physical metric, tagged with team.
export function physicalLeaders(data: PmsrData): PmsrLeaders {
  const tagged = [
    ...data.home.physical.map(p => ({ p, abbr: data.home.abbr })),
    ...data.away.physical.map(p => ({ p, abbr: data.away.abbr })),
  ];
  if (tagged.length === 0) return { topSpeed: null, mostSprints: null, mostDistance: null };

  const best = (pick: (p: PmsrPlayerPhysical) => number): PmsrLeader =>
    tagged
      .map(({ p, abbr }) => ({ name: p.name, abbr, value: pick(p) }))
      .reduce((a, b) => (b.value > a.value ? b : a));

  return {
    topSpeed: best(p => p.top_speed_kmh),
    mostSprints: best(p => p.sprints),
    mostDistance: best(p => p.total_distance_m),
  };
}

// Normalize a player name for cross-source matching: strip diacritics, uppercase,
// drop everything that isn't a letter or digit. "Yazan Al-Arab" and "YAZAN ALARAB"
// both collapse to "YAZANALARAB".
export function normalizePmsrName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // strip combining diacritical marks (accents)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

// Resolve a FIFA physical-row name to an ESPN athlete id within one team's roster.
// Returns the id on a normalized match, else null (never a wrong id).
export function resolveAthleteId(
  fifaName: string,
  roster: { id: string; name: string }[],
): string | null {
  const target = normalizePmsrName(fifaName);
  const hit = roster.find(r => normalizePmsrName(r.name) === target);
  return hit?.id ?? null;
}
