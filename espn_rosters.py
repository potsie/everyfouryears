import json
import time
import requests

# Base Configurations
LEAGUE = "fifa.world"
SEASON = "2026"
TEAMS_URL = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{LEAGUE}/teams"

# Session to optimize connection pooling
session = requests.Session()
session.headers.update(
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
)


def fetch_json(url):
    """Helper to safely fetch JSON data from a URL."""
    try:
        response = session.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching {url}: Status {response.status_code}")
    except Exception as e:
        print(f"Exception fetching {url}: {e}")
    return None


def get_all_players():
    all_world_cup_data = []

    # 1. Fetch all 48 qualified World Cup teams
    print("Fetching qualified teams...")
    teams_data = fetch_json(TEAMS_URL)
    if not teams_data or "sports" not in teams_data:
        print("Failed to retrieve teams list.")
        return

    # Extract teams from the nested structure
    teams_list = teams_data["sports"][0]["leagues"][0]["teams"]
    total_teams = len(teams_list)
    print(f"Found {total_teams} teams. Beginning roster extraction...\n")

    for idx, team_wrapper in enumerate(teams_list, 1):
        team = team_wrapper["team"]
        team_id = team["id"]
        team_name = team["displayName"]
        team_abbr = team.get("abbreviation", "")

        print(
            f"[{idx}/{total_teams}] Processing {team_name} (ID: {team_id})..."
        )

        # 2. Get the athlete links for this specific team roster
        roster_url = f"https://sports.core.api.espn.com/v2/sports/soccer/leagues/{LEAGUE}/seasons/{SEASON}/teams/{team_id}/athletes?limit=50"
        roster_data = fetch_json(roster_url)

        if not roster_data or "items" not in roster_data:
            print(f"   Skipping {team_name}: No roster data found.")
            continue

        player_refs = roster_data["items"]
        print(f"   Found {len(player_refs)} athletes. Fetching details...")

        team_players = []

        # 3. Iterate through each player reference link to resolve full bio details
        for ref_obj in player_refs:
            player_endpoint = ref_obj["$ref"]
            player_bio = fetch_json(player_endpoint)

            if player_bio:
                # Extracting all suggested bio fields from the documentation
                player_details = {
                    "id": player_bio.get("id"),
                    "displayName": player_bio.get("displayName"),
                    "shortName": player_bio.get("shortName"),
                    "position": player_bio.get("position", {}).get("name"),
                    "age": player_bio.get("age"),
                    "height_inches": player_bio.get("height"),
                    "weight_lbs": player_bio.get("weight"),
                    "displayHeight": player_bio.get("displayHeight"),
                    "displayWeight": player_bio.get("displayWeight"),
                    "dateOfBirth": player_bio.get("dateOfBirth"),
                    "citizenship": player_bio.get("citizenship"),
                    "headshot_url": player_bio.get("headshot", {}).get("href"),
                    "flag_url": player_bio.get("flag", {}).get("href"),
                    "status": player_bio.get("status", {}).get("name"),
                }
                team_players.append(player_details)

            # Politeness delay to prevent aggressive scraping blocks
            time.sleep(0.1)

        # Append team's roster to our primary list
        all_world_cup_data.append(
            {
                "teamId": team_id,
                "teamName": team_name,
                "teamAbbreviation": team_abbr,
                "roster": team_players,
            }
        )

        print(f"   Successfully compiled roster for {team_name}.\n")
        time.sleep(0.5)  # Rest briefly between teams

    # 4. Save results to a structured JSON file
    output_filename = "world_cup_2026_rosters.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(all_world_cup_data, f, indent=2, ensure_ascii=False)

    print(f"🎉 Complete! Data successfully compiled into '{output_filename}'")


if __name__ == "__main__":
    start_time = time.time()
    get_all_players()
    print(f"Execution duration: {round((time.time() - start_time) / 60, 2)} minutes.")