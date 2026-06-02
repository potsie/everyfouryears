/* ============================================================
   schedule.jsx — /schedule  (full tournament fixture list)
   Day-grouped rows + stage/group filters. Single-date route
   (/schedule/2026-06-11) is this layout scoped to one day.
   ============================================================ */
const { useState, useEffect } = React;

function SStatus({ m }) {
  if (m.state === "in") return <span className="s-status s-live"><Pulse />{m.clock}</span>;
  if (m.state === "post") return <span className="s-status s-ft">FULL TIME</span>;
  return <span className="s-status s-time tnum">{m.kickoff}</span>;
}

function STeam({ t, side, lose }) {
  if (t.tbd) return <span className={"s-team " + side}><span className="s-seed">{t.seed}</span></span>;
  return (
    <span className={"s-team " + side + (lose ? " lose" : "")}>
      {side === "a"
        ? (<><span className="s-code">{t.code}</span><Flag code={t.code} flag={t.flag} size={22} /></>)
        : (<><Flag code={t.code} flag={t.flag} size={22} /><span className="s-code">{t.code}</span></>)}
    </span>
  );
}

function SScore({ m, hide }) {
  if (m.state === "pre") return <span className="s-score pre">vs</span>;
  if (hide) return <span className="s-score" style={{ color: "var(--ink-3)", letterSpacing: ".1em" }}>···</span>;
  const [a, b] = m.score;
  return <span className="s-score tnum">{a}<span className="x">–</span>{b}</span>;
}

function SRow({ m, hide }) {
  const post = m.state === "post";
  const [a, b] = m.score || [];
  const loseA = post && a < b, loseB = post && b < a;
  return (
    <div className="srow">
      <SStatus m={m} />
      <STeam t={m.a} side="a" lose={loseA} />
      <SScore m={m} hide={hide} />
      <STeam t={m.b} side="b" lose={loseB} />
      <span className="s-meta">
        <span className="s-grp">{m.group ? "GRP " + m.group : m.koAbbr}</span>
        <span className="s-ven"><Pin /><span>{m.venue} · {m.city}</span></span>
      </span>
      <span className="s-tv tv">{m.tv}</span>
    </div>
  );
}

function DaySection({ day, hide }) {
  return (
    <section className={"sday" + (day.isToday ? " is-today" : "")} id={"d-" + day.key}>
      <div className="sday-head">
        <h3>{day.dateLabel}</h3>
        <span className="stage">{day.stageLabel}</span>
        {day.isToday && <span className="todaytag">● Today</span>}
        <span className="cnt">{day.matches.length} {day.matches.length === 1 ? "match" : "matches"}</span>
      </div>
      <div className="slist">{day.matches.map((m) => <SRow key={m.id} m={m} hide={hide} />)}</div>
    </section>
  );
}

function App() {
  const [t, setTweak] = useTweaks({ accent: "#0a2240", density: "Standard" });
  const [stage, setStage] = useState("all");
  const [grp, setGrp] = useState("all");
  const [hide, setHide] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-ink", "#ffffff");
  }, [t.accent]);
  useEffect(() => { document.body.classList.toggle("dense", t.density === "Dense"); }, [t.density]);

  const GROUPS = window.WC.groups.map((g) => g.g);

  const days = window.WCSchedule.days.map((d) => {
    let ms = d.matches;
    if (stage === "group") ms = ms.filter((m) => m.group);
    else if (stage === "ko") ms = ms.filter((m) => !m.group);
    if (grp !== "all") ms = ms.filter((m) => m.group === grp);
    return { ...d, matches: ms };
  }).filter((d) => d.matches.length > 0);

  const total = days.reduce((n, d) => n + d.matches.length, 0);

  const jumpToday = () => {
    const el = document.getElementById("d-" + window.WCSchedule.todayKey);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: "smooth" });
  };

  return (
    <>
      <PageNav active="Schedule" />
      <div className="page">
        <div className="pagehead">
          <div className="eyebrow">2026 FIFA World Cup</div>
          <h1>Match Schedule</h1>
          <div className="sub">
            <span className="b tnum">104</span> matches <span className="sep">·</span>
            <span className="b tnum">16</span> venues <span className="sep">·</span>
            {window.WCSchedule.window}
          </div>
        </div>

        <div className="filters">
          <div className="seg">
            {[["all", "All"], ["group", "Group Stage"], ["ko", "Knockout"]].map(([v, l]) => (
              <button key={v} className={stage === v ? "on" : ""} onClick={() => setStage(v)}>{l}</button>
            ))}
          </div>
          <select className="fselect" value={grp} onChange={(e) => setGrp(e.target.value)}>
            <option value="all">All groups</option>
            {GROUPS.map((g) => <option key={g} value={g}>Group {g}</option>)}
          </select>
          <button className={"chk" + (hide ? " on" : "")} onClick={() => setHide((h) => !h)}>
            <span className="box">{hide && <Check />}</span> Hide scores
          </button>
          <div className="fspace" />
          <button className="btn" onClick={jumpToday}>Jump to today ↓</button>
        </div>

        {days.length === 0
          ? <div className="slist"><div className="sched-empty">No matches match these filters.</div></div>
          : days.map((d) => <DaySection key={d.key} day={d} hide={hide} />)}

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
