/* ============================================================
   player.jsx — /player/{id}  Player profile (Christian Pulisic)
   ============================================================ */
const { useState, useEffect } = React;
const PL = window.WCTeam.players.pulisic;
const P90_REF = { "Goals": 1.2, "Shots": 5, "Chances created": 4, "Dribbles": 6, "Touches": 80 };

function PlayerHero() {
  return (
    <div className="th">
      <div className="th-grain" />
      <div className="th-in">
        <div className="th-top">
          <a className="th-back" href="Team Roster Hi-Fi.html"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> {PL.team.name} squad</a>
          <span className="th-rankpill">Market value <b>{PL.value}</b></span>
        </div>
        <div className="ph-id">
          <Shot size={88} num={PL.n} name={PL.name} dark />
          <div className="ph-titles">
            <div className="num2">#{PL.n} · {PL.team.code}</div>
            <h1>{PL.name}</h1>
            <div className="pos2">
              <span className="chip">{PL.pos}</span>
              <span className="chip"><Flag code={PL.club} flag={PL.cc} size={15} /> <b>{PL.club}</b></span>
              <span className="chip"><Flag code={PL.team.code} flag={PL.team.flag} size={15} /> <b>{PL.team.name}</b></span>
            </div>
          </div>
        </div>
        <div className="th-strip">
          <div className="cell"><div className="v tnum">{PL.caps}</div><div className="k">Caps</div></div>
          <div className="cell"><div className="v tnum">{PL.intlGoals}</div><div className="k">Intl goals</div></div>
          <div className="cell"><div className="v tnum">{PL.age}</div><div className="k">Age</div></div>
          <div className="cell"><div className="v sm">{PL.height}</div><div className="k">Height</div></div>
          <div className="cell"><div className="v sm">{PL.foot}</div><div className="k">Foot</div></div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks({ accent: "#0a2240", density: "Standard" });
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-ink", "#ffffff");
  }, [t.accent]);
  useEffect(() => { document.body.classList.toggle("dense", t.density === "Dense"); }, [t.density]);

  const tn = PL.tournament;
  const tiles = [
    { k: "Appearances", v: tn.apps }, { k: "Goals", v: tn.goals, green: true }, { k: "Assists", v: tn.assists, green: true },
    { k: "Minutes", v: tn.minutes }, { k: "Shots (on target)", v: tn.shots + " (" + tn.sot + ")" }, { k: "Avg rating", v: tn.rating, green: true },
  ];

  return (
    <>
      <PageNav active="Teams" />
      <div className="page">
        <PlayerHero />
        <div className="cols">
          <div>
            <div className="t-card">
              <div className="t-card-head"><h3>At the 2026 World Cup</h3><a className="lnk" href="Match Center Hi-Fi.html">Latest match <Arrow /></a></div>
              <div className="tiles">
                {tiles.map((ti) => (
                  <div className="tile" key={ti.k}><div className={"v tnum" + (ti.green ? " green" : "")}>{ti.v}</div><div className="k">{ti.k}</div></div>
                ))}
              </div>
            </div>

            <div className="t-card">
              <div className="t-card-head"><h3>Per 90 minutes</h3><span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>This tournament</span></div>
              <div className="p90">
                {PL.per90.map((r) => {
                  const ref = P90_REF[r.k] || r.v;
                  return (
                    <div className="p90-row" key={r.k}>
                      <span className="k">{r.k}</span>
                      <span className="bar"><i style={{ width: Math.min(100, (r.v / ref) * 100) + "%" }} /></span>
                      <span className="v tnum">{r.v}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="t-card">
              <div className="t-card-head"><h3>Club career</h3></div>
              <div className="career">
                {PL.career.map((c, i) => {
                  const now = i === PL.career.length - 1;
                  return (
                    <div className={"career-row" + (now ? " now" : "")} key={i}>
                      <span className="dot2" />
                      <div className="club">
                        <div className="cn"><Flag code={c.club} flag={c.cc} size={16} /> {c.club}</div>
                        <div className="yr">{c.years}</div>
                      </div>
                      {c.apps != null && <div className="ca"><b className="tnum">{c.apps}</b> apps · <b className="tnum">{c.g}</b> goals</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* shelf */}
          <div className="shelf">
            <a className="myteam" href="Team Profile Hi-Fi.html" style={{ textDecoration: "none", display: "block" }}>
              <div className="mt-h">Country</div>
              <div className="mt-main">
                <Flag code={PL.team.code} flag={PL.team.flag} size={36} />
                <div><div className="mt-code">{PL.team.code}</div><div className="mt-sub">{PL.team.name} · {PL.caps} caps</div></div>
              </div>
              <div className="mt-next"><span>View team profile</span><span style={{ color: "rgba(255,255,255,.6)" }}>→</span></div>
            </a>

            <div className="panel">
              <div className="panel-head"><h3>World Cup history</h3></div>
              <div className="wc-hist">
                {PL.wcHistory.map((h, i) => (
                  <div className={"wh-row" + (h.live ? " live" : "")} key={i}>
                    <span className="wh-y tnum">{h.year}</span>
                    <span className="wh-r">{h.apps} apps · {h.g} {h.g === 1 ? "goal" : "goals"}</span>
                    <span className="wh-tag">{h.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head"><h3>Quick facts</h3></div>
              <div className="facts">
                <div className="fact-row"><span className="k">Position</span><span className="v">{PL.pos}</span></div>
                <div className="fact-row"><span className="k">Born</span><span className="v">{PL.born}</span></div>
                <div className="fact-row"><span className="k">Date of birth</span><span className="v">{PL.dob}</span></div>
                <div className="fact-row"><span className="k">Height</span><span className="v">{PL.height}</span></div>
                <div className="fact-row"><span className="k">Preferred foot</span><span className="v">{PL.foot}</span></div>
                <div className="fact-row"><span className="k">Market value</span><span className="v">{PL.value}</span></div>
              </div>
            </div>
          </div>
        </div>
        <PageFooter />
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakColor label="Accent" value={t.accent} options={["#0a2240", "#16a34a", "#2563eb", "#d98c0a"]} onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Density" value={t.density} options={["Standard", "Dense"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
