"""
fetch_player_clubs_backfill.py
Targeted backfill for the three teams missing from players-clubs.json:
  TUR - "Turkey" search failed (API-Football uses "Türkiye" since 2022 rename)
  BIH - "Bosnia" search failed (needs "Bosnia & Herzegovina")
  CPV - "Cape Verde" search failed

Loads existing data/players-clubs.json and merges in the new entries.
Does NOT overwrite existing entries.

Usage: python3 fetch_player_clubs_backfill.py
"""

import json
import time
import urllib.request
import urllib.parse
import unicodedata
from pathlib import Path

API_KEY = "6dcfbcb3fa9de3e191fe9e615d481519"
BASE = "https://v3.football.api-sports.io"
HEADERS = {"x-apisports-key": API_KEY}

DELAY = 2.2

# Corrected search terms — try each in order, stop on first match
BACKFILL_TEAMS = {
    "CPV": ["Cabo Verde", "Cape Verde", "Cape-Verde"],
}


def fetch(path):
    url = BASE + path
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def find_team_id(code, search_names):
    """Try each search name in order, return first match."""
    for search_name in search_names:
        encoded = urllib.parse.quote(search_name)
        result = fetch(f"/teams?name={encoded}&type=national")
        teams = result.get("response", [])
        if teams:
            t = teams[0]["team"]
            print(f"  Found {code}: ID={t['id']} name='{t['name']}' (searched '{search_name}')")
            return t["id"]
        time.sleep(DELAY)
        # Try without type filter
        result = fetch(f"/teams?name={encoded}")
        for r in result.get("response", []):
            if r["team"].get("national"):
                t = r["team"]
                print(f"  Found {code} (no-type fallback): ID={t['id']} name='{t['name']}' (searched '{search_name}')")
                return t["id"]
        time.sleep(DELAY)
    print(f"  WARNING: Could not find team ID for {code} (tried: {search_names})")
    return None


def get_squad(team_id):
    result = fetch(f"/players/squads?team={team_id}")
    if not result.get("response"):
        return []
    return result["response"][0].get("players", [])


def get_player_club(player_id, season=2025):
    result = fetch(f"/players?id={player_id}&season={season}")
    response = result.get("response", [])
    if not response:
        if season == 2025:
            return get_player_club(player_id, season=2024)
        return None, None, None, None

    stats = response[0].get("statistics", [])
    for s in stats:
        league = s.get("league", {})
        team = s.get("team", {})
        if league.get("country") in ("World", None):
            continue
        games = s.get("games", {})
        if games.get("appearences", 0) or games.get("lineups", 0):
            return team.get("name"), team.get("logo"), league.get("name"), league.get("country")

    for s in stats:
        league = s.get("league", {})
        team = s.get("team", {})
        if league.get("country") not in ("World", None):
            return team.get("name"), team.get("logo"), league.get("name"), league.get("country")

    return None, None, None, None


def normalize_name(name):
    name = unicodedata.normalize("NFD", name)
    name = "".join(c for c in name if unicodedata.category(c) != "Mn")
    return name.lower().strip()


def name_match_score(fifa_name, apif_name):
    fn = normalize_name(fifa_name)
    an = normalize_name(apif_name)
    fn_parts = fn.split()
    an_parts = an.split()
    score = 0
    fn_last = fn_parts[-1] if fn_parts else ""
    an_last = an_parts[-1] if an_parts else ""
    if fn_last and an_last and (fn_last == an_last or fn_last in an_last or an_last in fn_last):
        score += 2
    if fn_parts and an_parts:
        fn_first = fn_parts[0][0] if fn_parts[0] else ""
        an_first = an_parts[0].rstrip(".")[0] if an_parts[0] else ""
        if fn_first and an_first and fn_first == an_first:
            score += 1
    return score


def load_fifa_squad(code):
    """Load FIFA squad for a specific country code from cache."""
    cache_candidates = list(Path(".cache").glob("fifa-wc2026-squads*")) if Path(".cache").exists() else []
    if not cache_candidates:
        print("ERROR: No FIFA squads cache found in .cache/")
        return []
    with open(cache_candidates[0]) as f:
        raw = json.load(f)
    data = raw.get("data", raw)
    teams = data.get("Results", data) if isinstance(data, dict) else data
    for team in teams:
        if team.get("IdCountry") == code:
            return [
                {
                    "fifaId": str(p["IdPlayer"]),
                    "name": p.get("PlayerName", [{}])[0].get("Description", ""),
                    "jerseyNum": p.get("JerseyNum"),
                }
                for p in team.get("Players", [])
            ]
    print(f"  WARNING: {code} not found in FIFA squads cache")
    return []


def main():
    print("=== fetch_player_clubs_backfill.py ===")
    print("Backfilling TUR, BIH, CPV into players-clubs.json\n")

    # Check quota
    status = fetch("/status")
    if status.get("response"):
        req = status["response"].get("requests", {})
        print(f"API quota: {req.get('current', 0)}/{req.get('limit_day', 0)} used today\n")

    # Load existing data
    out_path = Path("data/players-clubs.json")
    existing = json.loads(out_path.read_text(encoding="utf-8"))
    print(f"Loaded {len(existing)} existing entries from {out_path}\n")

    new_entries = 0

    for code, search_names in BACKFILL_TEAMS.items():
        print(f"\n=== {code} ===")

        # Find API-Football team ID
        time.sleep(DELAY)
        team_id = find_team_id(code, search_names)
        if not team_id:
            print(f"  Skipping {code} — could not resolve team ID")
            continue

        # Get API-Football squad
        time.sleep(DELAY)
        apif_players = get_squad(team_id)
        if not apif_players:
            print(f"  WARNING: No squad returned for {code} (team_id={team_id})")
            continue
        print(f"  API-Football squad: {len(apif_players)} players")

        # Load FIFA squad for cross-referencing
        fifa_players = load_fifa_squad(code)
        print(f"  FIFA squad: {len(fifa_players)} players")

        apif_by_number = {p["number"]: p for p in apif_players if p.get("number")}

        matched = 0
        for fp in fifa_players:
            # Skip if already in the output (shouldn't happen for these teams, but be safe)
            if fp["fifaId"] in existing:
                print(f"  {fp['name']:30s} → already present, skipping")
                continue

            apif_match = None
            jersey = fp.get("jerseyNum")
            if jersey and jersey in apif_by_number:
                apif_match = apif_by_number[jersey]

            if not apif_match:
                best_score = 0
                for ap in apif_players:
                    score = name_match_score(fp["name"], ap["name"])
                    if score > best_score:
                        best_score = score
                        if score >= 2:
                            apif_match = ap

            if not apif_match:
                print(f"  {fp['name']:30s} → no API-Football match")
                existing[fp["fifaId"]] = {
                    "fifaId": fp["fifaId"],
                    "name": fp["name"],
                    "club": None,
                    "clubLogo": None,
                    "league": None,
                    "leagueCountry": None,
                    "photoUrl": None,
                }
                new_entries += 1
                continue

            matched += 1
            apif_id = apif_match["id"]
            photo_url = f"https://media.api-sports.io/football/players/{apif_id}.png"

            time.sleep(DELAY)
            club, club_logo, league, league_country = get_player_club(apif_id)

            existing[fp["fifaId"]] = {
                "fifaId": fp["fifaId"],
                "name": fp["name"],
                "apifId": apif_id,
                "club": club,
                "clubLogo": club_logo,
                "league": league,
                "leagueCountry": league_country,
                "photoUrl": photo_url,
            }
            new_entries += 1
            club_display = club or "—"
            print(f"  {fp['name']:30s} → {club_display}")

        print(f"  Matched {matched}/{len(fifa_players)} to API-Football")

    # Write merged output
    out_path.write_text(
        json.dumps(existing, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\n=== Done ===")
    print(f"Added/updated {new_entries} entries")
    print(f"Total entries now: {len(existing)}")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    start = time.time()
    main()
    print(f"\nRuntime: {round((time.time() - start) / 60, 1)} minutes")
