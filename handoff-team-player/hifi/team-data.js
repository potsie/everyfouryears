/* ============================================================
   team-data.js — /team/{abbr} · /team/{abbr}/roster · /player/{id}
   window.WCTeam — USA profile, 26-man squad, player detail (Pulisic)
   ============================================================ */
(function () {
  const team = (window.WC && window.WC.team) || ((code) => ({ code, name: code, flag: code.toLowerCase() }));

  // ---- 26-man squad. pos: GK/DEF/MID/FWD ----
  const squad = [
    // GK
    { n: 1, name: "Matt Turner", pos: "GK", club: "Crystal Palace", cc: "gb-eng", age: 32, caps: 49, g: 0, star: false },
    { n: 12, name: "Patrick Schulte", pos: "GK", club: "Columbus Crew", cc: "us", age: 25, caps: 6, g: 0 },
    { n: 22, name: "Zack Steffen", pos: "GK", club: "Colorado Rapids", cc: "us", age: 31, caps: 30, g: 0 },
    // DEF
    { n: 2, name: "Sergiño Dest", pos: "DEF", club: "PSV Eindhoven", cc: "nl", age: 25, caps: 36, g: 2 },
    { n: 3, name: "Chris Richards", pos: "DEF", club: "Crystal Palace", cc: "gb-eng", age: 26, caps: 24, g: 2 },
    { n: 5, name: "Tim Ream", pos: "DEF", club: "Charlotte FC", cc: "us", age: 38, caps: 65, g: 1 },
    { n: 13, name: "Antonee Robinson", pos: "DEF", club: "Fulham", cc: "gb-eng", age: 28, caps: 45, g: 3 },
    { n: 4, name: "Cameron Carter-Vickers", pos: "DEF", club: "Celtic", cc: "gb-sct", age: 28, caps: 17, g: 0 },
    { n: 15, name: "Joe Scally", pos: "DEF", club: "Bor. M'gladbach", cc: "de", age: 23, caps: 14, g: 0 },
    { n: 20, name: "Miles Robinson", pos: "DEF", club: "FC Cincinnati", cc: "us", age: 29, caps: 31, g: 2 },
    { n: 23, name: "Mark McKenzie", pos: "DEF", club: "Toulouse", cc: "fr", age: 27, caps: 16, g: 0 },
    { n: 24, name: "Marlon Fossey", pos: "DEF", club: "Standard Liège", cc: "be", age: 27, caps: 4, g: 0 },
    // MID
    { n: 6, name: "Tyler Adams", pos: "MID", club: "AFC Bournemouth", cc: "gb-eng", age: 27, caps: 41, g: 1, captain: true },
    { n: 8, name: "Weston McKennie", pos: "MID", club: "Juventus", cc: "it", age: 27, caps: 56, g: 11 },
    { n: 10, name: "Yunus Musah", pos: "MID", club: "AC Milan", cc: "it", age: 23, caps: 39, g: 0 },
    { n: 7, name: "Gio Reyna", pos: "MID", club: "Bor. Dortmund", cc: "de", age: 23, caps: 30, g: 6 },
    { n: 16, name: "Johnny Cardoso", pos: "MID", club: "Atlético Madrid", cc: "es", age: 24, caps: 25, g: 1 },
    { n: 18, name: "Tanner Tessmann", pos: "MID", club: "Olympique Lyon", cc: "fr", age: 24, caps: 12, g: 1 },
    { n: 19, name: "Malik Tillman", pos: "MID", club: "Bayer Leverkusen", cc: "de", age: 24, caps: 22, g: 5 },
    // FWD
    { n: 11, name: "Christian Pulisic", pos: "FWD", club: "AC Milan", cc: "it", age: 27, caps: 78, g: 32, captain: false, star: true, id: "pulisic" },
    { n: 9, name: "Folarin Balogun", pos: "FWD", club: "AS Monaco", cc: "mc", age: 24, caps: 19, g: 6 },
    { n: 21, name: "Tim Weah", pos: "FWD", club: "Juventus", cc: "it", age: 26, caps: 44, g: 6 },
    { n: 17, name: "Brenden Aaronson", pos: "FWD", club: "Leeds United", cc: "gb-eng", age: 25, caps: 47, g: 8 },
    { n: 14, name: "Ricardo Pepi", pos: "FWD", club: "PSV Eindhoven", cc: "nl", age: 23, caps: 30, g: 12 },
    { n: 25, name: "Haji Wright", pos: "FWD", club: "Coventry City", cc: "gb-eng", age: 28, caps: 18, g: 5 },
    { n: 26, name: "Josh Sargent", pos: "FWD", club: "Norwich City", cc: "gb-eng", age: 26, caps: 27, g: 6 },
  ];

  // ---- team profile ----
  const profile = {
    team: team("USA"), nickname: "USMNT", fifaRank: 11, confederation: "CONCACAF",
    coach: "Mauricio Pochettino", coachCountry: "ar", captain: "Tyler Adams", founded: 1913,
    group: "B", rank: 1, pts: 6, played: 2, kit: "White / Navy",
    wc: { apps: 12, best: "3rd place", bestYear: "1930", last: "Round of 16 · 2022", debut: 1930 },
    next: { opp: team("ENG"), when: "Wed, Jun 17 · 2:00 PM PT", venue: "Lumen Field, Seattle" },
    form: [
      { opp: "IRN", res: "W", score: "2–1", comp: "Group B · MD1" },
      { opp: "SEN", res: "W", score: "1–0", comp: "Group B · MD2" },
      { opp: "MEX", res: "W", score: "2–0", comp: "Send-off friendly" },
      { opp: "CAN", res: "D", score: "1–1", comp: "Nations League F" },
      { opp: "JPN", res: "L", score: "0–2", comp: "Friendly" },
    ],
    leaders: [
      { k: "Top scorer", name: "Christian Pulisic", v: "2", sub: "goals", flag: "us" },
      { k: "Most caps", name: "Christian Pulisic", v: "78", sub: "appearances", flag: "us" },
      { k: "Assists", name: "Weston McKennie", v: "2", sub: "this WC", flag: "us" },
    ],
    history: [
      { y: "1930", r: "Third place", hl: true },
      { y: "1994", r: "Round of 16" },
      { y: "2002", r: "Quarter-finals" },
      { y: "2014", r: "Round of 16" },
      { y: "2022", r: "Round of 16" },
      { y: "2026", r: "Group stage", live: true },
    ],
  };
  // group B standings (for the "at the tournament" mini table)
  const groupB = (window.WCMatch && window.WCMatch.groupB) || [
    { code: "USA", flag: "us", pl: 2, gd: "+2", pts: 6, status: "adv", mine: true },
    { code: "ENG", flag: "gb-eng", pl: 2, gd: "+1", pts: 3, status: "adv" },
    { code: "SEN", flag: "sn", pl: 2, gd: "0", pts: 3, status: "best3" },
    { code: "IRN", flag: "ir", pl: 2, gd: "-3", pts: 0, status: "out" },
  ];

  // ---- player detail (keyed by id) ----
  const players = {
    pulisic: {
      n: 10, name: "Christian Pulisic", first: "Christian", last: "Pulisic",
      team: team("USA"), pos: "Forward · Winger", club: "AC Milan", cc: "it",
      age: 27, height: "1.77 m", foot: "Right", value: "€55.0M",
      born: "Hershey, PA, USA", dob: "Sep 18, 1998", caps: 78, intlGoals: 32,
      tournament: { apps: 2, goals: 2, assists: 1, minutes: 180, shots: 7, sot: 4, chances: 5, dribbles: "8/10", rating: 8.4 },
      per90: [
        { k: "Goals", v: 1.0 }, { k: "Shots", v: 3.5 }, { k: "Chances created", v: 2.5 },
        { k: "Dribbles", v: 4.0 }, { k: "Touches", v: 58 },
      ],
      career: [
        { club: "PA Classics (youth)", years: "—2015", cc: "us" },
        { club: "Borussia Dortmund", years: "2016–2019", cc: "de", apps: 127, g: 19 },
        { club: "Chelsea", years: "2019–2024", cc: "gb-eng", apps: 145, g: 26 },
        { club: "AC Milan", years: "2024–", cc: "it", apps: 58, g: 23 },
      ],
      wcHistory: [
        { year: "2022", team: "USA", apps: 4, g: 1, note: "Round of 16" },
        { year: "2026", team: "USA", apps: 2, g: 2, note: "Group stage", live: true },
      ],
    },
  };

  window.WCTeam = { squad, profile, groupB, players };
})();
