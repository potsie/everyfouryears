export interface TallyItem { k: string; v: string; sub: string; }
export interface ScorerEntry { p: string; t: string; club: string; g: number; a: number; pens: number; mp: number; mins: number; }
export interface LeadEntry { p: string; t: string; club: string; v: number; }
export interface DisciplineEntry { p: string; t: string; club: string; y: number; r: number; }
export interface YoungEntry { p: string; t: string; club: string; age: number; g: number; a: number; }
export interface TeamStatEntry { t: string; gf: number; ga: number; poss: number; shots: number; pass: number; }

export const TALLIES: TallyItem[] = [
  { k: 'Goals scored',  v: '—',   sub: 'group stage' },
  { k: 'Goals / match', v: '—',   sub: 'avg' },
  { k: 'Penalties',     v: '—',   sub: 'scored / taken' },
  { k: 'Clean sheets',  v: '—',   sub: 'by goalkeepers' },
  { k: 'Red cards',     v: '—',   sub: 'this tournament' },
  { k: 'Hat-tricks',    v: '—',   sub: 'this tournament' },
];

export const GOLDEN_BOOT: ScorerEntry[] = [
  { p: 'Kylian Mbappé',      t: 'FRA', club: 'Real Madrid',        g: 6, a: 2, pens: 1, mp: 4, mins: 357 },
  { p: 'Harry Kane',         t: 'ENG', club: 'Bayern München',     g: 5, a: 1, pens: 2, mp: 4, mins: 360 },
  { p: 'Vinícius Júnior',    t: 'BRA', club: 'Real Madrid',        g: 5, a: 3, pens: 0, mp: 4, mins: 341 },
  { p: 'Lautaro Martínez',   t: 'ARG', club: 'Inter',              g: 4, a: 1, pens: 0, mp: 4, mins: 298 },
  { p: 'Christian Pulisic',  t: 'USA', club: 'AC Milan',           g: 4, a: 4, pens: 1, mp: 4, mins: 360 },
  { p: 'Erling Haaland',     t: 'NOR', club: 'Manchester City',    g: 4, a: 0, pens: 1, mp: 3, mins: 270 },
  { p: 'Cody Gakpo',         t: 'NED', club: 'Liverpool',          g: 3, a: 2, pens: 0, mp: 4, mins: 312 },
  { p: 'Julián Álvarez',     t: 'ARG', club: 'Atlético Madrid',    g: 3, a: 2, pens: 0, mp: 4, mins: 289 },
  { p: 'Cole Palmer',        t: 'ENG', club: 'Chelsea',            g: 3, a: 1, pens: 0, mp: 4, mins: 301 },
];

export const ASSISTS: LeadEntry[] = [
  { p: 'Christian Pulisic', t: 'USA', club: 'AC Milan',       v: 4 },
  { p: 'Vinícius Júnior',   t: 'BRA', club: 'Real Madrid',   v: 3 },
  { p: 'Pedri',             t: 'ESP', club: 'Barcelona',      v: 3 },
  { p: 'Jude Bellingham',   t: 'ENG', club: 'Real Madrid',   v: 3 },
  { p: 'Kevin De Bruyne',   t: 'BEL', club: 'Napoli',         v: 3 },
];

export const CLEAN_SHEETS: LeadEntry[] = [
  { p: 'Thibaut Courtois',        t: 'BEL', club: 'Real Madrid',    v: 3 },
  { p: 'Marc-André ter Stegen',   t: 'GER', club: 'Barcelona',      v: 3 },
  { p: 'Emiliano Martínez',       t: 'ARG', club: 'Aston Villa',    v: 2 },
  { p: 'Alisson',                 t: 'BRA', club: 'Liverpool',      v: 2 },
  { p: 'Yann Sommer',             t: 'SUI', club: 'Inter',          v: 2 },
];

export const SAVES: LeadEntry[] = [
  { p: 'Matt Turner',        t: 'USA', club: 'Lyon',          v: 18 },
  { p: 'Yann Sommer',        t: 'SUI', club: 'Inter',         v: 16 },
  { p: 'Yassine Bono',       t: 'MAR', club: 'Al-Hilal',     v: 15 },
  { p: 'Dominik Livaković',  t: 'CRO', club: 'Fenerbahçe',   v: 14 },
  { p: 'Diogo Costa',        t: 'POR', club: 'Porto',         v: 13 },
];

export const DISCIPLINE: DisciplineEntry[] = [
  { p: 'Marcos Acuña',    t: 'ARG', club: 'Sevilla',           y: 3, r: 0 },
  { p: 'Sofyan Amrabat',  t: 'MAR', club: 'Fenerbahçe',       y: 3, r: 0 },
  { p: 'Casemiro',        t: 'BRA', club: 'Manchester United', y: 3, r: 0 },
  { p: 'Cristian Romero', t: 'ARG', club: 'Tottenham',         y: 2, r: 1 },
  { p: 'Granit Xhaka',    t: 'SUI', club: 'Bayer Leverkusen',  y: 2, r: 1 },
];

export const YOUNG: YoungEntry[] = [
  { p: 'Lamine Yamal',   t: 'ESP', club: 'Barcelona',        age: 18, g: 2, a: 3 },
  { p: 'Endrick',        t: 'BRA', club: 'Real Madrid',       age: 19, g: 2, a: 1 },
  { p: 'Kobbie Mainoo',  t: 'ENG', club: 'Manchester United', age: 21, g: 1, a: 2 },
  { p: 'Arda Güler',     t: 'TUR', club: 'Real Madrid',       age: 21, g: 2, a: 1 },
];

export const TEAM_STATS: TeamStatEntry[] = [
  { t: 'ARG', gf: 9, ga: 1, poss: 62, shots: 64, pass: 89 },
  { t: 'ESP', gf: 8, ga: 2, poss: 67, shots: 71, pass: 91 },
  { t: 'BRA', gf: 8, ga: 2, poss: 59, shots: 58, pass: 87 },
  { t: 'FRA', gf: 7, ga: 1, poss: 55, shots: 52, pass: 85 },
  { t: 'ENG', gf: 7, ga: 3, poss: 58, shots: 55, pass: 86 },
  { t: 'NED', gf: 6, ga: 2, poss: 56, shots: 49, pass: 88 },
  { t: 'POR', gf: 6, ga: 3, poss: 61, shots: 53, pass: 88 },
  { t: 'GER', gf: 6, ga: 2, poss: 60, shots: 57, pass: 89 },
];
