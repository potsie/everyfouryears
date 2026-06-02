/* ============================================================
   match-data.js — /match/{event_id}  (window.WCMatch)
   USA 2–1 ENG · Group B · Matchday 2 · Lumen Field, Seattle
   Live snapshot is 1–1 at 67'. Mirrors ESPN summary shapes.
   ============================================================ */
(function () {
  const home = { code: "USA", name: "United States", flag: "us" };
  const away = { code: "ENG", name: "England", flag: "gb-eng" };

  // ---- key events (chronological). `at` = minute it occurs ----
  // type: goal | pen | og | yellow | red | sub | var
  const events = [
    { at: 23, type: "goal", team: "home", player: "Pulisic", detail: "assist Weah", score: [1, 0] },
    { at: 41, type: "pen", team: "away", player: "Kane", detail: "penalty", score: [1, 1] },
    { at: 45, extra: 2, type: "yellow", team: "away", player: "Rice", detail: "tactical foul" },
    { at: 58, type: "yellow", team: "home", player: "Adams", detail: "late challenge" },
    { at: 64, type: "sub", team: "away", player: "Foden", detail: "Saka off" },
    { at: 66, type: "sub", team: "home", player: "Reyna", detail: "Musah off" },
    // ↓ post-only (after the 67' live snapshot)
    { at: 74, type: "goal", team: "home", player: "Pulisic", detail: "assist McKennie", score: [2, 1] },
    { at: 82, type: "sub", team: "home", player: "Aaronson", detail: "Balogun off" },
    { at: 88, type: "red", team: "away", player: "Stones", detail: "second yellow" },
    { at: 90, extra: 4, type: "whistle", detail: "Full Time" },
  ];

  // ---- team stats (28 ESPN fields → the meaningful 14) ----
  // pct flags a 0–100 share stat (renders the split bar from the raw values).
  const stats = [
    { label: "Possession", home: 46, away: 54, unit: "%", pct: true },
    { label: "Shots", home: 12, away: 15 },
    { label: "Shots on target", home: 6, away: 5 },
    { label: "Big chances", home: 3, away: 4 },
    { label: "Expected goals (xG)", home: 1.84, away: 1.62 },
    { label: "Saves", home: 4, away: 4 },
    { label: "Corners", home: 5, away: 7 },
    { label: "Fouls", home: 11, away: 14 },
    { label: "Offsides", home: 2, away: 3 },
    { label: "Passes", home: 412, away: 503 },
    { label: "Pass accuracy", home: 84, away: 88, unit: "%", pct: true },
    { label: "Tackles", home: 19, away: 16 },
    { label: "Yellow cards", home: 1, away: 1 },
    { label: "Red cards", home: 0, away: 1 },
  ];

  // ---- lineups (lines = GK / DEF / MID / FWD), starter dots + bench ----
  const lineups = {
    home: {
      formation: "4-3-3",
      coach: "Mauricio Pochettino",
      lines: [
        [{ n: 1, name: "Turner" }],
        [{ n: 2, name: "Dest" }, { n: 5, name: "Ream" }, { n: 3, name: "Richards" }, { n: 13, name: "Robinson" }],
        [{ n: 8, name: "McKennie" }, { n: 6, name: "Adams", c: true }, { n: 10, name: "Musah" }],
        [{ n: 11, name: "Weah" }, { n: 9, name: "Balogun" }, { n: 7, name: "Pulisic", star: true }],
      ],
      bench: ["Reyna", "Aaronson", "Sargent", "Tillman", "Scally", "Horvath (GK)"],
    },
    away: {
      formation: "4-2-3-1",
      coach: "Thomas Tuchel",
      lines: [
        [{ n: 1, name: "Pickford" }],
        [{ n: 2, name: "Walker" }, { n: 5, name: "Stones" }, { n: 6, name: "Guéhi" }, { n: 3, name: "Shaw" }],
        [{ n: 4, name: "Rice" }, { n: 8, name: "Mainoo" }],
        [{ n: 7, name: "Saka" }, { n: 10, name: "Bellingham", c: true }, { n: 11, name: "Gordon" }],
        [{ n: 9, name: "Kane", star: true }],
      ],
      bench: ["Foden", "Palmer", "Watkins", "Konsa", "Trippier", "Ramsdale (GK)"],
    },
  };

  // ---- minute-by-minute commentary (newest first) ----
  const commentary = [
    { min: "67'", type: "note", text: "Pulisic drives at the England back line again — Seattle is on its feet. Reyna and Reyna's fresh legs are starting to tell in midfield." },
    { min: "66'", type: "sub", text: "Change for the USA: Gio Reyna replaces Yunus Musah, looking for a spark through the middle." },
    { min: "64'", type: "sub", text: "England turn to the bench — Phil Foden on for Bukayo Saka." },
    { min: "58'", type: "yellow", text: "Booking. Tyler Adams catches Bellingham late as the tempo rises; referee Vinčić has a quiet word." },
    { min: "46'", type: "note", text: "Back underway at Lumen Field. No changes at the break — 1–1, all to play for." },
    { min: "45'+2", type: "yellow", text: "Yellow for Declan Rice, cynically stopping a USA counter on the halfway line." },
    { min: "41'", type: "pen", text: "GOAL! Harry Kane sends Turner the wrong way from the spot. England level it at 1–1 against the run of play." },
    { min: "39'", type: "var", text: "VAR check for a handball in the USA box… penalty awarded after Robinson's arm blocks Saka's cross." },
    { min: "23'", type: "goal", text: "GOAL! Christian Pulisic with the opener! Weah skins Shaw and pulls it back; Pulisic sweeps home first-time. Bedlam in Seattle." },
    { min: "1'", type: "note", text: "We're off. England get us started, kicking left to right in the first half." },
  ];

  // ---- odds (DraftKings) + live win probability ----
  const odds = { home: "+185", draw: "+220", away: "+150", ou: "2.5", spread: "ENG -0.5" };
  const prob = { home: 38, draw: 24, away: 38 }; // live, 67'
  const probPre = { home: 30, draw: 27, away: 43 };

  // ---- head to head (recent meetings) ----
  const h2h = [
    { date: "Nov 2022", comp: "World Cup · Group B", h: "ENG", a: "USA", score: "0–0" },
    { date: "Jun 2018", comp: "Friendly", h: "USA", a: "ENG", score: "1–2" },
    { date: "May 2011", comp: "Friendly", h: "ENG", a: "USA", score: "2–0" },
    { date: "Jun 2010", comp: "World Cup · Group C", h: "ENG", a: "USA", score: "1–1" },
  ];
  const h2hSummary = { usaW: 1, draw: 2, engW: 1 };

  // ---- player of the match (post) ----
  const motm = { name: "Christian Pulisic", team: "USA", line: "2 goals · 1 chance created · 4/5 dribbles" };

  // ---- embedded group B standings (subset for shelf) ----
  const groupB = [
    { code: "USA", flag: "us", pl: 2, gd: "+2", pts: 6, status: "adv", mine: true },
    { code: "ENG", flag: "gb-eng", pl: 2, gd: "+1", pts: 3, status: "adv" },
    { code: "SEN", flag: "sn", pl: 2, gd: "0", pts: 3, status: "best3" },
    { code: "IRN", flag: "ir", pl: 2, gd: "-3", pts: 0, status: "out" },
  ];

  window.WCMatch = {
    home, away, group: "B", matchday: "Matchday 2", round: "Group Stage",
    venue: "Lumen Field", city: "Seattle", tv: "FOX",
    date: "Wed, June 17, 2026", kickoff: "2:00 PM PT", kickoffShort: "2:00 PM",
    attendance: "68,740", referee: "Slavko Vinčić · SVN", capacity: "68,740",
    clockLive: "67'", scoreLive: [1, 1], scoreFinal: [2, 1],
    events, stats, lineups, commentary, odds, prob, probPre, h2h, h2hSummary, motm, groupB,
  };
})();
