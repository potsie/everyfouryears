/* ============================================================
   page-shell.jsx — shared chrome for the non-home pages
   Exports: PageNav, PageFooter, ChevR, SearchIco
   (Flag, Star, Pin, Pulse, GroupTable come from components.jsx)
   ============================================================ */
(function () {
  const SearchIco = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>);
  const ChevR = (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
  const Check = (p) => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" {...p}><path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>);

  const NAV = [
    ["Today", "Homepage Hi-Fi.html"],
    ["Schedule", "Schedule Hi-Fi.html"],
    ["Groups", "Groups Hi-Fi.html"],
    ["Bracket", "#"],
    ["Teams", "Team Profile Hi-Fi.html"],
    ["Venues", "#"],
    ["Stats", "#"],
  ];

  function PageNav({ active }) {
    return (
      <div className="nav">
        <div className="nav-in">
          <a className="brand" href="Homepage Hi-Fi.html" style={{ textDecoration: "none" }}>
            <span className="mark">⚽</span>everyfouryears<span className="dot">.</span>futbol
          </a>
          <nav className="nav-links">
            {NAV.map(([l, h]) => <a key={l} href={h} className={l === active ? "active" : ""}>{l}</a>)}
          </nav>
          <div className="nav-tools">
            <button className="btn icon-btn btn-ghost hide-narrow" aria-label="Search"><SearchIco /></button>
            <button className="btn btn-primary"><Star /> My Team</button>
          </div>
        </div>
      </div>
    );
  }

  function PageFooter() {
    return (
      <div className="foot-note">
        <span>Data updates live during matches · all times shown in your local timezone</span>
        <span>Where to watch: FOX · FS1 · Telemundo · Peacock</span>
      </div>
    );
  }

  Object.assign(window, { PageNav, PageFooter, ChevR, SearchIco, Check });
})();
