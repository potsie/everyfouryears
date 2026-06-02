/* ============================================================
   team-shared.jsx — helpers shared by team/roster/player pages
   Exports: Shot, Arrow, GroupMini
   ============================================================ */
(function () {
  const { useState } = React;

  // headshot placeholder (real ESPN headshot drops in here in production)
  function Shot({ size = 48, num, name, dark }) {
    const initials = name ? name.trim().split(/\s+/).slice(-2).map((s) => s[0]).join("") : "";
    return (
      <div className={"shot" + (dark ? " ph-shot" : "")} style={{ width: size, height: size }}>
        <span className="mono" style={{ fontSize: Math.max(10, size * (initials ? 0.32 : 0.16)) }}>{initials || "PHOTO"}</span>
        {num != null && <span className="num-badge">{num}</span>}
      </div>
    );
  }

  const Arrow = (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>);

  // compact group standings table (reuses ds.css .gtable)
  function GroupMini({ rows, letter }) {
    return (
      <div className="gtable">
        <div className="gt-row head"><span className="rk">#</span><span className="tm">Team</span><span className="num">GD</span><span className="num">Pl</span><span className="pts">Pts</span></div>
        {rows.map((t, i) => (
          <div key={t.code} className={"gt-row" + (t.status === "adv" ? " adv" : t.status === "best3" ? " best3" : "") + (t.mine ? " mine" : "")}>
            <span className="rk tnum">{i + 1}</span>
            <span className="tm"><Flag code={t.code} flag={t.flag} size={18} /><span>{t.code}</span></span>
            <span className="num tnum">{t.gd}</span>
            <span className="num tnum">{t.pl}</span>
            <span className="pts tnum">{t.pts}</span>
          </div>
        ))}
      </div>
    );
  }

  Object.assign(window, { Shot, Arrow, GroupMini });
})();
