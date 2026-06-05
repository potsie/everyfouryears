"""
fetch_player_clubs.py
One-time script to pull club affiliations and photo URLs for all 2026 WC players
via API-Football (api-sports.io). Requires a paid plan (7,500 req/day).

Outputs: data/players-clubs.json
  {
    "<fifa_player_id>": {
      "fifaId": "...",
      "name": "...",
      "club": "AC Milan",
      "clubLogo": "https://...",
      "league": "Serie A",
      "leagueCountry": "Italy",
      "photoUrl": "https://media.api-sports.io/football/players/17.png"
    },
    ...
  }

Usage: python3 fetch_player_clubs.py
"""

import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

API_KEY = "6dcfbcb3fa9de3e191fe9e615d481519"
BASE = "https://v3.football.api-sports.io"
HEADERS = {"x-apisports-key": API_KEY}

# Delay between requests to stay under rate limits (30 req/min on starter plan)
DELAY = 2.2

# Known API-Football national team IDs from WC 2022 data
KNOWN_TEAM_IDS = {
    "ARG": 26,
    "AUS": 20,
    "BEL": 1,
    "BRA": 6,
    "CAN": 5529,
    "CRO": 3,
    "ECU": 2382,
    "ENG": 10,
    "ESP": 9,
    "FRA": 2,
    "GER": 25,
    "GHA": 1504,
    "IRN": 22,
    "JPN": 12,
    "KOR": 17,
    "KSA": 23,
    "MAR": 31,
    "MEX": 16,
    "NED": 1118,
    "POR": 27,
    "QAT": 1569,
    "SEN": 13,
    "SUI": 15,
    "TUN": 28,
    "URU": 7,
    "USA": 2384,
}

# Search terms for teams not in 2022 WC
SEARCH_TERMS = {
    "ALG": "Algeria",
    "AUT": "Austria",
    "BIH": "Bosnia",
    "CPV": "Cape Verde",
    "COL": "Colombia",
    "COD": "Congo DR",
    "CUW": "Curacao",
    "CZE": "Czech Republic",
    "EGY": "Egypt",
    "HAI": "Haiti",
    "IRQ": "Iraq",
    "CIV": "Ivory Coast",
    "JOR": "Jordan",
    "NZL": "New Zealand",
    "NOR": "Norway",
    "PAN": "Panama",
    "PAR": "Paraguay",
    "RSA": "South Africa",
    "SCO": "Scotland",
    "SWE": "Sweden",
    "TUR": "Turkey",
    "UZB": "Uzbekistan",
}


def fetch(path):
    url = BASE + path
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def find_team_id(code, search_name):
    """Search for national team ID by name."""
    encoded = urllib.parse.quote(search_name)
    result = fetch(f"/teams?name={encoded}&type=national")
    teams = result.get("response", [])
    if teams:
        t = teams[0]["team"]
        print(f"  Found {code}: ID={t['id']} name={t['name']}")
        return t["id"]
    # Try without type filter
    result = fetch(f"/teams?name={encoded}")
    for r in result.get("response", []):
        if r["team"].get("national"):
            t = r["team"]
            print(f"  Found {code} (fallback): ID={t['id']} name={t['name']}")
            return t["id"]
    print(f"  WARNING: Could not find team ID for {code} ({search_name})")
    return None


def get_squad(team_id):
    """Get squad for a team — returns list of {id, name, number, position}."""
    result = fetch(f"/players/squads?team={team_id}")
    if not result.get("response"):
        return []
    return result["response"][0].get("players", [])


def get_player_club(player_id, season=2025):
    """Get current club for a player via season stats."""
    result = fetch(f"/players?id={player_id}&season={season}")
    response = result.get("response", [])
    if not response:
        # Fall back to 2024
        if season == 2025:
            return get_player_club(player_id, season=2024)
        return None, None, None, None

    stats = response[0].get("statistics", [])

    # Keywords that identify cup/secondary competitions to deprioritize
    CUP_KEYWORDS = (
        "cup", "coupe", "copa", "pokal", "beker", "taca", "coppa",
        "super cup", "supercup", "supercoupe", "shield", "trophy",
        "league cup", "carabao", "fa cup", "dfb", "champions league",
        "europa league", "conference league", "nations league", "friendl",
    )

    def is_cup(league_name):
        n = (league_name or "").lower()
        return any(k in n for k in CUP_KEYWORDS)

    club_stats = [
        s for s in stats
        if s.get("league", {}).get("country") not in ("World", None)
        and not s.get("team", {}).get("national", False)
    ]

    # Pass 1: prefer domestic league with appearances, skipping cups
    for s in club_stats:
        league = s.get("league", {})
        games = s.get("games", {})
        if not is_cup(league.get("name")) and (games.get("appearences", 0) or games.get("lineups", 0)):
            return (
                s["team"].get("name"),
                s["team"].get("logo"),
                league.get("name"),
                league.get("country"),
            )

    # Pass 2: any domestic league entry (0 appearances ok), still skipping cups
    for s in club_stats:
        league = s.get("league", {})
        if not is_cup(league.get("name")):
            return (
                s["team"].get("name"),
                s["team"].get("logo"),
                league.get("name"),
                league.get("country"),
            )

    # Pass 3: last resort — take any club entry including cups
    if club_stats:
        s = club_stats[0]
        return (
            s["team"].get("name"),
            s["team"].get("logo"),
            s["league"].get("name"),
            s["league"].get("country"),
        )

    return None, None, None, None


def normalize_name(name):
    """Lowercase, strip accents loosely, for fuzzy matching."""
    import unicodedata
    name = unicodedata.normalize("NFD", name)
    name = "".join(c for c in name if unicodedata.category(c) != "Mn")
    return name.lower().strip()


def name_match_score(fifa_name, apif_name):
    """Score 0–3: how well two player names match across ID systems.
    FIFA: 'Christian PULISIC' or 'Kylian MBAPPE'
    APIF: 'C. Pulišić' or 'K. Mbappé'
    """
    fn = normalize_name(fifa_name)
    an = normalize_name(apif_name)

    fn_parts = fn.split()
    an_parts = an.split()

    score = 0
    # Check if last name segment matches
    fn_last = fn_parts[-1] if fn_parts else ""
    an_last = an_parts[-1] if an_parts else ""
    if fn_last and an_last and (fn_last == an_last or fn_last in an_last or an_last in fn_last):
        score += 2
    # Check if first initial matches
    if fn_parts and an_parts:
        fn_first = fn_parts[0][0] if fn_parts[0] else ""
        an_first = an_parts[0].rstrip(".")[0] if an_parts[0] else ""
        if fn_first and an_first and fn_first == an_first:
            score += 1
    return score


def load_fifa_squads():
    """Load FIFA squad data from the already-fetched cache if available,
    otherwise call the FIFA API directly."""
    # Try the .cache directory first
    cache_candidates = list(Path(".cache").glob("fifa-wc2026-squads*")) if Path(".cache").exists() else []
    if cache_candidates:
        with open(cache_candidates[0]) as f:
            raw = json.load(f)
            data = raw.get("data", raw)
            if isinstance(data, list):
                return data

    # Fall back to fetching directly
    print("Fetching FIFA squads directly...")
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    import re
    url = "https://api.fifa.com/api/v3/teams/squads/all/17/285023?language=en"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        raw = re.sub(r"[\x00-\x1f]", "", r.read().decode("utf-8", "replace"))
        d = json.loads(raw)
        return d.get("Results", d) if isinstance(d, dict) else d


def main():
    print("=== fetch_player_clubs.py ===")
    print("Fetching club affiliations for all 2026 WC players via API-Football\n")

    # Step 1: Check quota
    status = fetch("/status")
    if status.get("response"):
        req = status["response"].get("requests", {})
        print(f"API quota: {req.get('current', 0)}/{req.get('limit_day', 0)} used today\n")

    # Step 2: Build complete team ID map
    print("=== Step 1: Resolving API-Football team IDs ===")
    team_ids = dict(KNOWN_TEAM_IDS)
    for code, search_name in SEARCH_TERMS.items():
        time.sleep(DELAY)
        team_id = find_team_id(code, search_name)
        if team_id:
            team_ids[code] = team_id

    print(f"\nResolved {len(team_ids)}/48 team IDs\n")

    # Step 3: Load FIFA squad data (FIFA IDs + player names + jersey numbers)
    print("=== Step 2: Loading FIFA squad data ===")
    fifa_squads_raw = load_fifa_squads()
    # Build map: country_code -> list of {fifaId, name, jerseyNum, position}
    fifa_squads = {}
    for team in fifa_squads_raw:
        code = team.get("IdCountry") or team.get("countryCode", "")
        players = team.get("Players") or team.get("players", [])
        fifa_squads[code] = []
        for p in players:
            # Handle both raw FIFA API shape and normalized FifaSquadPlayer shape
            if "IdPlayer" in p:
                fifa_squads[code].append({
                    "fifaId": str(p["IdPlayer"]),
                    "name": p.get("PlayerName", [{}])[0].get("Description", ""),
                    "jerseyNum": p.get("JerseyNum"),
                    "position": p.get("Position", 0),
                })
            else:
                # Normalized shape from wc-fetchers
                fifa_squads[code].append({
                    "fifaId": p.get("fifaId", ""),
                    "name": p.get("name", ""),
                    "jerseyNum": p.get("jerseyNum"),
                    "position": p.get("position", ""),
                })

    print(f"Loaded FIFA squads for {len(fifa_squads)} teams\n")

    # Step 4: For each team, get API-Football squad and cross-reference
    print("=== Step 3: Fetching squads + club data ===")
    output = {}
    total_matched = 0
    total_with_club = 0

    for code, team_id in sorted(team_ids.items()):
        print(f"\n[{code}] team_id={team_id}")
        time.sleep(DELAY)

        apif_players = get_squad(team_id)
        fifa_players = fifa_squads.get(code, [])

        if not apif_players:
            print(f"  WARNING: No squad returned for {code}")
            continue

        # Cross-reference: match FIFA players to API-Football players
        # Primary key: jersey number (most reliable)
        # Fallback: name similarity
        apif_by_number = {p["number"]: p for p in apif_players if p.get("number")}

        matched = 0
        for fp in fifa_players:
            apif_match = None

            # Try jersey number match first
            jersey = fp.get("jerseyNum")
            if jersey and jersey in apif_by_number:
                apif_match = apif_by_number[jersey]

            # Fall back to name matching
            if not apif_match:
                best_score = 0
                for ap in apif_players:
                    score = name_match_score(fp["name"], ap["name"])
                    if score > best_score:
                        best_score = score
                        if score >= 2:
                            apif_match = ap

            if not apif_match:
                output[fp["fifaId"]] = {
                    "fifaId": fp["fifaId"],
                    "name": fp["name"],
                    "club": None,
                    "clubLogo": None,
                    "league": None,
                    "leagueCountry": None,
                    "photoUrl": None,
                }
                continue

            matched += 1
            apif_id = apif_match["id"]
            photo_url = f"https://media.api-sports.io/football/players/{apif_id}.png"

            time.sleep(DELAY)
            club, club_logo, league, league_country = get_player_club(apif_id)

            if club:
                total_with_club += 1

            output[fp["fifaId"]] = {
                "fifaId": fp["fifaId"],
                "name": fp["name"],
                "apifId": apif_id,
                "club": club,
                "clubLogo": club_logo,
                "league": league,
                "leagueCountry": league_country,
                "photoUrl": photo_url,
            }

            club_display = club or "—"
            print(f"  {fp['name']:30s} → {club_display}")

        total_matched += matched
        print(f"  Matched {matched}/{len(fifa_players)} players")

        # Checkpoint after each team
        out_path = Path("data/players-clubs.json")
        out_path.parent.mkdir(exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f"  Checkpoint saved ({len(output)} players so far)")

    print(f"\n=== Done ===")
    print(f"Total players: {len(output)}")
    print(f"Matched to API-Football: {total_matched}")
    print(f"With club data: {total_with_club}")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    start = time.time()
    main()
    print(f"\nRuntime: {round((time.time() - start) / 60, 1)} minutes")
