/* ============================================================
   team-roster.jsx — /team/{abbr}/roster  26-man squad
   ============================================================ */
const { useState, useEffect } = React;
const RP = window.WCTeam.profile;
const SQUAD2 = window.WCTeam.squad;
const POS_ORDER = [["GK", "Goalkeepers"], ["DEF", "Defenders"], ["MID", "Midfielders"], ["FWD", "Forwards"]];

function PCard({ p }) {
  return (
    <a className={"pcard" + (p.star ? " star-card" : "")} href={p.id ? "Player Profile Hi-Fi.html" : "#"} onClick={(e) => { if (!p.id) e.preventDefault(); }}>
      <Shot size={50} num={p.n} name={p.name} />
      <div className="pc-info">
        <div className="pc-name">{p.name}{p.captain && <span className="cap">C</span>}</div>
        <div className="pc-club"><Flag code={p.club} flag={p.cc} size={15} /><span>{p.club}</span></div>
        <div className="pc-meta"><span>Age <b className="tnum">{p.age}</b></span><span><b className="tnum">{p.caps}</b> caps</span><span><b className="tnum">{p.g}</b> {p.g === 1 ? "goal" : "goals"}</span></div>
      </div>
    </a>
  );
}

function App() {
  const [t, setTweak] = useTweaks({ accent: "#0a2240", density: "Standard" });
  const [sort, setSort] = useState("Position");
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-ink", "#ffffff");
  }, [t.accent]);
  useEffect(() => { document.body.classList.toggle("dense", t.density === "Dense"); }, [t.density]);

  return (
    <>
      <PageNav active="Teams" />
      <div className="page">
        <div className="pagehead">
          <div className="eyebrow">{RP.confederation} · 2026 World Cup</div>
          <h1>{RP.team.name} — Squad</h1>
          <div className="sub">
            <a href="Team Profile Hi-Fi.html" style={{ color: "var(--ink-2)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Flag code={RP.team.code} flag={RP.team.flag} size={18} /> Team profile
            </a>
            <span className="sep">·</span><span className="b tnum">26</span> players <span className="sep">·</span>
            Coach <span className="b">{RP.coach}</span>
          </div>
        </div>

        <div className="roster-sub">
          <div className="seg">
            {["Position", "Number"].map((s) => <button key={s} className={sort === s ? "on" : ""} onClick={() => setSort(s)}>By {s.toLowerCase()}</button>)}
          </div>
        </div>

        {sort === "Position"
          ? POS_ORDER.map(([code, label]) => {
              const rows = SQUAD2.filter((p) => p.pos === code).sort((a, b) => a.n - b.n);
              return (
                <section className="pos-group" key={code}>
                  <div className="pos-label"><h3>{label}</h3><span className="cnt">{rows.length}</span></div>
                  <div className="squad-grid">{rows.map((p) => <PCard key={p.n} p={p} />)}</div>
                </section>
              );
            })
          : (
            <section className="pos-group">
              <div className="squad-grid">{[...SQUAD2].sort((a, b) => a.n - b.n).map((p) => <PCard key={p.n} p={p} />)}</div>
            </section>
          )}

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
