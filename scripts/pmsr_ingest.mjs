// FIFA PMSR ingestion orchestrator. Scrapes the match-report hub, downloads each
// new report, parses it (scripts/parse_pmsr.py), resolves the ESPN event id and
// athlete ids, and writes data/pmsr/<eventId>.json. Run: npm run pmsr
//
// Run with: node --experimental-strip-types scripts/pmsr_ingest.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizePmsrName, resolveFifaId } from '../src/lib/pmsr.ts';

const HUB = 'https://www.fifatrainingcentre.com/en/fifa-world-cup-2026/match-report-hub.php';
const HOST = 'https://www.fifatrainingcentre.com';
const SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260610-20260720&limit=200';
const FIFA_SQUADS = 'https://api.fifa.com/api/v3/teams/squads/all/17/285023?language=en';
const DATA_DIR = 'data/pmsr';
const OVERRIDES = JSON.parse(readFileSync(`${DATA_DIR}/name-overrides.json`, 'utf8'));
const UA = { headers: { 'User-Agent': 'Mozilla/5.0' } };

async function getText(url) {
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}
async function getJson(url) {
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// Discover available report PDFs from the hub. Filenames are PMSR-M<n>-<HOME>-V-<AWAY>.pdf.
async function discoverPdfs() {
  const html = await getText(HUB);
  const re = /\/media\/native\/[^"')]*PMSR-M\d+[-\s]([A-Z]{3})[-\s]V[-\s]([A-Z]{3})[^"')]*\.pdf/g;
  const out = new Map(); // url -> { home, away }
  for (const m of html.matchAll(re)) out.set(HOST + m[0], { home: m[1], away: m[2] });
  return [...out].map(([url, teams]) => ({ url, ...teams }));
}

// Build "<HOME>|<AWAY>" -> espn event id from the scoreboard.
async function eventIndex() {
  const sb = await getJson(SCOREBOARD);
  const idx = new Map();
  for (const e of sb.events ?? []) {
    const comp = e.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.abbreviation;
    const away = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.abbreviation;
    if (home && away) idx.set(`${home}|${away}`, e.id);
  }
  return idx;
}

// abbr (FIFA country code) -> [{ id, name }] from the FIFA squads endpoint.
// The /player/[athleteId] route is keyed by FIFA player id, so PMSR names must
// resolve to FIFA ids (not ESPN athlete ids). PMSR and the squads are both
// FIFA-sourced, so the ALL-CAPS names match cleanly after normalization.
async function fifaRostersByCountry() {
  const data = await getJson(FIFA_SQUADS);
  const teams = data?.Results ?? data ?? [];
  const out = {};
  for (const t of teams) {
    const abbr = t.IdCountry;
    if (!abbr) continue;
    out[abbr] = (t.Players ?? []).map(p => ({
      id: String(p.IdPlayer),
      name: p.PlayerName?.[0]?.Description ?? '',
    }));
  }
  return out;
}

function resolveTeam(team, roster) {
  let resolved = 0, missed = [];
  for (const p of team.physical) {
    let id = roster ? resolveFifaId(p.name, roster) : null;
    if (!id) id = OVERRIDES[normalizePmsrName(p.name)] ?? null;
    p.fifaId = id;
    if (id) resolved++; else missed.push(p.name);
  }
  return { resolved, missed };
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  const [pdfs, idx, fifaRosters] = await Promise.all([discoverPdfs(), eventIndex(), fifaRostersByCountry()]);
  console.log(`hub: ${pdfs.length} report(s) available`);

  for (const { url, home, away } of pdfs) {
    const eventId = idx.get(`${home}|${away}`);
    if (!eventId) { console.warn(`! no ESPN event for ${home} v ${away} — skipping`); continue; }
    const outFile = join(DATA_DIR, `${eventId}.json`);
    if (existsSync(outFile)) { console.log(`= ${home} v ${away} (${eventId}) already ingested`); continue; }

    const base = join(tmpdir(), `PMSR-M0-${home}-V-${away}`);
    const pdfPath = `${base}.pdf`, rawPath = `${base}.json`;
    const buf = Buffer.from(await (await fetch(url, UA)).arrayBuffer());
    writeFileSync(pdfPath, buf);
    execFileSync('python3', ['scripts/parse_pmsr.py', pdfPath, eventId, rawPath], { stdio: 'inherit' });
    const data = JSON.parse(readFileSync(rawPath, 'utf8'));

    const h = resolveTeam(data.home, fifaRosters[data.home.abbr]);
    const a = resolveTeam(data.away, fifaRosters[data.away.abbr]);
    writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(`+ ${home} v ${away} (${eventId}) — resolved ${h.resolved + a.resolved} ids`);
    const missed = [...h.missed, ...a.missed];
    if (missed.length) console.warn(`  unresolved: ${missed.join(', ')}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
