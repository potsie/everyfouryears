/* ============================================================
   group-detail.jsx — /groups/{x}  (single group)
   Reads ?g=A (default A). Standings are COMPUTED from the
   generated fixtures so the table and the results list agree.
   ============================================================ */
const { useState, useEffect } = React;

const MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const shortDate = (ms) => { const d = new Date(ms); return DOW3[d.getDay()] + ", " + MON3[d.getMonth()] + " " + d.getDate(); };

function standingsFor(g) {
  const grp = window.WC.groups.find((x) => x.g === g);
  const fx = window.WCSchedule.groupFixtures[g] || [];
  const teams = {};
  grp.teams.forEach((tm) => {
    teams[tm.code] = { code: tm.code, name: tm.name, flag: tm.flag, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [], mine: tm.code === "USA" };
  });
  fx.filter((m) => m.state === "post").sort((a, b) => a.no - b.no).forEach((m) => {
    const [sa, sb] = m.score, A = teams[m.a.code], B = teams[m.b.code];
    A.gp++; B.gp++; A.gf += sa; A.ga += sb; B.gf += sb; B.ga += sa;
    if (sa > sb) { A.w++; B.l++; A.pts += 3; A.form.push("w"); B.form.push("l"); }
    else if (sb > sa) { B.w++; A.l++; B.pts += 3; B.form.push("w"); A.form.push("l"); }
    else { A.d++; B.d++; A.pts++; B.pts++; A.form.push("d"); B.form.push("d"); }
  });
  const arr = Object.values(teams).map((t) => ({ ...t, gd: t.gf - t.ga }));
  arr.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.code.localeCompare(b.code));
  arr.forEach((t, i) => { t.rk = i + 1; t.status = i < 2 ? "adv" : i === 2 ? "best3" : "out"; });
  return arr;
}

function FormDots({ form }) {
  if (!form.length) return <span className="fdot none"> </span>;
  return <>{form.slice(-4).map((r, i) => <span key={i} className={"fdot " + r}>{r.toUpperCase()}</span>)}</>;
}

/* fixtures row (results always visible here) */
function FRow({ m }) {
  const post = m.state === "post";
  const [a, b] = m.score || [];
  const loseA = post && a < b, loseB = post && b < a;
  const status = m.state === "in"
    ? <span className="s-status s-live"><Pulse />{m.clock}</span>
    : m.state === "post" ? <span className="s-status s-ft">FULL TIME</span>
      : <span className="s-status s-time tnum">{m.kickoff}</span>;
  return (
    <div className="srow">
      {status}
      <span className={"s-team a" + (loseA ? " lose" : "")}><span className="s-code">{m.a.code}</span><Flag code={m.a.code} flag={m.a.flag} size={22} /></span>
      {m.state === "pre"
        ? <span className="s-score pre">vs</span>
        : <span className="s-score tnum">{a}<span className="x">–</span>{b}</span>}
      <span className={"s-team b" + (loseB ? " lose" : "")}><Flag code={m.b.code} flag={m.b.flag} size={22} /><span className="s-code">{m.b.code}</span></span>
      <span className="s-meta"><span className="s-ven"><Pin /><span>{m.venue} · {m.city}</span></span></span>
      <span className="s-tv tv">{m.tv}</span>
    </div>
  );
}

function GroupSwitch({ g }) {
  return (
    <div className="row" style={{ gap: 7, flexWrap: "wrap", margin: "0 0 4px" }}>
      <span className="eyebrow" style={{ marginRight: 4 }}>Jump to</span>
      {window.WC.groups.map((x) => (
        <a key={x.g} href={"Group Detail Hi-Fi.html?g=" + x.g}
          className="s-grp" style={{ textDecoration: "none", padding: "4px 9px", background: x.g === g ? "var(--accent)" : "var(--surface)", color: x.g === g ? "var(--accent-ink)" : "var(--ink-2)", borderColor: x.g === g ? "var(--accent)" : "var(--line)" }}>
          {x.g}
        </a>
      ))}
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

  const params = new URLSearchParams(window.location.search);
  let g = (params.get("g") || "A").toUpperCase();
  if (!window.WC.groups.some((x) => x.g === g)) g = "A";

  const standings = standingsFor(g);
  const fx = window.WCSchedule.groupFixtures[g] || [];
  const mds = [0, 1, 2].map((md) => ({ md, matches: fx.filter((m) => m.md === md).sort((a, b) => a.no - b.no) })).filter((x) => x.matches.length);
  const played = fx.filter((m) => m.state === "post").length;
  const top2 = standings.slice(0, 2);

  return (
    <>
      <PageNav active="Groups" />
      <div className="page">
        <div className="gd-hero">
          <div className="hero-grain" />
          <div className="gd-hero-in">
            <div>
              <a className="gd-back" href="Groups Hi-Fi.html">← All groups</a>
              <div className="gd-eyebrow" style={{ marginTop: 14 }}>2026 FIFA World Cup · Group Stage</div>
              <div className="gd-letter">Group {g}</div>
            </div>
            <div className="gd-flags">
              {standings.map((tm) => (
                <div className="gf" key={tm.code}><Flag code={tm.code} flag={tm.flag} size={34} /><span className="c">{tm.code}</span></div>
              ))}
            </div>
          </div>
        </div>

        <GroupSwitch g={g} />

        <div className="gd-cols">
          <section style={{ marginTop: 18 }}>
            <div className="gd-section-head">
              <h2>Standings</h2>
              <span className="eyebrow">{played} of 6 matches played</span>
            </div>
            <div className="gtable-wide">
              <div className="gw-row head">
                <span className="rk">#</span><span className="tm">Team</span>
                <span className="num">Pl</span><span className="num">W</span><span className="num">D</span><span className="num">L</span>
                <span className="num hide-s">GF</span><span className="num hide-s">GA</span><span className="num">GD</span>
                <span className="num hide-s">Form</span><span className="pts">Pts</span>
              </div>
              {standings.map((tm) => (
                <div key={tm.code} className={"gw-row" + (tm.status === "adv" ? " adv" : tm.status === "best3" ? " best3" : "") + (tm.mine ? " mine" : "")}>
                  <span className="rk tnum">{tm.rk}</span>
                  <span className="tm">
                    <Flag code={tm.code} flag={tm.flag} size={26} />
                    <span><span className="c">{tm.code}</span><span className="n">{tm.name}</span></span>
                  </span>
                  <span className="num tnum">{tm.gp}</span>
                  <span className="num tnum">{tm.w}</span>
                  <span className="num tnum">{tm.d}</span>
                  <span className="num tnum">{tm.l}</span>
                  <span className="num tnum hide-s">{tm.gf}</span>
                  <span className="num tnum hide-s">{tm.ga}</span>
                  <span className="num tnum">{tm.gd > 0 ? "+" : ""}{tm.gd}</span>
                  <span className="form hide-s"><FormDots form={tm.form} /></span>
                  <span className="pts tnum">{tm.pts}</span>
                </div>
              ))}
            </div>
            <div className="row gap12" style={{ marginTop: 12, fontSize: 11.5, color: "var(--ink-3)", flexWrap: "wrap" }}>
              <span className="gt-foot" style={{ padding: 0 }}><span className="k"><span className="sw" style={{ background: "var(--advance)", border: "1px solid #cfe8d8" }} /> Advance to Round of 32</span></span>
              <span className="gt-foot" style={{ padding: 0 }}><span className="k"><span className="sw" style={{ background: "var(--best3)", border: "1px solid #f0e2bd" }} /> Best-third contention</span></span>
              <span className="gt-foot" style={{ padding: 0 }}><span className="k"><span className="sw" style={{ background: "#fff", border: "3px solid var(--accent)", borderRadius: 3 }} /> My team</span></span>
            </div>
            <p className="qual-note" style={{ marginTop: 14 }}>
              Top two advance to the Round of 32; the third-placed team may still qualify among the eight best third-placed sides.
              {played >= 2 && <> As it stands, <span className="b">{top2[0].name}</span> and <span className="b">{top2[1].name}</span> hold the qualification places.</>}
            </p>
          </section>

          <section>
            <div className="gd-section-head">
              <h2>Fixtures &amp; Results</h2>
              <span className="eyebrow">Round robin · 6 matches</span>
            </div>
            {mds.map(({ md, matches }) => (
              <div className="gd-md" key={md}>
                <div className="md-label">Matchday {md + 1} <span className="d">· {shortDate(matches[0].date)}</span></div>
                <div className="slist">{matches.map((m) => <FRow key={m.id} m={m} />)}</div>
              </div>
            ))}
          </section>
        </div>

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
