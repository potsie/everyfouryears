/* ============================================================
   match.jsx — /match/{event_id}  Match Center
   Morphs pre / live / post. Tabs: Summary · Stats · Lineups · Commentary
   Right shelf: win prob / MOTM · head-to-head · Group B · where to watch
   ============================================================ */
const { useState, useEffect, useMemo } = React;
const M = window.WCMatch;

/* ---------- small icons ---------- */
const Back = (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Whistle = (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M3 9a5 5 0 0 1 5-5h9l-1.2 2.2A6 6 0 1 1 8 16H3V9Zm5 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" /></svg>);
const SubArrows = (p) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" {...p}><path d="M7 4v13m0 0 3-3m-3 3-3-3M17 20V7m0 0 3 3m-3-3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Play = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>);
const Tv = (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" /><path d="m8 21 4-3 4 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const PinSm = (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" /></svg>);
const Ref = (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const People = (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}><circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.2a3.2 3.2 0 0 1 0 6M17 14.5a5.5 5.5 0 0 1 3.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>);

/* ---------- match hero ---------- */
function MatchHero({ state }) {
  const score = state === "pre" ? null : state === "live" ? M.scoreLive : M.scoreFinal;
  const [a, b] = score || [];
  const loseA = state === "post" && a < b, loseB = state === "post" && b < a;
  return (
    <div className="mh">
      <div className="mh-grain" />
      <div className="mh-in">
        <div className="mh-top">
          <a className="mh-back" href="Schedule Hi-Fi.html"><Back /> Schedule</a>
          <span className="mh-meta">
            <span className="gtag">GROUP {M.group}</span>
            <span>{M.matchday}</span><span className="sep">·</span><span>{M.date}</span>
          </span>
        </div>

        <div className="mh-score">
          <div className={"mh-team" + (loseA ? " lose" : "")}>
            <Flag code={M.home.code} flag={M.home.flag} size={56} />
            <div className="code">{M.home.code}</div>
            <div className="nm">{M.home.name}</div>
            {state === "post" && a > b && <div className="wintag">● Winner</div>}
          </div>

          <div className="mh-center">
            {state === "live" && <div className="mh-status live"><Pulse dark /> {M.clockLive} · Live</div>}
            {state === "post" && <div className="mh-status ft">Full Time</div>}
            {state === "pre" && <div className="mh-status pre">{M.kickoff}</div>}
            {state === "pre"
              ? (<><div className="mh-kick">VS</div><div className="mh-when">{M.kickoffShort} kick-off</div></>)
              : (<div className="mh-nums tnum">
                  <span className={"n" + (loseA ? " dim" : "")}>{a}</span>
                  <span className="dash">–</span>
                  <span className={"n" + (loseB ? " dim" : "")}>{b}</span>
                </div>)}
            {state === "post" && <div className="mh-pen">90' + 6 stoppage</div>}
          </div>

          <div className={"mh-team" + (loseB ? " lose" : "")}>
            <Flag code={M.away.code} flag={M.away.flag} size={56} />
            <div className="code">{M.away.code}</div>
            <div className="nm">{M.away.name}</div>
            {state === "post" && b > a && <div className="wintag">● Winner</div>}
          </div>
        </div>

        <div className="mh-foot">
          <span className="it"><PinSm /> {M.venue} · {M.city}</span>
          <span className="it"><Ref /> {M.referee}</span>
          {state !== "pre" && <span className="it"><People /> {M.attendance} attendance</span>}
          <span className="grow" />
          <span className="it">Where to watch</span>
          <span className="tvb">{M.tv}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- timeline ---------- */
const evMinute = (e) => e.at + (e.extra ? "+" + e.extra : "") + "'";
function EventIcon({ e }) {
  if (e.type === "goal" || e.type === "pen") return <span className="tl-icn goal">⚽</span>;
  if (e.type === "yellow") return <span className="tl-icn card-y" />;
  if (e.type === "red") return <span className="tl-icn card-r" />;
  if (e.type === "sub") return <span className="tl-icn sub"><SubArrows /></span>;
  return <span className="tl-icn sub">VAR</span>;
}
function Timeline({ state }) {
  const all = M.events;
  const shown = state === "post" ? all : all.filter((e) => e.at <= 67 && e.type !== "whistle");
  let htInserted = false;
  const rows = [];
  shown.forEach((e, i) => {
    if (!htInserted && e.at >= 46) { rows.push(<div className="tl-mark" key="ht"><span>Half Time · 1–1</span></div>); htInserted = true; }
    if (e.type === "whistle") { rows.push(<div className="tl-mark" key={"w" + i}><span>{e.detail} · {M.scoreFinal[0]}–{M.scoreFinal[1]}</span></div>); return; }
    const goal = e.type === "goal" || e.type === "pen";
    rows.push(
      <div className={"tl-row " + e.team + (goal ? " goal" : "")} key={i}>
        <div className={"tl-card"}>
          <EventIcon e={e} />
          <span className="pl">{e.player}</span>
          <span className="dt">{e.detail}</span>
          {goal && e.score && <span className="tl-score tnum">{e.score[0]}–{e.score[1]}</span>}
        </div>
        <span className="tl-min tnum">{evMinute(e)}</span>
      </div>
    );
  });
  if (state === "live") rows.push(<div className="tl-mark" key="livenow"><span style={{ color: "var(--live-ink)", background: "var(--live-soft)", borderColor: "#cfe8d8" }}>● Live · {M.clockLive}</span></div>);
  return <div className="tl">{rows}</div>;
}

/* ---------- stat bars ---------- */
function StatBar({ s }) {
  const max = s.pct ? s.home + s.away : Math.max(s.home, s.away) || 1;
  const hp = (s.home / max) * 100, ap = (s.away / max) * 100;
  const fmt = (v) => (Number.isInteger(v) ? v : v.toFixed(2)) + (s.unit || "");
  return (
    <div className="sbar">
      <div className="sbar-top">
        <span className={"v" + (s.home < s.away ? " dim" : "")}>{fmt(s.home)}</span>
        <span className="lab">{s.label}</span>
        <span className={"v away" + (s.away < s.home ? " dim" : "")}>{fmt(s.away)}</span>
      </div>
      <div className="sbar-track">
        <span className="hbg"><i style={{ width: hp + "%" }} /></span>
        <span className="abg"><i style={{ width: ap + "%" }} /></span>
      </div>
    </div>
  );
}
function PossessionHeader() {
  const p = M.stats[0];
  return (
    <div className="poss">
      <div className="poss-side h"><div className="p tnum">{p.home}%</div><div className="l">{M.home.code}</div></div>
      <div className="poss-ring" style={{ background: `conic-gradient(var(--navy-600) 0 ${p.home}%, var(--accent) ${p.home}% 100%)` }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center" }}>
          <span className="cap">Poss.</span>
        </div>
      </div>
      <div className="poss-side a"><div className="p tnum">{p.away}%</div><div className="l">{M.away.code}</div></div>
    </div>
  );
}

/* ---------- pitch / lineups ---------- */
function Pitch() {
  const place = (lines, side) => {
    const L = lines.length;
    return lines.flatMap((line, li) => {
      const y = side === "home" ? 94 - li * (42 / (L - 1)) : 6 + li * (42 / (L - 1));
      const k = line.length;
      return line.map((pl, j) => {
        const x = 12 + ((j + 0.5) / k) * 76;
        return (
          <div className={"dot " + side} style={{ left: x + "%", top: y + "%" }} key={side + li + j}>
            <div className={"disc" + (pl.star ? " star" : "")}>{pl.n}</div>
            <div className="nm">{pl.name}{pl.c ? " (C)" : ""}</div>
          </div>
        );
      });
    });
  };
  return (
    <div className="pitch">
      <div className="box-line top" />
      <div className="box-line bot" />
      {place(M.lineups.away.lines, "away")}
      {place(M.lineups.home.lines, "home")}
    </div>
  );
}
function Lineups({ state }) {
  const probable = state === "pre";
  return (
    <div className="mc-card">
      <div className="mc-head">
        <h3>{probable ? "Probable lineups" : "Lineups"}</h3>
        <span className="sub">{M.lineups.home.formation} · {M.lineups.away.formation}</span>
      </div>
      <div className="pitch-wrap"><Pitch /></div>
      <div className="lu-meta">
        <span className="side"><Flag code={M.home.code} flag={M.home.flag} size={18} /><span className="code">{M.home.code}</span><span className="fm">{M.lineups.home.formation}</span></span>
        <span className="coach">{M.lineups.away.coach} vs {M.lineups.home.coach}</span>
        <span className="side"><span className="fm">{M.lineups.away.formation}</span><span className="code">{M.away.code}</span><Flag code={M.away.code} flag={M.away.flag} size={18} /></span>
      </div>
      <div className="bench">
        <div><h4><Flag code={M.home.code} flag={M.home.flag} size={14} /> {M.home.code} bench</h4><ul>{M.lineups.home.bench.map((n) => <li key={n}>{n}</li>)}</ul></div>
        <div><h4><Flag code={M.away.code} flag={M.away.flag} size={14} /> {M.away.code} bench</h4><ul>{M.lineups.away.bench.map((n) => <li key={n}>{n}</li>)}</ul></div>
      </div>
    </div>
  );
}

/* ---------- commentary ---------- */
const CMT_TAG = { goal: ["goal", "Goal"], pen: ["goal", "Penalty"], yellow: ["card", "Yellow"], var: ["var", "VAR"], sub: ["sub", "Sub"] };
function Commentary({ state }) {
  const rows = state === "post" ? M.commentary : M.commentary.filter((c) => parseInt(c.min) <= 67 || c.min.includes("45"));
  return (
    <div className="mc-card">
      <div className="mc-head"><h3>Live commentary</h3><span className="sub">{state === "post" ? "Full match" : "Auto-updating"}</span></div>
      <div className="cmt">
        {rows.map((c, i) => {
          const tag = CMT_TAG[c.type];
          const key = ["goal", "pen", "yellow", "red"].includes(c.type);
          return (
            <div className={"cmt-row" + (key ? " key" : "")} key={i}>
              <div className="cmt-min tnum">{c.min}</div>
              <div className="cmt-body">{tag && <span className={"cmt-tag " + tag[0]}>{tag[1]}</span>}{c.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- empty state ---------- */
function Empty({ children }) {
  return <div className="mc-card"><div style={{ padding: "40px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>{children}</div></div>;
}

/* ---------- main column per tab ---------- */
function MainColumn({ tab, state }) {
  if (tab === "Stats") {
    if (state === "pre") return <Empty>Match stats appear once the match kicks off.</Empty>;
    return (
      <div className="mc-card">
        <div className="mc-head"><h3>Team stats</h3><span className="sub">{state === "live" ? "Live · " + M.clockLive : "Full time"}</span></div>
        <PossessionHeader />
        <div className="stats-wrap">{M.stats.slice(1).map((s) => <StatBar key={s.label} s={s} />)}</div>
      </div>
    );
  }
  if (tab === "Lineups") return <Lineups state={state} />;
  if (tab === "Commentary") {
    if (state === "pre") return <Empty>Commentary begins at kick-off, {M.kickoffShort}.</Empty>;
    return <Commentary state={state} />;
  }
  // Summary
  if (state === "pre") {
    return (
      <>
        <div className="mc-card">
          <div className="mc-head"><h3>Match preview</h3><span className="sub">Group {M.group}</span></div>
          <div style={{ padding: "16px", fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>
            A Group {M.group} heavyweight clash in Seattle. The <b style={{ color: "var(--ink)" }}>{M.home.name}</b> arrive top of the table after a opening-day win, while <b style={{ color: "var(--ink)" }}>{M.away.name}</b> need a result to stay in control of their own destiny. Both sides are expected to name near-full-strength XIs.
          </div>
        </div>
        <Lineups state={state} />
      </>
    );
  }
  return (
    <>
      {state === "post" && (
        <div className="mc-card">
          <div className="mc-head"><h3>Player of the match</h3><span className="motm-badge">★ Official</span></div>
          <div className="motm">
            <div className="av"><span className="ph">7</span></div>
            <div className="info"><div className="nm">{M.motm.name}</div><div className="ln">{M.motm.line}</div></div>
          </div>
        </div>
      )}
      <div className="mc-card">
        <div className="mc-head"><h3>Key events</h3><span className="sub">{state === "live" ? "Live · " + M.clockLive : "Full time"}</span></div>
        <Timeline state={state} />
      </div>
      <div className="mc-card">
        <div className="mc-head"><h3>Match stats</h3><a className="link" href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", textDecoration: "none" }}>All stats →</a></div>
        <PossessionHeader />
        <div className="stats-wrap">{M.stats.slice(1, 6).map((s) => <StatBar key={s.label} s={s} />)}</div>
      </div>
    </>
  );
}

/* ---------- shelf panels ---------- */
function ProbPanel({ state }) {
  const p = state === "pre" ? M.probPre : M.prob;
  return (
    <div className="panel">
      <div className="panel-head"><h3>Win probability</h3><span className="panel-head-link" style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{state === "live" ? "Live" : "Pre-match"}</span></div>
      <div className="prob-bar"><span className="ph" style={{ width: p.home + "%" }} /><span className="pd" style={{ width: p.draw + "%" }} /><span className="pa" style={{ width: p.away + "%" }} /></div>
      <div className="prob-legend">
        <span className="pl"><span className="v tnum">{p.home}%</span><span className="k">{M.home.code} win</span></span>
        <span className="pl" style={{ alignItems: "center" }}><span className="v tnum">{p.draw}%</span><span className="k">Draw</span></span>
        <span className="pl r"><span className="v tnum">{p.away}%</span><span className="k">{M.away.code} win</span></span>
      </div>
      <div className="odds-grid">
        <div className="odds-cell"><div className="k">{M.home.code}</div><div className="v">{M.odds.home}</div></div>
        <div className="odds-cell"><div className="k">Draw</div><div className="v">{M.odds.draw}</div></div>
        <div className="odds-cell"><div className="k">{M.away.code}</div><div className="v">{M.odds.away}</div></div>
      </div>
      <div className="odds-note"><span>DraftKings moneyline</span><span>O/U {M.odds.ou}</span></div>
    </div>
  );
}
function MotmPanel() {
  return (
    <div className="panel">
      <div className="panel-head"><h3>Player of the match</h3><span className="motm-badge">★</span></div>
      <div className="motm"><div className="av"><span className="ph">7</span></div><div className="info"><div className="nm">{M.motm.name}</div><div className="ln">{M.motm.line}</div></div></div>
    </div>
  );
}
function H2HPanel() {
  const s = M.h2hSummary, tot = s.usaW + s.draw + s.engW;
  return (
    <div className="panel">
      <div className="panel-head"><h3>Head to head</h3><span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>Last {M.h2h.length}</span></div>
      <div className="h2h-sum">
        <div className="seg"><div className="n tnum">{s.usaW}</div><div className="k">{M.home.code}</div></div>
        <div className="meter"><div className="track"><span className="w" style={{ width: (s.usaW / tot) * 100 + "%" }} /><span className="d" style={{ width: (s.draw / tot) * 100 + "%" }} /><span className="l" style={{ width: (s.engW / tot) * 100 + "%" }} /></div></div>
        <div className="seg"><div className="n tnum">{s.engW}</div><div className="k">{M.away.code}</div></div>
      </div>
      {M.h2h.map((m, i) => (
        <div className="h2h-row" key={i}>
          <span className="meet">{m.h} <span className="sc tnum">{m.score}</span> {m.a}</span>
          <span className="comp">{m.date} · {m.comp}</span>
        </div>
      ))}
    </div>
  );
}
function GroupBPanel() {
  return (
    <div className="panel">
      <div className="panel-head"><h3>Group {M.group}</h3><a className="link" href="Group Detail Hi-Fi.html" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", textDecoration: "none" }}>Full table →</a></div>
      <div className="gtable">
        <div className="gt-row head"><span className="rk">#</span><span className="tm">Team</span><span className="num">GD</span><span className="num">Pl</span><span className="pts">Pts</span></div>
        {M.groupB.map((t, i) => (
          <div key={t.code} className={"gt-row" + (t.status === "adv" ? " adv" : t.status === "best3" ? " best3" : "") + (t.mine ? " mine" : "")}>
            <span className="rk tnum">{i + 1}</span>
            <span className="tm"><Flag code={t.code} flag={t.flag} size={18} /><span>{t.code}</span></span>
            <span className="num tnum">{t.gd}</span>
            <span className="num tnum">{t.pl}</span>
            <span className="pts tnum">{t.pts}</span>
          </div>
        ))}
      </div>
      <div className="embed-foot"><span className="gt-foot" style={{ padding: 0 }}><span className="k"><span className="sw" style={{ width: 9, height: 9, borderRadius: 3, background: "var(--advance)", border: "1px solid #cfe8d8" }} /> Advance to Round of 32</span></span></div>
    </div>
  );
}
function WatchPanel({ state }) {
  return (
    <div className="panel">
      <div className="panel-head"><h3>{state === "post" ? "Highlights & recap" : "Where to watch"}</h3></div>
      {state === "post" && (
        <div className="watch-thumb"><div className="play"><Play style={{ color: "#fff", marginLeft: 2 }} /></div><span className="cap">highlight reel · 4:12</span></div>
      )}
      <div className="watch-row"><span className="lbl"><Tv /> Broadcast</span><span className="val">{M.tv} · FS1</span></div>
      <div className="watch-row"><span className="lbl"><Tv /> Streaming</span><span className="val">Peacock</span></div>
      {state === "post"
        ? <div className="watch-row"><span className="lbl"><People /> Match recap</span><span className="val" style={{ color: "var(--link)" }}>Read →</span></div>
        : <div className="watch-row"><span className="lbl"><PinSm /> Kick-off</span><span className="val">{M.kickoff}</span></div>}
    </div>
  );
}

function Shelf({ state }) {
  return (
    <div className="shelf">
      {state === "post" ? <MotmPanel /> : <ProbPanel state={state} />}
      <H2HPanel />
      <GroupBPanel />
      <WatchPanel state={state} />
    </div>
  );
}

/* ---------- app ---------- */
const TABS = ["Summary", "Stats", "Lineups", "Commentary"];
function App() {
  const [t, setTweak] = useTweaks({ state: "Live", accent: "#0a2240", density: "Standard" });
  const [tab, setTab] = useState("Summary");
  const state = t.state.toLowerCase();

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-ink", "#ffffff");
  }, [t.accent]);
  useEffect(() => { document.body.classList.toggle("dense", t.density === "Dense"); }, [t.density]);

  const liveCount = state === "live" ? M.events.filter((e) => e.at <= 67 && e.type !== "whistle").length : (state === "post" ? M.events.filter((e) => e.type !== "whistle").length : 0);

  return (
    <>
      <PageNav active="Schedule" />
      <div className="page">
        <MatchHero state={state} />

        <div className="mtabs">
          {TABS.map((tb) => (
            <button key={tb} className={"mtab" + (tb === tab ? " on" : "")} onClick={() => setTab(tb)}>
              {tb}
              {tb === "Summary" && liveCount > 0 && <span className="pill tnum">{liveCount}</span>}
            </button>
          ))}
        </div>

        <div className="cols mcols">
          <div><MainColumn tab={tab} state={state} /></div>
          <Shelf state={state} />
        </div>

        <PageFooter />
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Match state" />
        <TweakRadio label="Phase" value={t.state} options={["Pre", "Live", "Post"]} onChange={(v) => { setTweak("state", v); }} />
        <TweakSection label="Appearance" />
        <TweakColor label="Accent" value={t.accent} options={["#0a2240", "#16a34a", "#2563eb", "#d98c0a"]} onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Density" value={t.density} options={["Standard", "Dense"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
