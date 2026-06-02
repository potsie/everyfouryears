/* ============================================================
   team-profile.jsx — /team/{abbr}  Team profile
   ============================================================ */
const { useState, useEffect } = React;
const P = window.WCTeam.profile;
const SQUAD = window.WCTeam.squad;

function TeamHero() {
  return (
    <div className="th">
      <div className="th-grain" />
      <div className="th-in">
        <div className="th-top">
          <a className="th-back" href="Group Detail Hi-Fi.html"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> Group {P.group}</a>
          <span className="th-rankpill">FIFA World Ranking <b className="tnum">#{P.fifaRank}</b></span>
        </div>
        <div className="th-id">
          <Flag code={P.team.code} flag={P.team.flag} size={64} />
          <div className="titles">
            <div className="eyebrow2">{P.confederation} · 2026 World Cup</div>
            <h1>{P.team.name}</h1>
            <div className="subline">
              <span>{P.nickname}</span><span className="sep">·</span>
              <span>Coach <b>{P.coach}</b></span><span className="sep">·</span>
              <span>Captain <b>{P.captain}</b></span>
            </div>
          </div>
        </div>
        <div className="th-strip">
          <div className="cell"><div className="v tnum">#{P.fifaRank}</div><div className="k">World rank</div></div>
          <div className="cell"><div className="v">{P.rank === 1 ? "1st" : P.rank + "th"}</div><div className="k">Group {P.group}</div></div>
          <div className="cell"><div className="v tnum">{P.wc.apps}</div><div className="k">WC appearances</div></div>
          <div className="cell"><div className="v sm">{P.wc.best}</div><div className="k">Best · {P.wc.bestYear}</div></div>
          <div className="cell"><div className="v tnum">{P.founded}</div><div className="k">Founded</div></div>
        </div>
      </div>
    </div>
  );
}

function KeyPlayers() {
  const picks = ["Christian Pulisic", "Weston McKennie", "Gio Reyna"].map((n) => SQUAD.find((p) => p.name === n));
  return (
    <div className="t-card">
      <div className="t-card-head"><h3>Key players</h3><a className="lnk" href="Team Roster Hi-Fi.html">Full 26-man squad <Arrow /></a></div>
      <div className="keyplayers">
        {picks.map((p) => (
          <a className="kp" key={p.name} href={p.id ? "Player Profile Hi-Fi.html" : "Team Roster Hi-Fi.html"} style={{ position: "relative" }}>
            <Shot size={58} num={p.n} name={p.name} />
            <div className="pname">{p.name}</div>
            <div className="pmeta">{p.club}</div>
            <div className="pstat">{p.g} {p.g === 1 ? "goal" : "goals"} · {p.caps} caps</div>
          </a>
        ))}
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

  return (
    <>
      <PageNav active="Teams" />
      <div className="page">
        <TeamHero />
        <div className="cols">
          <div>
            {/* at the tournament */}
            <div className="t-card">
              <div className="t-card-head"><h3>At the 2026 World Cup</h3><a className="lnk" href="Group Detail Hi-Fi.html">Group {P.group} <Arrow /></a></div>
              <GroupMini rows={window.WCTeam.groupB} letter={P.group} />
              <div className="next-match">
                <div>
                  <div className="nm-tag">Next match</div>
                  <div className="nm-main" style={{ marginTop: 6 }}>
                    <Flag code={P.team.code} flag={P.team.flag} size={22} /><span className="c">{P.team.code}</span>
                    <span className="muted" style={{ fontWeight: 700 }}>vs</span>
                    <span className="c">{P.next.opp.code}</span><Flag code={P.next.opp.code} flag={P.next.opp.flag} size={22} />
                  </div>
                </div>
                <span className="grow" />
                <div className="nm-when">{P.next.when}<div className="v">{P.next.venue}</div></div>
              </div>
            </div>

            {/* recent form */}
            <div className="t-card">
              <div className="t-card-head"><h3>Recent form</h3><span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Last 5</span></div>
              <div className="form-strip">
                {P.form.map((f, i) => (
                  <div className="form-game" key={i}>
                    <div className={"form-res " + f.res}>{f.res}</div>
                    <div className="sc tnum">{f.score}</div>
                    <div className="vs">v {f.opp}</div>
                  </div>
                ))}
              </div>
            </div>

            <KeyPlayers />
          </div>

          {/* shelf */}
          <div className="shelf">
            <div className="panel">
              <div className="panel-head"><h3>Team leaders</h3><span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>This WC</span></div>
              {P.leaders.map((l, i) => (
                <div className="tl-leader" key={i}>
                  <span className="k">{l.k}</span>
                  <span className="nm2"><Flag code="USA" flag={l.flag} size={16} /><span>{l.name}</span></span>
                  <span className="val2 tnum">{l.v}<span className="u">{l.sub}</span></span>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-head"><h3>World Cup history</h3><span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{P.wc.apps} apps</span></div>
              <div className="wc-hist">
                {P.history.map((h, i) => (
                  <div className={"wh-row" + (h.hl ? " hl" : "") + (h.live ? " live" : "")} key={i}>
                    <span className="wh-y tnum">{h.y}</span>
                    <span className="wh-r">{h.r}</span>
                    <span className="wh-tag">{h.live ? "Now" : h.hl ? "Best" : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head"><h3>Quick facts</h3></div>
              <div className="facts">
                <div className="fact-row"><span className="k">Confederation</span><span className="v">{P.confederation}</span></div>
                <div className="fact-row"><span className="k">Head coach</span><span className="v"><Flag code="ARG" flag={P.coachCountry} size={16} /> {P.coach}</span></div>
                <div className="fact-row"><span className="k">Captain</span><span className="v">{P.captain}</span></div>
                <div className="fact-row"><span className="k">Founded</span><span className="v tnum">{P.founded}</span></div>
                <div className="fact-row"><span className="k">Kit</span><span className="v">{P.kit}</span></div>
                <div className="fact-row"><span className="k">WC debut</span><span className="v tnum">{P.wc.debut}</span></div>
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
