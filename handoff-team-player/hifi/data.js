/* ============================================================
   data.js — realistic 2026 World Cup mock data (window.WC)
   Mirrors ESPN shapes loosely so it ports cleanly later.
   ============================================================ */
(function () {
  // code -> [ name, ISO-3166 code for flagcdn.com ]
  const T = {
    USA:["United States","us"], ENG:["England","gb-eng"], FRA:["France","fr"], CRO:["Croatia","hr"],
    BRA:["Brazil","br"], SRB:["Serbia","rs"], ESP:["Spain","es"], JPN:["Japan","jp"],
    MEX:["Mexico","mx"], RSA:["South Africa","za"], NOR:["Norway","no"], KSA:["Saudi Arabia","sa"],
    SEN:["Senegal","sn"], IRN:["Iran","ir"], BEL:["Belgium","be"], MAR:["Morocco","ma"],
    CAN:["Canada","ca"], QAT:["Qatar","qa"], AUS:["Australia","au"], PAN:["Panama","pa"],
    GER:["Germany","de"], CPV:["Cape Verde","cv"], ARG:["Argentina","ar"], POR:["Portugal","pt"],
    EGY:["Egypt","eg"], NZL:["New Zealand","nz"], COL:["Colombia","co"], KOR:["South Korea","kr"],
    NED:["Netherlands","nl"], URU:["Uruguay","uy"], GHA:["Ghana","gh"], UZB:["Uzbekistan","uz"],
    SUI:["Switzerland","ch"], ECU:["Ecuador","ec"], TUN:["Tunisia","tn"], JOR:["Jordan","jo"],
    SWE:["Sweden","se"], CIV:["Ivory Coast","ci"], PAR:["Paraguay","py"], HAI:["Haiti","ht"],
    TUR:["Türkiye","tr"], SCO:["Scotland","gb-sct"], IRQ:["Iraq","iq"], CUW:["Curaçao","cw"],
    AUT:["Austria","at"], CZE:["Czechia","cz"], BIH:["Bosnia & Herz.","ba"], ALG:["Algeria","dz"],
  };
  const team = (code) => ({ code, name: (T[code]||[code,code.toLowerCase()])[0], flag: (T[code]||[code,code.toLowerCase()])[1] });

  // ---- today's matches (live matchday) ----
  const today = [
    { id:"m1", group:"B", a:team("USA"), b:team("ENG"), score:[1,1], state:"in", minute:67, clock:"67'",
      venue:"Lumen Field", city:"Seattle", tv:"FOX", kickoff:"2:00 PM",
      scorers:[{m:"23'",p:"Pulisic",t:"USA"},{m:"41'",p:"Kane",t:"ENG",pen:true}] },
    { id:"m2", group:"D", a:team("FRA"), b:team("CRO"), score:[2,0], state:"in", minute:54, clock:"54'",
      venue:"AT&T Stadium", city:"Arlington", tv:"FS1", kickoff:"5:00 PM",
      scorers:[{m:"12'",p:"Mbappé",t:"FRA"},{m:"38'",p:"Dembélé",t:"FRA"}] },
    { id:"m3", group:"E", a:team("ESP"), b:team("JPN"), score:[0,0], state:"in", minute:12, clock:"12'",
      venue:"NRG Stadium", city:"Houston", tv:"FOX", kickoff:"5:00 PM", scorers:[] },
    { id:"m4", group:"G", a:team("BRA"), b:team("SRB"), score:[2,0], state:"post", minute:90, clock:"FT",
      venue:"SoFi Stadium", city:"Inglewood", tv:"Telemundo", kickoff:"11:00 AM",
      scorers:[{m:"31'",p:"Vinícius Jr.",t:"BRA"},{m:"77'",p:"Rodrygo",t:"BRA"}] },
    { id:"m5", group:"A", a:team("MEX"), b:team("NOR"), score:[null,null], state:"pre", clock:"8:00 PM",
      venue:"Estadio Banorte", city:"Mexico City", tv:"FOX", kickoff:"8:00 PM", scorers:[] },
    { id:"m6", group:"C", a:team("BEL"), b:team("MAR"), score:[null,null], state:"pre", clock:"9:00 PM",
      venue:"Mercedes-Benz", city:"Atlanta", tv:"FS1", kickoff:"9:00 PM", scorers:[] },
  ];

  // ---- 12 groups ----
  const mkGroup = (g, rows) => ({
    g,
    teams: rows.map((r, i) => {
      const [code, w, d, l, gf, ga] = r;
      return {
        ...team(code), rk: i + 1, gp: w + d + l, w, d, l, gf, ga, gd: gf - ga, pts: w * 3 + d,
        status: i < 2 ? "adv" : (i === 2 ? "best3" : "out"),
        mine: code === "USA",
      };
    }),
  });
  const groups = [
    mkGroup("A", [["MEX",2,1,0,5,1],["NOR",2,0,1,4,3],["RSA",1,0,2,2,4],["KSA",0,1,2,1,4]]),
    mkGroup("B", [["USA",1,1,0,3,2],["ENG",1,1,0,4,3],["SEN",1,0,1,2,2],["IRN",0,0,2,0,2]]),
    mkGroup("C", [["BEL",2,1,0,6,2],["MAR",1,1,1,4,3],["CAN",1,0,1,3,3],["QAT",0,1,2,1,5]]),
    mkGroup("D", [["FRA",2,0,0,5,1],["CRO",1,0,1,3,3],["AUS",1,0,1,2,3],["PAN",0,0,2,1,4]]),
    mkGroup("E", [["ESP",2,1,0,7,2],["GER",1,1,0,4,2],["JPN",1,0,1,3,3],["CPV",0,1,2,1,5]]),
    mkGroup("F", [["ARG",3,0,0,8,1],["POR",1,1,1,4,3],["EGY",1,0,2,3,5],["NZL",0,0,3,0,6]]),
    mkGroup("G", [["BRA",2,1,0,7,2],["COL",1,1,1,4,3],["SRB",1,0,1,3,3],["KOR",0,1,2,2,6]]),
    mkGroup("H", [["NED",2,0,0,6,2],["URU",1,1,0,4,3],["GHA",1,0,1,3,3],["UZB",0,1,2,1,4]]),
    mkGroup("I", [["SUI",2,1,0,5,1],["ECU",1,1,1,4,3],["TUN",1,0,1,3,3],["JOR",0,0,2,1,4]]),
    mkGroup("J", [["SWE",2,0,0,5,2],["CIV",1,1,0,4,3],["PAR",1,0,1,3,3],["HAI",0,1,2,2,5]]),
    mkGroup("K", [["TUR",2,1,0,6,2],["SCO",1,1,1,4,3],["IRQ",1,0,1,3,3],["CUW",0,0,2,1,5]]),
    mkGroup("L", [["AUT",2,0,0,5,2],["CZE",1,1,0,4,3],["BIH",1,0,1,3,3],["ALG",0,1,2,2,5]]),
  ];

  // ---- date rail (Jun 11 – Jul 19) ----
  const months = { 6:"JUN", 7:"JUL" };
  const dows = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const dates = [];
  // group stage Jun 11-27 (date obj uses 2026)
  for (let d = 11; d <= 27; d++) {
    const dt = new Date(2026, 5, d);
    dates.push({ id:`06-${d}`, dow:dows[dt.getDay()], d, mo:"JUN", mc: d<=12?2:(d<=24?4:3), phase:"group" });
  }
  // R32 Jun 28 - Jul 3
  for (let d = 28; d <= 30; d++) { const dt=new Date(2026,5,d); dates.push({ id:`06-${d}`, dow:dows[dt.getDay()], d, mo:"JUN", mc:4, phase:"ko" }); }
  for (let d = 1; d <= 3; d++) { const dt=new Date(2026,6,d); dates.push({ id:`07-${d}`, dow:dows[dt.getDay()], d, mo:"JUL", mc:4, phase:"ko" }); }
  // R16 Jul 4-7, QF 9-11, SF 14-15, 3rd 18, Final 19
  [[4,4],[5,4],[6,4],[7,4],[9,2],[10,2],[11,2],[14,1],[15,1],[18,1],[19,1]].forEach(([d,mc])=>{
    const dt=new Date(2026,6,d); dates.push({ id:`07-${d}`, dow:dows[dt.getDay()], d, mo:"JUL", mc, phase:"ko" });
  });

  // ---- leaders ----
  const leaders = {
    Goals:[{p:"Kylian Mbappé",t:"FRA",v:5},{p:"Harry Kane",t:"ENG",v:4},{p:"Vinícius Jr.",t:"BRA",v:4},{p:"Lautaro Martínez",t:"ARG",v:3},{p:"Christian Pulisic",t:"USA",v:3}],
    Assists:[{p:"Christian Pulisic",t:"USA",v:4},{p:"Jude Bellingham",t:"ENG",v:3},{p:"Pedri",t:"ESP",v:3},{p:"Rodrygo",t:"BRA",v:2}],
    "Clean sheets":[{p:"G. Donnarumma",t:"ITA?",v:3},{p:"Thibaut Courtois",t:"BEL",v:3},{p:"Emi Martínez",t:"ARG",v:2},{p:"Alisson",t:"BRA",v:2}],
    Saves:[{p:"Yann Sommer",t:"SUI",v:18},{p:"Matt Turner",t:"USA",v:15},{p:"Bono",t:"MAR",v:14}],
  };
  // fix a placeholder team code
  leaders["Clean sheets"][0].t = "BEL";

  // ---- knockout (R16 next up) ----
  const r16 = [
    { a:team("ARG"), b:team("NED"), when:"Today · 4:00 PM", venue:"MetLife", win:0 },
    { a:team("BRA"), b:team("ESP"), when:"Today · 8:00 PM", venue:"SoFi", win:null },
    { a:team("FRA"), b:team("MAR"), when:"Tue · 4:00 PM", venue:"AT&T", win:null },
    { a:team("ENG"), b:team("GER"), when:"Tue · 8:00 PM", venue:"Lumen", win:null },
  ];

  // ---- opening match (pre) ----
  const opening = { a:team("MEX"), b:team("RSA"), venue:"Estadio Banorte", city:"Mexico City", tv:"FOX", when:"Thu, Jun 11 · 7:00 PM CT" };

  // ---- my team (USA) ----
  const myTeam = { ...team("USA"), group:"B", rank:1, pts:4, next:{ opp:team("SEN"), when:"Sat · 3:00 PM", venue:"Gillette" } };

  window.WC = { team, today, groups, dates, leaders, r16, opening, myTeam,
    flagBase:"https://flagcdn.com/w80/",
    todayLabel:"Wednesday, June 17", daysToKickoff:10 };
})();
