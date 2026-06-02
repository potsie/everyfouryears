/* ============================================================
   directions.jsx — 4 homepage wireframe directions
   each takes { state: "pre"|"in"|"knock", mob: bool }
   ============================================================ */

/* small shared bits */
function LiveChip({ a, b, sa, sb, clk }) {
  return (
    <div className="mcard" style={{ padding: "9px 11px", minWidth: 150 }}>
      <div className="row between center tiny"><span className="live-tag"><span className="live-dot"></span>LIVE</span><span className="clk mono">{clk}</span></div>
      <div className="row between center" style={{ marginTop: 6 }}>
        <span className="row center gap6"><span className="ph flag" style={{ width: 30 }}>{a}</span></span>
        <span className="score" style={{ fontSize: "1.3em" }}>{sa}–{sb}</span>
        <span className="row center gap6"><span className="ph flag" style={{ width: 30 }}>{b}</span></span>
      </div>
    </div>
  );
}

/* shared morphing hero used by Broadcast + Hybrid */
function PhaseHero({ state, mob, note }) {
  if (state === "pre") return (
    <div className="zone anchor"><span className="zlabel">hero · pre-tournament</span>
      <div className="pad col gap14">
        <div className="row between center wrap gap14">
          <div className="col gap6">
            <span className="kicker">KICKOFF IN</span>
            <Countdown />
          </div>
          <div className="mcard col gap8" style={{ minWidth: mob ? "100%" : 300 }}>
            <span className="tiny mono muted">OPENING MATCH · JUN 11 · ESTADIO BANORTE</span>
            <div className="row between center"><FlagPh ab="MEX" /><span className="vs">v</span><FlagPh ab="RSA" /></div>
            <div className="row between center tiny"><span className="mono muted">19:00 local</span><span className="tv">FOX</span></div>
          </div>
        </div>
      </div>
      {!mob && note && <Annot style={{ top: 14, right: -150, width: 138 }}>{note}</Annot>}
    </div>
  );
  if (state === "in") return (
    <div className="zone anchor"><span className="zlabel">hero · live marquee</span>
      <div className="pad col gap8">
        <div className="row between center"><span className="live-tag big"><span className="live-dot"></span>4 MATCHES LIVE NOW</span><span className="more">audio · multiview ›</span></div>
        <div className="row gap8 wrap">
          <LiveChip a="USA" b="ENG" sa="1" sb="1" clk="67'" />
          <LiveChip a="FRA" b="CRO" sa="2" sb="0" clk="54'" />
          {!mob && <LiveChip a="JPN" b="GHA" sa="0" sb="0" clk="23'" />}
        </div>
      </div>
      {!mob && note && <Annot style={{ top: 10, right: -150, width: 138 }}>{note}</Annot>}
    </div>
  );
  return (
    <div className="zone anchor"><span className="zlabel">hero · knockout</span>
      <div className="pad col gap8">
        <span className="kicker">ROUND OF 16 · NEXT UP</span>
        <div className="row center wrap gap14">
          <BracketFrag />
          <div className="mcard col gap6" style={mob ? { width: "100%" } : { flex: "0 1 240px" }}>
            <span className="tiny mono muted">TODAY 16:00 · METLIFE</span>
            <div className="row center gap14" style={{ justifyContent: "center" }}><span className="sc">ARG</span><span className="vs">v</span><span className="sc">NED</span></div>
          </div>
        </div>
      </div>
      {!mob && note && <Annot style={{ top: 10, right: -150, width: 138 }}>{note}</Annot>}
    </div>
  );
}

/* ============================================================
   DIRECTION A — BROADCAST  (streaming-app, score-first)
   ============================================================ */
function Broadcast({ state, mob }) {
  const Hero = () => {
    if (state === "pre") return (
      <div className="zone anchor"><span className="zlabel">hero · pre-tournament</span>
        <div className="pad col gap14">
          <div className="row between center wrap gap14">
            <div className="col gap6">
              <span className="kicker">KICKOFF IN</span>
              <Countdown />
            </div>
            <div className="mcard col gap8" style={{ minWidth: mob ? "100%" : 300 }}>
              <span className="tiny mono muted">OPENING MATCH · JUN 11 · ESTADIO BANORTE</span>
              <div className="row between center">
                <FlagPh ab="MEX" /><span className="vs">v</span><FlagPh ab="RSA" />
              </div>
              <div className="row between center tiny"><span className="mono muted">19:00 local</span><span className="tv">FOX</span></div>
            </div>
          </div>
        </div>
        {!mob && <Annot style={{ top: 14, right: -150, width: 138 }}>Hero MORPHS by tournament phase →</Annot>}
      </div>
    );
    if (state === "in") return (
      <div className="zone anchor"><span className="zlabel">hero · live marquee</span>
        <div className="pad col gap8">
          <div className="row between center"><span className="live-tag big"><span className="live-dot"></span>4 MATCHES LIVE NOW</span><span className="more">audio · multiview ›</span></div>
          <div className="row gap8 wrap">
            <LiveChip a="USA" b="ENG" sa="1" sb="1" clk="67'" />
            <LiveChip a="FRA" b="CRO" sa="2" sb="0" clk="54'" />
            {!mob && <LiveChip a="JPN" b="GHA" sa="0" sb="0" clk="23'" />}
          </div>
        </div>
        {!mob && <Annot style={{ top: 10, right: -150, width: 138 }}>Pulsing dots + ticking clocks; auto-refresh</Annot>}
      </div>
    );
    return (
      <div className="zone anchor"><span className="zlabel">hero · knockout</span>
        <div className="pad col gap8">
          <span className="kicker">ROUND OF 16 · NEXT UP</span>
          <div className="row between center wrap gap14">
            <BracketFrag />
            <div className="mcard col gap6" style={{ minWidth: mob ? "100%" : 220 }}>
              <span className="tiny mono muted">TODAY 16:00 · METLIFE</span>
              <div className="row between center"><span className="sc">ARG</span><span className="vs">v</span><span className="sc">NED</span></div>
            </div>
          </div>
        </div>
        {!mob && <Annot style={{ top: 10, right: -150, width: 138 }}>Bracket spotlight: who advanced, who's next</Annot>}
      </div>
    );
  };

  return (
    <>
      <Nav active="Schedule" compact={mob} />
      <Hero />
      <div className="zone anchor"><span className="zlabel">schedule swiper</span>
        <div className="pad"><DateSwiper /></div>
        {!mob && <Annot style={{ top: 6, right: -150, width: 138 }}>Click a date → grid filters, no reload</Annot>}
      </div>
      <div className="zone"><span className="zlabel">match grid</span>
        <div className="pad col gap8">
          <SecH>TODAY · 8 MATCHES</SecH>
          <div className={mob ? "col gap8" : "grid3"}>
            <MatchCard a="USA" b="ENG" sa="1" sb="1" state={state==="pre"?"pre":"in"} clk="67'" venue="Lumen" tv="FOX" time="14:00" group="GROUP B" />
            <MatchCard a="BRA" b="SRB" sa="2" sb="0" state={state==="pre"?"pre":"post"} venue="SoFi" tv="TELE" time="17:00" group="GROUP G" />
            {!mob && <MatchCard a="FRA" b="CRO" sa="2" sb="0" state={state==="pre"?"pre":"in"} clk="54'" venue="AT&T" tv="FS1" time="20:00" group="GROUP D" />}
          </div>
        </div>
      </div>
      <div className="zone anchor"><span className="zlabel">tournament matrix</span>
        <div className="pad col gap8">
          <SecH>GROUPS</SecH>
          <div className={mob ? "grid2" : "grid4"}>
            <GroupTable g="A" />
            <GroupTable g="B" teams={[{ab:"USA",p:4,rk:1,adv:true,mine:true},{ab:"ENG",p:4,rk:2,adv:true},{ab:"SEN",p:3,rk:3},{ab:"IRN",p:0,rk:4}]} />
            {!mob && <GroupTable g="C" />}
            {!mob && <GroupTable g="D" teams={[{ab:"FRA",p:6,rk:1,adv:true},{ab:"CRO",p:3,rk:2,adv:true},{ab:"AUS",p:3,rk:3},{ab:"PAN",p:0,rk:4}]} />}
          </div>
        </div>
        {!mob && <Annot style={{ bottom: 10, right: -150, width: 138 }}>Groups with your pinned team float to the top</Annot>}
      </div>
    </>
  );
}

/* ============================================================
   DIRECTION B — ALMANAC  (clean data reference, table-forward)
   ============================================================ */
function Almanac({ state, mob }) {
  const statusText = state === "pre" ? "10 DAYS TO KICKOFF" : state === "in" ? "8 MATCHES TODAY · 4 LIVE" : "ROUND OF 16 · 8 LEFT";
  const Sched = () => (
    <div className="col gap6">
      <SecH more="full 104">{state==="pre"?"FIXTURES · JUN 11":"RESULTS & FIXTURES · TODAY"}</SecH>
      <div className="skbox" style={{ padding: "0", overflow: "hidden" }}>
        {[
          ["14:00","USA","ENG", state==="pre"?"v":"1–1", state==="in"?"67'":"", "FOX","Lumen"],
          ["17:00","BRA","SRB", state==="pre"?"v":"2–0", "FT", "TELE","SoFi"],
          ["20:00","FRA","CRO", state==="pre"?"v":"2–0", state==="in"?"54'":"", "FS1","AT&T"],
          ["20:00","ESP","JPN", state==="pre"?"v":"0–0", state==="in"?"12'":"", "FOX","NRG"],
        ].map((r,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns: mob?"42px 1fr 46px 40px":"52px 1fr 60px 44px 64px", gap:8, alignItems:"center", padding:"7px 10px", borderTop: i?"1px solid var(--ink3)":"none", fontSize: mob?"11px":"12.5px" }}>
            <span className="mono muted">{r[0]}</span>
            <span className="row center gap6" style={{ whiteSpace: "nowrap" }}><span className="ph flag" style={{width:18}}> </span><b className="sc">{r[1]}</b> <span className="muted mono">{r[3]}</span> <b className="sc">{r[2]}</b></span>
            <span className="mono" style={{ color: r[4]==="FT"?"var(--ink2)":"var(--pitch)" }}>{r[4]}</span>
            {!mob && <span className="tv">{r[5]}</span>}
            <span className="mono muted tiny">{r[6]}</span>
          </div>
        ))}
      </div>
    </div>
  );
  const Standings = () => (
    <div className="col gap6">
      <SecH more="all 12">{state==="knock"?"BRACKET LADDER":"STANDINGS"}</SecH>
      {state==="knock" ? (
        <div className="skbox col gap8" style={{ padding: 12 }}>
          {["R32","R16","QF","SF","FINAL"].map((r,i)=>(
            <div key={r} className="row between center tiny">
              <span className="mono muted" style={{ width: 44 }}>{r}</span>
              <div className="bar dark" style={{ width: `${90-i*14}%` }}></div>
              <span className="mono muted">{[16,8,4,2,1][i]} left</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={mob?"col gap8":"grid2"}>
          <GroupTable g="A" />
          <GroupTable g="B" teams={[{ab:"USA",p:4,rk:1,adv:true,mine:true},{ab:"ENG",p:4,rk:2,adv:true},{ab:"SEN",p:3,rk:3},{ab:"IRN",p:0,rk:4}]} />
          {!mob && <GroupTable g="C" />}
          {!mob && <GroupTable g="D" teams={[{ab:"FRA",p:6,rk:1,adv:true},{ab:"CRO",p:3,rk:2,adv:true},{ab:"AUS",p:3,rk:3},{ab:"PAN",p:0,rk:4}]} />}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="wf-nav" style={{ paddingTop: 9, paddingBottom: 9 }}>
        <div className="logo">everyfouryears<span className="dot">.</span>futbol</div>
        {!mob && <div className="navitems" style={{ fontSize: 13 }}>{["Schedule","Groups","Bracket","Teams","Players","Venues","Stats","News"].map(i=><span key={i}>{i}</span>)}</div>}
        {mob && <div className="grow"></div>}
        <div className="pinbtn">UTC ⇄ LOCAL</div>
      </div>
      <div className="zone anchor" style={{ background: "var(--paper2)" }}><span className="zlabel">status bar</span>
        <div className="pad row between center" style={{ paddingTop: 9, paddingBottom: 9 }}>
          <span className="sc">{statusText}</span>
          <span className="mono tiny muted">{state==="in" && <><span className="live-dot"></span> </>}WED · JUN 17 · 2026</span>
        </div>
        {!mob && <Annot style={{ top: 4, right: -150, width: 138 }}>Almanac: type & numbers do the work, minimal imagery</Annot>}
      </div>
      <div className="zone"><span className="zlabel">data columns</span>
        <div className="pad">
          {mob ? <div className="col gap14"><Sched /><Standings /></div>
            : <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.08fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
                <Sched />
                <Standings />
              </div>}
        </div>
      </div>
      <div className="zone anchor"><span className="zlabel">stat leaders strip</span>
        <div className="pad">
          <div className={mob?"grid2":"grid4"}>
            {[["⚽ GOLDEN BOOT","Mbappé","5"],["🅰 ASSISTS","Pulisic","4"],["🧤 CLEAN SHEETS","Donnarumma","3"],["🟨 CARDS","—","—"]].map(s=>(
              <div key={s[0]} className="skbox col gap6" style={{ padding: 10 }}>
                <span className="mono tiny muted">{s[0]}</span>
                <div className="row between center"><span className="sc">{s[1]}</span><span className="huge" style={{ fontSize: "1.6em" }}>{s[2]}</span></div>
              </div>
            ))}
          </div>
        </div>
        {!mob && <Annot style={{ bottom: 10, right: -150, width: 138 }}>Aggregated leaderboards — the "reference desk" payoff</Annot>}
      </div>
    </>
  );
}

/* ============================================================
   DIRECTION C — EDITORIAL  (story-led, The Athletic energy)
   ============================================================ */
function Editorial({ state, mob }) {
  const lead = state === "pre"
    ? { k: "THE PREVIEW", h: "Everything you need before 48 teams take the field", b: "Staff · 12 min read" }
    : state === "in"
    ? { k: "LIVE · GROUP B", h: "USA and England trade blows in a frantic Seattle night", b: "Live · updating" }
    : { k: "ROUND OF 16", h: "Argentina survive a scare; the bracket cracks wide open", b: "Match report · 6 min" };
  return (
    <>
      <Nav items={["Home","Matches","Groups","Bracket","Features","Teams"]} active="Home" compact={mob} />
      <div className="zone anchor"><span className="zlabel">lead story</span>
        <div className="pad col gap8">
          <Ph label="HERO PHOTO — match action / stadium" style={{ height: mob?120:230 }} />
          <span className="kicker">{state==="in" && <span className="live-dot" style={{marginRight:6}}></span>}{lead.k}</span>
          <div className="headline">{lead.h}</div>
          <span className="byline">{lead.b}</span>
          {state === "in" && (
            <div className="mcard row between center" style={{ marginTop: 4 }}>
              <span className="row center gap6"><span className="ph flag" style={{width:34}}>USA</span></span>
              <span className="score">1–1</span>
              <span className="clk mono">67'</span>
              <span className="row center gap6"><span className="ph flag" style={{width:34}}>ENG</span></span>
            </div>
          )}
        </div>
        {!mob && <Annot style={{ top: 14, right: -150, width: 140 }}>One editorial lead sets the day; scores live below the fold</Annot>}
      </div>
      <div className="zone"><span className="zlabel">storylines</span>
        <div className="pad col gap8">
          <SecH more="features">STORYLINES</SecH>
          <div className={mob?"col gap8":"grid3"}>
            {[["Tactics","Why the back-three is back","4 min"],["Data","The xG table nobody expected","3 min"],["Feature","Inside Mexico's home advantage","8 min"]].map((s,i)=>(
              (mob && i>1) ? null :
              <div key={s[1]} className="mcard col gap6">
                <Ph label="thumb" style={{ height: 70 }} />
                <span className="kicker" style={{ color: "var(--ink3)" }}>{s[0]}</span>
                <b className="sc">{s[1]}</b>
                <span className="byline">{s[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="zone anchor"><span className="zlabel">scores rail</span>
        <div className="pad col gap8">
          <SecH more="schedule">{state==="pre"?"TODAY'S FIXTURES":"TODAY'S SCORES"}</SecH>
          <div className={mob?"col gap6":"grid2"}>
            <MatchCard a="USA" b="ENG" sa="1" sb="1" state={state==="pre"?"pre":"in"} clk="67'" venue="Lumen" tv="FOX" time="14:00" group="GROUP B" />
            <MatchCard a="FRA" b="CRO" sa="2" sb="0" state={state==="pre"?"pre":"in"} clk="54'" venue="AT&T" tv="FS1" time="20:00" group="GROUP D" />
          </div>
        </div>
        {!mob && <Annot style={{ bottom: 10, right: -150, width: 138 }}>Scores demoted to a tidy module — opinion leads, data supports</Annot>}
      </div>
    </>
  );
}

/* ============================================================
   DIRECTION D — LIVE TICKER  (live-blog energy)
   ============================================================ */
function Ticker({ state, mob }) {
  const tkLabel = state === "pre" ? "COUNTDOWN" : state === "in" ? "LIVE" : "KNOCKOUT";
  const run = state === "pre"
    ? "MEX v RSA opens in 10d · ARG squad confirmed · Mbappé fit · Tickets resale live · Weather: Dallas 31°C"
    : state === "in"
    ? "67' USA 1–1 ENG · 54' FRA 2–0 CRO · 23' JPN 0–0 GHA · GOAL Pulisic 41' · 🟨 Bellingham 58'"
    : "FT ARG 2–1 NED · BRA advance · GER eliminated · QF set: ARG v ESP · POR v FRA tonight";
  const feed = state === "pre"
    ? [["10d","NOTE","Opening match: Mexico v South Africa, Estadio Banorte"],["2h","SQUAD","USA name 26-man roster — Pulisic captain"],["5h","WX","Heat advisory for Arlington afternoon kickoffs"]]
    : state === "in"
    ? [["67'","SUB","ENG: Foden on for Saka"],["58'","🟨","Bellingham booked for a late challenge"],["41'","⚽","GOAL! Pulisic levels it for USA, 1–1"],["12'","⚽","France ahead early through Mbappé"]]
    : [["FT","RESULT","Argentina edge Netherlands 2–1 after extra time"],["115'","⚽","Winner! Messi from the spot"],["NEWS","BRACKET","Quarterfinal set: ARG v ESP"]];
  return (
    <>
      <Nav items={["Live","Schedule","Groups","Bracket","Teams"]} active="Live" compact={mob} />
      <div className="anchor">
        <div className="ticker">
          <div className="tk-lbl">{state==="in" && <span className="live-dot" style={{background:"#fff",marginRight:6}}></span>}{tkLabel}</div>
          <div className="tk-run"><b>{run}</b></div>
        </div>
        {!mob && <Annot style={{ top: -6, right: -150, width: 138 }}>Persistent ticker — pulse of the whole tournament, always on</Annot>}
      </div>
      <div className="zone"><span className="zlabel">{state==="in"?"live feed":"feed"}</span>
        <div className="pad">
          {mob ? <Feed feed={feed} /> :
            <div className="row gap14" style={{ alignItems: "flex-start" }}>
              <div className="grow" style={{ flex: "1 1 58%" }}>
                <SecH more="all updates">{state==="in"?"MINUTE-BY-MINUTE":"LATEST"}</SecH>
                <Feed feed={feed} />
              </div>
              <div className="col gap8" style={{ flex: "1 1 42%" }}>
                <SecH more="scoreboard">{state==="pre"?"KICKING OFF":"SCOREBOARD"}</SecH>
                <div className="col gap6">
                  <LiveChip a="USA" b="ENG" sa="1" sb="1" clk={state==="in"?"67'":"14:00"} />
                  <LiveChip a="FRA" b="CRO" sa="2" sb="0" clk={state==="in"?"54'":"20:00"} />
                </div>
                <div className="skbox col gap6" style={{ padding: 10, marginTop: 4 }}>
                  <span className="mono tiny muted">STANDINGS MOVING</span>
                  <div className="row between tiny"><span>↑ USA into 1st (Grp B)</span><span className="clk mono">+1</span></div>
                  <div className="row between tiny"><span>↓ IRN to last</span><span className="mono" style={{color:"var(--live)"}}>−1</span></div>
                </div>
              </div>
            </div>}
        </div>
      </div>
    </>
  );
}
function Feed({ feed }) {
  return (
    <div className="col">
      {feed.map((f,i)=>(
        <div key={i} className="feed-item">
          <div className="feed-min">{f[0]}<span className="ev">{f[1]}</span></div>
          <div className="col gap6"><span>{f[2]}</span><div className="bar s" style={{ opacity: .25 }}></div></div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   DIRECTION E — HYBRID  (Broadcast hero + curated Almanac data)
   density: "roomy" | "standard" | "dense"
   ============================================================ */
const DEN = {
  roomy:    { cards: 2, groups: 2, leaders: 3, pad: 18, fs: 15, sched: 3, label: "Roomy" },
  standard: { cards: 3, groups: 4, leaders: 4, pad: 15, fs: 14, sched: 4, label: "Standard" },
  dense:    { cards: 4, groups: 12, leaders: 4, pad: 12, fs: 13, sched: 6, label: "Dense" },
};
const HMATCHES = [
  { a:"USA", b:"ENG", sa:"1", sb:"1", g:"GROUP B", v:"Lumen", tv:"FOX",  t:"14:00", k:"in",   clk:"67'" },
  { a:"FRA", b:"CRO", sa:"2", sb:"0", g:"GROUP D", v:"AT&T",  tv:"FS1",  t:"20:00", k:"in",   clk:"54'" },
  { a:"BRA", b:"SRB", sa:"2", sb:"0", g:"GROUP G", v:"SoFi",  tv:"TELE", t:"17:00", k:"post" },
  { a:"ESP", b:"JPN", sa:"0", sb:"0", g:"GROUP E", v:"NRG",   tv:"FOX",  t:"21:00", k:"in",   clk:"12'" },
];
const HGROUPS = [
  { g:"A", teams:[{ab:"MEX",p:7,rk:1,adv:true},{ab:"NOR",p:6,rk:2,adv:true},{ab:"RSA",p:3,rk:3},{ab:"KSA",p:1,rk:4}] },
  { g:"B", teams:[{ab:"USA",p:4,rk:1,adv:true,mine:true},{ab:"ENG",p:4,rk:2,adv:true},{ab:"SEN",p:3,rk:3},{ab:"IRN",p:0,rk:4}] },
  { g:"C", teams:[{ab:"BEL",p:7,rk:1,adv:true},{ab:"MAR",p:4,rk:2,adv:true},{ab:"CAN",p:3,rk:3},{ab:"QAT",p:1,rk:4}] },
  { g:"D", teams:[{ab:"FRA",p:6,rk:1,adv:true},{ab:"CRO",p:3,rk:2,adv:true},{ab:"AUS",p:3,rk:3},{ab:"PAN",p:0,rk:4}] },
  { g:"E", teams:[{ab:"ESP",p:7,rk:1,adv:true},{ab:"GER",p:4,rk:2,adv:true},{ab:"JPN",p:3,rk:3},{ab:"CPV",p:1,rk:4}] },
  { g:"F", teams:[{ab:"ARG",p:9,rk:1,adv:true},{ab:"POR",p:4,rk:2,adv:true},{ab:"EGY",p:3,rk:3},{ab:"NZL",p:0,rk:4}] },
  { g:"G", teams:[{ab:"BRA",p:7,rk:1,adv:true},{ab:"COL",p:4,rk:2,adv:true},{ab:"SRB",p:3,rk:3},{ab:"KOR",p:1,rk:4}] },
  { g:"H", teams:[{ab:"NED",p:6,rk:1,adv:true},{ab:"URU",p:4,rk:2,adv:true},{ab:"GHA",p:3,rk:3},{ab:"UZB",p:1,rk:4}] },
  { g:"I", teams:[{ab:"SUI",p:7,rk:1,adv:true},{ab:"ECU",p:4,rk:2,adv:true},{ab:"TUN",p:3,rk:3},{ab:"JOR",p:0,rk:4}] },
  { g:"J", teams:[{ab:"SWE",p:6,rk:1,adv:true},{ab:"CIV",p:4,rk:2,adv:true},{ab:"PAR",p:3,rk:3},{ab:"HAI",p:1,rk:4}] },
  { g:"K", teams:[{ab:"TUR",p:7,rk:1,adv:true},{ab:"SCO",p:4,rk:2,adv:true},{ab:"IRQ",p:3,rk:3},{ab:"CUW",p:0,rk:4}] },
  { g:"L", teams:[{ab:"AUT",p:6,rk:1,adv:true},{ab:"CZE",p:4,rk:2,adv:true},{ab:"BIH",p:3,rk:3},{ab:"ALG",p:1,rk:4}] },
];
const HLEADERS = [["⚽ GOLDEN BOOT","Mbappé","5"],["🅰 ASSISTS","Pulisic","4"],["🧤 CLEAN SHEETS","Donnarumma","3"],["🟨 CARDS","Romero","2"]];

function Hybrid({ state, mob, density = "standard" }) {
  const d = mob ? { ...DEN[density], cards: 1 } : DEN[density];
  const gcols = mob ? 2 : (d.groups > 3 ? 3 : d.groups);
  const allShown = d.groups >= 12;
  const cardState = (k) => state === "pre" ? "pre" : k;
  const Standings = () => (
    <div className="col gap8">
      <SecH more={allShown ? "collapse" : "all 12 groups"}>{state==="knock" ? "ADVANCED" : "STANDINGS"}</SecH>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${gcols},minmax(0,1fr))`, gap: 10 }}>
        {HGROUPS.slice(0, d.groups).map(g => <GroupTable key={g.g} g={g.g} teams={g.teams} />)}
      </div>
    </div>
  );
  const Rail = () => (
    <div className="col gap14">
      <div className="col gap8">
        <SecH more="all stats">LEADERS</SecH>
        <div className="grid2">
          {HLEADERS.slice(0, d.leaders).map(s => (
            <div key={s[0]} className="skbox col gap6" style={{ padding: 10 }}>
              <span className="mono tiny muted">{s[0]}</span>
              <div className="row between center"><span className="sc">{s[1]}</span><span className="huge" style={{ fontSize: "1.5em" }}>{s[2]}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="col gap8">
        <SecH more="full schedule">{state==="pre" ? "NEXT UP" : "AROUND THE GROUNDS"}</SecH>
        <div className="skbox" style={{ overflow: "hidden" }}>
          {HMATCHES.slice(0, d.sched).map((r,i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"46px 1fr 48px", gap:8, alignItems:"center", padding:"7px 10px", borderTop:i?"1px solid var(--ink3)":"none", fontSize:"12px" }}>
              <span className="mono muted">{r.t}</span>
              <span className="row center gap6" style={{ whiteSpace: "nowrap" }}><b className="sc">{r.a}</b> <span className="muted mono">{state==="pre"?"v":`${r.sa}–${r.sb}`}</span> <b className="sc">{r.b}</b></span>
              {state!=="pre" && r.k==="in" ? <span className="clk mono">{r.clk}</span> : <span className="tv">{r.tv}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return (
    <>
      <Nav active="Schedule" compact={mob} />
      <PhaseHero state={state} mob={mob} note="Broadcast hero stays — score-first, morphs by phase" />
      <div className="zone anchor"><span className="zlabel">schedule swiper</span>
        <div className="pad" style={{ padding: d.pad }}><DateSwiper /></div>
        {!mob && <Annot style={{ top: 6, right: -150, width: 138 }}>Click a date → everything below filters, no reload</Annot>}
      </div>
      <div className="zone"><span className="zlabel">today · match cards</span>
        <div className="pad col gap8" style={{ padding: d.pad, fontSize: d.fs }}>
          <SecH>TODAY · 8 MATCHES</SecH>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${d.cards},minmax(0,1fr))`, gap: 10 }}>
            {HMATCHES.map((m,i) => <MatchCard key={i} a={m.a} b={m.b} sa={m.sa} sb={m.sb} state={cardState(m.k)} clk={m.clk} venue={m.v} tv={m.tv} time={m.t} group={m.g} />)}
          </div>
        </div>
      </div>
      <div className="zone anchor"><span className="zlabel">data shelf · curated almanac</span>
        <div className="pad" style={{ padding: d.pad, fontSize: d.fs }}>
          {mob ? <div className="col gap14"><Standings /><Rail /></div>
            : <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
                <Standings />
                <Rail />
              </div>}
        </div>
        {!mob && <Annot>Standard shows a curated few groups + an "all 12 groups" link to expand on click. Flip Density → Dense to reveal the full 12-group wall at once. Same idea for every module: see a slice, click for all.</Annot>}
      </div>
    </>
  );
}

Object.assign(window, { Broadcast, Almanac, Editorial, Ticker, Hybrid, PhaseHero, LiveChip, Feed });
