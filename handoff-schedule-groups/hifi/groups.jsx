/* ============================================================
   groups.jsx — /groups  (all 12 group tables)
   Fuller table than the homepage shelf: Pl W D L GD Pts.
   Each card links to the group detail page.
   ============================================================ */
const { useState, useEffect } = React;

function GroupCard({ grp }) {
  return (
    <a className="gcard" href={"Group Detail Hi-Fi.html?g=" + grp.g}>
      <div className="gcard-head">
        <span className="gl">GROUP {grp.g}</span>
        <span className="go">Group page <ChevR /></span>
      </div>
      <div className="gfrow head">
        <span className="rk">#</span><span className="tm">Team</span>
        <span className="num">Pl</span><span className="num">W</span><span className="num">D</span>
        <span className="num">L</span><span className="num">GD</span><span className="pts">Pts</span>
      </div>
      {grp.teams.map((tm) => (
        <div key={tm.code} className={"gfrow" + (tm.status === "adv" ? " adv" : tm.status === "best3" ? " best3" : "") + (tm.mine ? " mine" : "")}>
          <span className="rk tnum">{tm.rk}</span>
          <span className="tm">
            <Flag code={tm.code} flag={tm.flag} size={18} />
            <span className="c">{tm.code}</span>
            <span className="n">{tm.name}</span>
          </span>
          <span className="num tnum">{tm.gp}</span>
          <span className="num tnum">{tm.w}</span>
          <span className="num tnum">{tm.d}</span>
          <span className="num tnum">{tm.l}</span>
          <span className="num tnum">{tm.gd > 0 ? "+" : ""}{tm.gd}</span>
          <span className="pts tnum">{tm.pts}</span>
        </div>
      ))}
    </a>
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
      <PageNav active="Groups" />
      <div className="page">
        <div className="pagehead">
          <div className="eyebrow">2026 FIFA World Cup</div>
          <h1>Group Stage</h1>
          <div className="sub">
            <span className="b tnum">12</span> groups <span className="sep">·</span>
            <span className="b tnum">48</span> teams <span className="sep">·</span>
            Top two of each group advance, plus the eight best third-placed teams
          </div>
        </div>

        <div className="groups-wall">
          {window.WC.groups.map((g) => <GroupCard grp={g} key={g.g} />)}
        </div>

        <GroupsLegend />
        <PageFooter />
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakColor label="Accent" value={t.accent} options={["#0a2240", "#16a34a", "#2563eb", "#d98c0a"]} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Density" />
        <TweakRadio label="Rows" value={t.density} options={["Standard", "Dense"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
