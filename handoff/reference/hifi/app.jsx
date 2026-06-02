/* ============================================================
   app.jsx — homepage composition + state + Tweaks
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "phase": "Live",
  "density": "Standard",
  "accent": "#0a2240",
  "showMyTeam": true
}/*EDITMODE-END*/;

const PHASE_KEY = { Live: "live", Pre: "pre", Knockout: "knock" };

function StandingsPanel({ onExpand }) {
  const pick = window.WC.groups.filter(g => ["B","D","E"].includes(g.g));
  return (
    <div className="panel">
      <div className="panel-head"><h3>Standings</h3><button className="link" onClick={onExpand}>All 12 groups →</button></div>
      {pick.map(g => <GroupTable grp={g} key={g.g} />)}
    </div>
  );
}

function GroupsSection({ onCollapse }) {
  return (
    <section style={{ margin: "32px 0 0" }}>
      <div className="section-head">
        <h2>Standings · All 12 Groups</h2>
        <button className="link" onClick={onCollapse}>Collapse <Chev style={{transform:"rotate(180deg)"}}/></button>
      </div>
      <div className="groups-grid">
        {window.WC.groups.map(g => <div className="panel" key={g.g}><GroupTable grp={g} /></div>)}
      </div>
      <GroupsLegend/>
    </section>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const phase = PHASE_KEY[t.phase] || "live";
  const dense = t.density === "Dense";
  const [activeDate, setActiveDate] = useState("06-17");
  const [showAll, setShowAll] = useState(false);
  const groupsRef = useRef(null);

  useEffect(() => { document.body.classList.toggle("dense", dense); }, [dense]);
  useEffect(() => { setShowAll(dense); }, [dense]);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-ink", "#ffffff");
  }, [t.accent]);

  const expand = () => { setShowAll(true); setTimeout(()=>groupsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 60); };

  // body matches: morph to upcoming when pre-tournament
  let matches = window.WC.today;
  if (phase === "pre") matches = matches.map(m => ({ ...m, state:"pre", score:[null,null], scorers:[] }));
  const liveCount = matches.filter(m => m.state === "in").length;
  const secLabel = phase === "pre" ? "Opening Fixtures" : phase === "knock" ? "Round of 16 · Today" : "Today";

  return (
    <>
      <Nav/>
      <div className="page">
        <Hero phase={phase}/>
        <DateRail active={activeDate} setActive={setActiveDate}/>

        <div className="section-head">
          <h2>{secLabel} <span style={{color:"var(--ink-3)",fontWeight:600,fontSize:14,fontFamily:"var(--ui)"}}>· {window.WC.todayLabel}</span></h2>
          <span className="eyebrow">{matches.length} matches{liveCount?` · ${liveCount} live`:""}</span>
        </div>

        <div className="cols">
          <div className="cards c2">
            {matches.map(m => <MatchCard m={m} key={m.id}/>)}
          </div>
          <aside className="shelf">
            {t.showMyTeam && <MyTeamCard/>}
            <StandingsPanel onExpand={expand}/>
            <LeadersPanel/>
          </aside>
        </div>

        <div ref={groupsRef}>
          {showAll && <GroupsSection onCollapse={()=>setShowAll(false)}/>}
        </div>

        <div className="foot-note">
          <span>Data updates live during matches · all times shown in your local timezone</span>
          <span>Where to watch: FOX · FS1 · Telemundo · Peacock</span>
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tournament phase" />
        <TweakRadio label="Hero state" value={t.phase} options={["Live","Pre","Knockout"]} onChange={(v)=>setTweak("phase", v)} />
        <TweakSection label="Data density" />
        <TweakRadio label="Standings" value={t.density} options={["Standard","Dense"]} onChange={(v)=>setTweak("density", v)} />
        <div style={{fontSize:11.5,color:"#8a93a3",margin:"-2px 2px 4px",lineHeight:1.35}}>Standard = curated few + “all 12” expand · Dense = full 12-group wall</div>
        <TweakSection label="Appearance" />
        <TweakColor label="Accent" value={t.accent} options={["#0a2240","#16a34a","#2563eb","#d98c0a"]} onChange={(v)=>setTweak("accent", v)} />
        <TweakToggle label="Show “My Team” card" value={t.showMyTeam} onChange={(v)=>setTweak("showMyTeam", v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
