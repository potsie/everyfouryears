/* ============================================================
   kit.jsx — shared low-fi wireframe primitives
   ============================================================ */
const { useState } = React;

/* ---- device frames ---- */
function Browser({ children }) {
  return (
    <div className="device">
      <div className="cap">DESKTOP <span className="dim">~1280w</span></div>
      <div className="browser">
        <div className="browser-bar">
          <div className="dots"><i></i><i></i><i></i></div>
          <div className="url">everyfouryears.futbol</div>
        </div>
        <div className="screen desk">{children}</div>
      </div>
    </div>
  );
}
function Phone({ children }) {
  return (
    <div className="device">
      <div className="cap">MOBILE <span className="dim">375w</span></div>
      <div className="phone">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          <div className="screen mob">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---- placeholders ---- */
function Ph({ label, style, cls = "" }) {
  return <div className={"ph " + cls} style={style}>{label}</div>;
}
function FlagPh({ ab, w = 34 }) {
  return (
    <div className="team" style={{ flexDirection: "column", gap: 5, alignItems: "center" }}>
      <div className="ph flag" style={{ width: w }}>{ab}</div>
    </div>
  );
}

/* ---- nav ---- */
function Nav({ items = ["Schedule","Groups","Bracket","Teams","Venues","Stats"], active = "Schedule", compact }) {
  return (
    <div className="wf-nav">
      <div className="logo">everyfouryears<span className="dot">.</span>futbol</div>
      {!compact && (
        <div className="navitems">
          {items.map(i => <span key={i} className={i === active ? "act" : ""}>{i}</span>)}
        </div>
      )}
      {compact && <div className="grow"></div>}
      <div className="pinbtn">{compact ? "📌" : "📌 MY TEAM"}</div>
      {!compact && <div className="pinbtn">⌕</div>}
    </div>
  );
}

/* ---- match card ---- */
function MatchCard({ a, b, sa, sb, state, clk, venue, tv, time, group }) {
  return (
    <div className="mcard col gap8">
      <div className="row between center tiny mono muted">
        <span>{group}</span>
        {state === "in" ? <span className="live-tag"><span className="live-dot"></span>LIVE</span>
          : state === "post" ? <span>FT</span> : <span>{time}</span>}
      </div>
      <div className="row between center">
        <div className="team grow"><div className="ph flag" style={{ width: 34 }}>{a}</div></div>
        {state === "pre"
          ? <span className="vs">v</span>
          : <span className="score">{sa}–{sb}</span>}
        <div className="team grow" style={{ justifyContent: "flex-end" }}><div className="ph flag" style={{ width: 34 }}>{b}</div></div>
      </div>
      <div className="divider"></div>
      <div className="row between center tiny muted">
        <span className="mono">📍 {venue}</span>
        {state === "in" ? <span className="clk mono">{clk}</span> : <span className="tv">{tv}</span>}
      </div>
    </div>
  );
}

/* ---- group table ---- */
function GroupTable({ g = "A", teams }) {
  const rows = teams || [
    { ab: "BRA", p: 7, rk: 1, adv: true },
    { ab: "MEX", p: 4, rk: 2, adv: true, mine: true },
    { ab: "NOR", p: 3, rk: 3 },
    { ab: "KSA", p: 1, rk: 4 },
  ];
  return (
    <div className="gtable">
      <div className="gh">GROUP {g}</div>
      {rows.map(r => (
        <div key={r.ab} className={"grow2 grow " + (r.adv ? "adv " : "") + (r.mine ? "mine" : "")} style={{ display: "grid", gridTemplateColumns: "18px 1fr 22px 26px", gap: 6, alignItems: "center", padding: "5px 9px", borderTop: "1px solid var(--ink3)", fontSize: "12px", boxShadow: r.mine ? "inset 3px 0 0 var(--live)" : "none", background: r.adv ? "var(--hl)" : "transparent" }}>
          <span className="rk mono">{r.rk}</span>
          <span className="row center gap6"><span className="ph flag" style={{ width: 20 }}> </span>{r.ab}</span>
          <span className="mono muted" style={{ textAlign: "center" }}>3</span>
          <span className="pt">{r.p}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- date swiper ---- */
function DateSwiper({ activeIdx = 2 }) {
  const days = [
    { d: "JUN", n: "11" }, { d: "JUN", n: "12" }, { d: "JUN", n: "13" },
    { d: "JUN", n: "14" }, { d: "JUN", n: "15" }, { d: "JUN", n: "16" }, { d: "JUN", n: "17" },
  ];
  return (
    <div className="swiper">
      <span className="mono muted tiny">‹</span>
      {days.map((x, i) => (
        <div key={i} className={"pill" + (i === activeIdx ? " act" : "")}>
          <span className="d">{x.d}</span>{x.n}
        </div>
      ))}
      <span className="mono muted tiny">›</span>
    </div>
  );
}

/* ---- countdown ---- */
function Countdown({ small }) {
  const u = [["10","DAYS"],["04","HRS"],["37","MIN"],["12","SEC"]];
  return (
    <div className="cd">
      {u.map(([n,l]) => <div key={l} className="unit"><div className="num">{n}</div><div className="lab">{l}</div></div>)}
    </div>
  );
}

/* ---- bracket fragment ---- */
function BracketFrag() {
  return (
    <div className="brk">
      <div className="col gap8">
        <div className="slot win">🇧🇷 BRA <span className="mono muted">2</span></div>
        <div className="slot">🇨🇴 COL <span className="mono muted">1</span></div>
      </div>
      <div className="conn"></div>
      <div className="slot" style={{ borderStyle: "dashed" }}>QF · winner</div>
    </div>
  );
}

/* ---- annotation (in-flow sticky note, lives inside the device frame) ---- */
function Annot({ children }) {
  return <div className="annot">{children}</div>;
}

/* ---- section header ---- */
function SecH({ children, more = "see all" }) {
  return <div className="sec-h">{children}<span className="more">{more} ›</span></div>;
}

Object.assign(window, {
  Browser, Phone, Ph, FlagPh, Nav, MatchCard, GroupTable,
  DateSwiper, Countdown, BracketFrag, Annot, SecH,
});
