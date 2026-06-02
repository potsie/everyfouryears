import json
import requests

# The v3 API endpoint you discovered!
FIFA_API_URL = "https://api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule?rankingScheduleId=FRS_Male_Football_20260119&language=en"

# Map FIFA's specific names to your ESPN dataset names
NAME_OVERRIDES = {
    "Côte d'Ivoire": "Ivory Coast",
    "Bosnia and Herzegovina": "Bosnia-Herzegovina",
    "USA": "United States",
    "Korea Republic": "South Korea",
    "IR Iran": "Iran",
    "Congo DR": "Congo DR", 
    "Cape Verde Islands": "Cape Verde",
    "Türkiye": "Türkiye",
    "Czechia": "Czechia",
    "Cabo Verde": "Cape Verde",
    "Curaçao": "Curacao" 
}

def build_supplemental_data():
    print("Loading ESPN World Cup rosters...")
    try:
        with open('world_cup_2026_rosters.json', 'r', encoding='utf-8') as f:
            rosters = json.load(f)
    except FileNotFoundError:
        print("Error: 'world_cup_2026_rosters.json' not found in this directory.")
        return
        
    wc_teams = {team['teamName']: team['teamId'] for team in rosters}
    
    print(f"Fetching live rankings from FIFA v3 API...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
    } 
    response = requests.get(FIFA_API_URL, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to fetch rankings. Status code: {response.status_code}")
        return
        
    fifa_data = response.json()
    
    # Grab the target array based on your response.txt discovery
    rankings_list = fifa_data.get('Results', [])
    
    if not rankings_list:
        print("Error: Could not find the 'Results' array in the payload.")
        return

    supplemental_records = []
    
    for team in rankings_list:
        # Extract the country name from the nested TeamName array
        team_name_list = team.get('TeamName', [])
        raw_name = team_name_list[0].get('Description') if team_name_list else None
        
        if not raw_name:
            continue
            
        # Apply any overrides (e.g., "USA" -> "United States")
        country_name = NAME_OVERRIDES.get(raw_name, raw_name)
        
        # If this FIFA team is one of our 48 World Cup teams, save them!
        if country_name in wc_teams:
            espn_id = wc_teams[country_name]
            
            # Build the clean record
            record = {
                "espn_id": espn_id,
                "team_name": country_name,
                "fifa_ranking": team.get('Rank'), 
                "fifa_points": round(team.get('TotalPoints', 0), 2), 
                "confederation": team.get('ConfederationName'),
                "world_cup_appearances": None, 
                "head_coach": None,
                "nickname": None
            }
            supplemental_records.append(record)
            print(f"Matched: {country_name:<20} | Rank: {record['fifa_ranking']:<3} | Points: {record['fifa_points']}")
            
    output_filename = "teams-supplemental.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(supplemental_records, f, indent=2, ensure_ascii=False)
        
    print(f"\nSuccess! Compiled {len(supplemental_records)} records into {output_filename}")

if __name__ == "__main__":
    build_supplemental_data()