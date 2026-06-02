/* ============================================================
   schedule-data.js — full 2026 tournament fixture list
   Builds window.WCSchedule from window.WC (data.js must load first).

   Shapes intentionally mirror WorldCupMatchNormalized so the
   coding pass can swap in fetchAllMatches() with minimal mapping:
     match = { id, no, group, stage, round, date(ms), kickoff,
               state:'pre'|'in'|'post', clock, score:[a,b]|null,
               a, b, venue, city, tv }
     team  = { code, name, flag }  | { tbd:true, seed:'1A' }
   ============================================================ */
(function () {
  const WC = window.WC;

  // round-robin pairings for a group of 4 (indices into grp.teams)
  const RR = [
    [[0, 1], [2, 3]], // Matchday 1
    [[0, 2], [3, 1]], // Matchday 2
    [[0, 3], [1, 2]], // Matchday 3
  ];

  // 16 host venues (2026)
  const VEN = [
    ["MetLife Stadium", "East Rutherford"], ["SoFi Stadium", "Inglewood"],
    ["AT&T Stadium", "Arlington"], ["Lumen Field", "Seattle"],
    ["NRG Stadium", "Houston"], ["Mercedes-Benz Stadium", "Atlanta"],
    ["Arrowhead Stadium", "Kansas City"], ["Levi's Stadium", "Santa Clara"],
    ["Hard Rock Stadium", "Miami"], ["Lincoln Financial Field", "Philadelphia"],
    ["Gillette Stadium", "Foxborough"], ["BMO Stadium", "Los Angeles"],
    ["Estadio Azteca", "Mexico City"], ["Estadio Akron", "Guadalajara"],
    ["Estadio BBVA", "Monterrey"], ["BC Place", "Vancouver"],
  ];
  const TV = ["FOX", "FS1", "Telemundo", "Peacock", "Universo"];
  const SLOT = ["12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"];

  const DOW3 = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const DOWF = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const TODAY = new Date(2026, 5, 17, 12).getTime(); // Wed Jun 17, 2026 — "today"
  const dayMs = 864e5;
  const dkey = (t) => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const noon = (t) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime(); };
  // deterministic, plausible scoreline from a match index
  const scoreFor = (i) => [(i * 7 + 3) % 4, (i * 5 + 1) % 4];

  /* ---------- group stage (72 matches) ---------- */
  const raw = [];
  WC.groups.forEach((grp, gi) => {
    RR.forEach((pairs, md) => {
      pairs.forEach(([x, y], pi) => {
        const a = grp.teams[x], b = grp.teams[y];
        raw.push({
          group: grp.g, md, _o: md * 1000 + gi * 10 + pi,
          a: { code: a.code, name: a.name, flag: a.flag },
          b: { code: b.code, name: b.name, flag: b.flag },
        });
      });
    });
  });
  raw.sort((p, q) => p._o - q._o); // all MD1, then MD2, then MD3

  const base = new Date(2026, 5, 11, 12).getTime(); // Jun 11
  // Per-matchday date config — group stage runs Jun 11–27, knockout begins Jun 28.
  // MD1 Jun 11–16, MD2 Jun 17–22, MD3 packed into Jun 23–27 (final-matchday games
  // kick off simultaneously, as in the real tournament).
  const MDCFG = [
    { base: 0, perDay: 4, times: ["12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"] },
    { base: 6, perDay: 4, times: ["12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"] },
    { base: 12, perDay: 5, times: ["11:00 AM", "2:00 PM", "2:00 PM", "6:00 PM", "6:00 PM"] },
  ];
  const gs = raw.map((m, idx) => {
    const cfg = MDCFG[m.md];
    const local = idx - m.md * 24;        // position within this matchday's 24 fixtures
    const off = cfg.base + Math.floor(local / cfg.perDay);
    const pos = local % cfg.perDay;
    const date = noon(base + off * dayMs);
    let state = "pre", clock = null, score = null;
    if (date < TODAY) { state = "post"; clock = "FT"; score = scoreFor(idx); }
    else if (date === TODAY) {
      if (pos === 0) { state = "post"; clock = "FT"; score = scoreFor(idx); }
      else if (pos === 1) { state = "in"; clock = "67'"; score = scoreFor(idx); }
      else if (pos === 2) { state = "in"; clock = "23'"; score = scoreFor(idx); }
    }
    const ven = VEN[idx % VEN.length];
    return {
      id: "g" + (idx + 1), no: idx + 1, group: m.group, md: m.md,
      stage: "Group " + m.group, round: "Matchday " + (m.md + 1),
      date, kickoff: cfg.times[pos], state, clock, score,
      a: m.a, b: m.b, venue: ven[0], city: ven[1], tv: TV[idx % TV.length],
    };
  });

  /* ---------- knockout (32 matches, schematic seeds — confirmed after group stage) ---------- */
  const ko = [];
  let no = 72;
  function koRound(round, abbr, pairs, startMs, perDay, times) {
    pairs.forEach((pair, i) => {
      no++;
      const off = Math.floor(i / perDay);
      const date = noon(startMs + off * dayMs);
      const ven = VEN[no % VEN.length];
      ko.push({
        id: "k" + no, no, group: "", stage: round, round, koAbbr: abbr,
        date, kickoff: times[i % perDay], state: "pre", clock: null, score: null,
        a: { tbd: true, seed: pair[0] }, b: { tbd: true, seed: pair[1] },
        venue: ven[0], city: ven[1], tv: TV[no % TV.length],
      });
    });
  }
  const r32 = [
    ["1A", "3C/E/F"], ["1C", "3D/E/F"], ["1E", "3A/B/F"], ["1G", "3A/B/C"],
    ["1B", "3A/E/F"], ["1D", "3B/E/F"], ["1F", "3A/B/C"], ["1H", "3C/D/G"],
    ["1I", "2L"], ["1J", "2K"], ["1K", "2J"], ["1L", "2I"],
    ["2A", "2C"], ["2B", "2D"], ["2E", "2G"], ["2F", "2H"],
  ];
  const r16 = [["W73", "W74"], ["W75", "W76"], ["W77", "W78"], ["W79", "W80"], ["W81", "W82"], ["W83", "W84"], ["W85", "W86"], ["W87", "W88"]];
  const qf = [["W89", "W90"], ["W91", "W92"], ["W93", "W94"], ["W95", "W96"]];
  const sf = [["W97", "W98"], ["W99", "W100"]];
  const koEve = ["3:00 PM", "8:00 PM"];
  koRound("Round of 32", "R32", r32, new Date(2026, 5, 28, 12).getTime(), 4, SLOT);
  koRound("Round of 16", "R16", r16, new Date(2026, 6, 4, 12).getTime(), 2, koEve);
  koRound("Quarterfinals", "QF", qf, new Date(2026, 6, 9, 12).getTime(), 2, koEve);
  koRound("Semifinals", "SF", sf, new Date(2026, 6, 14, 12).getTime(), 1, ["8:00 PM"]);
  koRound("Third-place Playoff", "3rd", [["L101", "L102"]], new Date(2026, 6, 18, 12).getTime(), 1, ["3:00 PM"]);
  koRound("Final", "Final", [["W101", "W102"]], new Date(2026, 6, 19, 12).getTime(), 1, ["3:00 PM"]);

  /* ---------- group into days ---------- */
  const all = gs.concat(ko);
  const byKey = {};
  all.forEach((m) => { (byKey[m.date] || (byKey[m.date] = [])).push(m); });
  const days = Object.keys(byKey).map(Number).sort((a, b) => a - b).map((t) => {
    const ms = byKey[t].sort((a, b) => a.no - b.no);
    const d = new Date(t);
    const phase = ms[0].group ? "group" : "ko";
    const rounds = [...new Set(ms.map((m) => m.round))];
    return {
      key: dkey(t), ms: t, dow: DOW3[d.getDay()], num: d.getDate(),
      mon3: MON[d.getMonth()].slice(0, 3).toUpperCase(),
      dateLabel: DOWF[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate(),
      phase, stageLabel: rounds.length === 1 ? rounds[0] : (phase === "group" ? "Group Stage" : "Knockout"),
      isToday: t === TODAY, matches: ms,
    };
  });

  /* ---------- per-group fixtures (for group detail) ---------- */
  const groupFixtures = {};
  gs.forEach((m) => { (groupFixtures[m.group] || (groupFixtures[m.group] = [])).push(m); });

  window.WCSchedule = {
    days, groupFixtures, all,
    totalMatches: all.length,
    todayKey: "2026-06-17",
    window: "Jun 11 – Jul 19, 2026",
  };
})();
