/* ============================================================
   app.jsx — gallery shell: tabs, lifecycle + annotation toggles
   ============================================================ */
const { useEffect } = React;

const DIRS = [
  { id: "hybrid", n: "01", name: "Hybrid", comp: window.Hybrid, rec: true,
    blurb: "The recommended direction: Broadcast's score-first hero + swipeable dates up top, then a CURATED slice of Almanac data — a few group tables, stat leaders, and a fixtures glance — with breathing room. Use the Density control to dial how much data weight it carries.",
    kw: ["broadcast × almanac", "score-first hero", "curated data shelf", "density-tunable"] },
  { id: "broadcast", n: "02", name: "Broadcast", comp: window.Broadcast,
    blurb: "Ingredient one. Streaming-app DNA: a dynamic hero that morphs by phase, a swipeable date strip, a live match grid, and a tournament matrix of group tables. Score-first.",
    kw: ["score-first", "live marquee", "ESPN/AppleTV", "match grid"] },
  { id: "almanac", n: "03", name: "Almanac", comp: window.Almanac,
    blurb: "Ingredient two. The reference desk — type and numbers do the work, twin data columns and aggregated stat leaders. Rich, but intentionally dense (the hybrid borrows its detail, not its weight).",
    kw: ["data-dense", "tables", "almanac", "standings-first"] },
];

const STATES = [
  { id: "pre", label: "Pre-tournament" },
  { id: "in", label: "Live matchday" },
  { id: "knock", label: "Knockout" },
];

const DENS = [
  { id: "roomy", label: "Roomy" },
  { id: "standard", label: "Standard" },
  { id: "dense", label: "Dense" },
];

function App() {
  const [dir, setDir] = useState("hybrid");
  const [state, setState] = useState("in");
  const [density, setDensity] = useState("standard");
  const [annot, setAnnot] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("no-annot", !annot);
  }, [annot]);

  const D = DIRS.find(d => d.id === dir);
  const Comp = D.comp;

  return (
    <div className="gallery">
      <div className="masthead">
        <div>
          <h1>Homepage — Wireframe Exploration</h1>
          <div className="sub">everyfouryears.futbol · a Broadcast × Almanac hybrid plus its two source directions, shown on desktop + mobile and morphing across the tournament's lifecycle.</div>
        </div>
        <div className="stamp">LO-FI · v1 · for direction only</div>
      </div>

      <div className="controls">
        <div className="ctl-group">
          <div className="tabs">
            {DIRS.map(d => (
              <button key={d.id} className={"tab" + (d.id === dir ? " active" : "")} onClick={() => setDir(d.id)}>
                <span className="n">{d.n}</span>{d.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grow"></div>
        {dir === "hybrid" && (
          <div className="ctl-group">
            <span className="ctl-label">DENSITY</span>
            <div className="seg">
              {DENS.map(s => (
                <button key={s.id} className={"seg-btn" + (s.id === density ? " active" : "")} onClick={() => setDensity(s.id)}>{s.label}</button>
              ))}
            </div>
          </div>
        )}
        <div className="ctl-group">
          <span className="ctl-label">PHASE</span>
          <div className="seg">
            {STATES.map(s => (
              <button key={s.id} className={"seg-btn" + (s.id === state ? " active" : "")} onClick={() => setState(s.id)}>{s.label}</button>
            ))}
          </div>
        </div>
        <div className={"toggle" + (annot ? " on" : "")} onClick={() => setAnnot(a => !a)}>
          <span className="box"></span><span className="ctl-label">NOTES</span>
        </div>
      </div>

      <div className="dir-head">
        <h2><span className="mono muted" style={{ fontSize: 16 }}>{D.n} / </span>{D.name}{D.rec && <span className="reco">recommended</span>}</h2>
        <p>{D.blurb}</p>
        <div className="tagrow">{D.kw.map(k => <span key={k} className="kw">{k}</span>)}</div>
      </div>

      <div className="stage">
        <Browser><Comp state={state} mob={false} density={density} /></Browser>
        <Phone><Comp state={state} mob={true} density={density} /></Phone>
      </div>

      <div className="legend">
        <div className="li"><span className="ph flag" style={{ width: 26, height: 16, aspectRatio: "auto" }}> </span> flag / image placeholder</div>
        <div className="li"><span className="sw" style={{ background: "var(--hl)" }}></span> advancing / positive</div>
        <div className="li"><span className="live-dot"></span> live indicator (pulsing)</div>
        <div className="li"><span className="sw" style={{ background: "var(--note)" }}></span> design note (toggle above)</div>
        <div className="li"><span className="mono" style={{ fontSize: 11 }}>aa</span> monospace = data / placeholder text</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
