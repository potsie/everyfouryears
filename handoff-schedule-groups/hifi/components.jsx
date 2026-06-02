/* ============================================================
   components.jsx — hi-fi homepage component vocabulary
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ---------- icons ---------- */
const Pin = (p) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2"/></svg>);
const Chev = (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const Star = (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 21.4l1.4-6.8L2.2 9.9l6.9-.7L12 2Z"/></svg>);
const Search = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);

/* ---------- flag (real ESPN asset → monogram fallback) ---------- */
function Flag({ code, flag, size = 24 }) {
  const [err, setErr] = useState(false);
  const h = Math.round(size * 0.7);
  const box = { width: size, height: h };
  if (err) return <span className="flag flag-mono" style={{ ...box, fontSize: Math.max(8, size * 0.34) }}>{code}</span>;
  return <img className="flag" src={(window.WC.flagBase) + flag + ".png"} alt={code} style={{ ...box, objectFit: "cover" }} onError={() => setErr(true)} />;
}

function Pulse({ dark }) { return <span className={"pulse" + (dark ? " on-dark" : "")} />; }

/* ---------- nav ---------- */
function Nav() {
  const links = ["Today","Schedule","Groups","Bracket","Teams","Venues","Stats"];
  return (
    <div className="nav">
      <div className="nav-in">
        <div className="brand"><span className="mark">⚽</span>everyfouryears<span className="dot">.</span>futbol</div>
        <nav className="nav-links">
          {links.map((l, i) => <a key={l} href="#" className={i === 0 ? "active" : ""} onClick={(e)=>e.preventDefault()}>{l}</a>)}
        </nav>
        <div className="nav-tools">
          <button className="btn icon-btn btn-ghost hide-narrow" aria-label="Search"><Search/></button>
          <button className="btn btn-primary"><Star/> My Team</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- countdown ---------- */
function Countdown() {
  const target = useRef(Date.now() + (10*864e5 + 4*36e5 + 37*6e4 + 12*1e3));
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(t => t + 1), 1000); return () => clearInterval(id); }, []);
  let s = Math.max(0, Math.floor((target.current - Date.now()) / 1000));
  const d = Math.floor(s/86400); s-=d*86400; const h=Math.floor(s/3600); s-=h*3600; const m=Math.floor(s/60); const sec=s-m*60;
  const pad = (n) => String(n).padStart(2,"0");
  const units = [[pad(d),"Days"],[pad(h),"Hours"],[pad(m),"Min"],[pad(sec),"Sec"]];
  return <div className="countdown">{units.map(([n,l]) => <div className="cd-unit tnum" key={l}><div className="n">{n}</div><div className="l">{l}</div></div>)}</div>;
}

/* ---------- hero (morphs by phase) ---------- */
function Hero({ phase }) {
  const W = window.WC;
  if (phase === "pre") {
    const o = W.opening;
    return (
      <div className="hero"><div className="hero-grain"/><div className="hero-in">
        <div className="hero-top"><span className="hero-kicker">Kicks off in</span><span className="hero-link">Full schedule →</span></div>
        <div className="cd-wrap">
          <Countdown/>
          <div className="opening">
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(255,255,255,.55)",marginBottom:10}}>Opening Match</div>
            <div className="row spread gap12">
              <div className="row gap8"><Flag code={o.a.code} flag={o.a.flag} size={30}/><span className="ko-code">{o.a.code}</span></div>
              <span style={{color:"rgba(255,255,255,.5)",fontWeight:700}}>vs</span>
              <div className="row gap8"><span className="ko-code">{o.b.code}</span><Flag code={o.b.code} flag={o.b.flag} size={30}/></div>
            </div>
            <div style={{marginTop:11,fontSize:12.5,color:"rgba(255,255,255,.72)",display:"flex",justifyContent:"space-between",gap:8}}>
              <span>{o.when}</span><span style={{fontWeight:700}}>{o.tv}</span>
            </div>
          </div>
        </div>
      </div></div>
    );
  }
  if (phase === "knock") {
    return (
      <div className="hero"><div className="hero-grain"/><div className="hero-in">
        <div className="hero-top"><span className="hero-kicker"><Pulse dark/> Round of 16 · Today</span><span className="hero-link">Full bracket →</span></div>
        <div className="ko-grid">
          {W.r16.map((t, i) => (
            <div className="ko-tie" key={i} style={{flex:"1 1 210px"}}>
              <div className={"ko-side" + (t.win===0?" win":"")}><div className="row gap8"><Flag code={t.a.code} flag={t.a.flag} size={24}/><span className="ko-code">{t.a.code}</span></div>{t.win===0&&<span style={{color:"#7ee2a8",fontWeight:800}}>2</span>}</div>
              <div className={"ko-side" + (t.win===1?" win":"")}><div className="row gap8"><Flag code={t.b.code} flag={t.b.flag} size={24}/><span className="ko-code">{t.b.code}</span></div>{t.win===0&&<span style={{color:"rgba(255,255,255,.6)",fontWeight:700}}>1</span>}</div>
              <div style={{fontSize:11.5,color:"rgba(255,255,255,.6)",borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:8,fontWeight:600}}>{t.when} · {t.venue}</div>
            </div>
          ))}
        </div>
      </div></div>
    );
  }
  // live
  const live = W.today.filter(m => m.state === "in" || m.state === "post");
  return (
    <div className="hero"><div className="hero-grain"/><div className="hero-in">
      <div className="hero-top"><span className="hero-kicker"><Pulse dark/> {W.today.filter(m=>m.state==="in").length} matches live now</span><span className="hero-link">Multiview · audio →</span></div>
      <div className="marquee">
        {live.slice(0,4).map(m => {
          const [sa,sb]=m.score;
          return (
            <div className="lmatch" key={m.id}>
              <div className="lm-top"><span>GROUP {m.group}</span>{m.state==="in"?<span style={{color:"#7ee2a8",fontWeight:700}}>{m.clock}</span>:<span>FT</span>}</div>
              <div className={"lm-row"+(sb>sa?" dim":"")}><span className="lm-team"><Flag code={m.a.code} flag={m.a.flag} size={24}/><span className="lm-code">{m.a.code}</span></span><span className="lm-score">{sa}</span></div>
              <div className={"lm-row"+(sa>sb?" dim":"")}><span className="lm-team"><Flag code={m.b.code} flag={m.b.flag} size={24}/><span className="lm-code">{m.b.code}</span></span><span className="lm-score">{sb}</span></div>
            </div>
          );
        })}
      </div>
    </div></div>
  );
}

/* ---------- date rail ---------- */
function DateRail({ active, setActive }) {
  const ref = useRef(null);
  const scroll = (dir) => { if (ref.current) ref.current.scrollBy({ left: dir*240, behavior:"smooth" }); };
  useEffect(() => {
    const el = ref.current?.querySelector(".daypill.active");
    if (el) el.scrollIntoView({ inline:"center", block:"nearest" });
  }, []);
  return (
    <div className="rail-wrap">
      <button className="rail-nav" onClick={()=>scroll(-1)} aria-label="Earlier"><Chev style={{transform:"rotate(90deg)"}}/></button>
      <div className="rail" ref={ref}>
        {window.WC.dates.map(d => (
          <button key={d.id} className={"daypill"+(d.id===active?" active":"")+(d.phase==="ko"?" phase-ko":"")} onClick={()=>setActive(d.id)}>
            <div className="dow">{d.dow}</div>
            <div className="dn tnum">{d.d}</div>
            <div className="mc">{d.mc} {d.mc===1?"match":"matches"}</div>
          </button>
        ))}
      </div>
      <button className="rail-nav" onClick={()=>scroll(1)} aria-label="Later"><Chev style={{transform:"rotate(-90deg)"}}/></button>
    </div>
  );
}

/* ---------- match card ---------- */
function TeamRow({ t, score, pre, lead, lose, big }) {
  return (
    <div className={"mteam"+(lead?" lead":"")+(lose?" lose":"")}>
      <Flag code={t.code} flag={t.flag} size={big?32:30}/>
      <span className="mt-name">{t.code}<span className="full">{t.name}</span></span>
      {pre ? <span className="mt-score" style={{color:"var(--ink-3)",fontSize:18}}>–</span> : <span className="mt-score tnum">{score}</span>}
    </div>
  );
}
function MatchCard({ m }) {
  const [sa,sb]=m.score;
  const pre = m.state==="pre";
  const leadA = !pre && sa>sb, leadB = !pre && sb>sa;
  const teamName = (code)=>window.WC.team(code).name;
  return (
    <div className="mcard">
      <div className="mcard-head">
        <span className="g">GROUP {m.group}</span>
        {m.state==="in" ? <span className="st live"><Pulse/> <span className="minute">{m.clock}</span></span>
          : m.state==="post" ? <span className="st ft">FULL TIME</span>
          : <span className="st">{m.kickoff}</span>}
      </div>
      <div className="mcard-body">
        <TeamRow t={m.a} score={sa} pre={pre} lead={leadA} lose={leadB} big/>
        <TeamRow t={m.b} score={sb} pre={pre} lead={leadB} lose={leadA} big/>
      </div>
      {m.scorers && m.scorers.length>0 && (
        <div className="scorers">
          {m.scorers.map((g,i)=>(
            <div className="s" key={i}><span style={{fontSize:11}}>⚽</span><span className="tnum">{g.m}</span><span className="b">{g.p}</span>{g.pen&&<span className="muted">(pen)</span>}<span className="muted">· {g.t}</span></div>
          ))}
        </div>
      )}
      <div className="mcard-foot">
        <span className="venue"><Pin/> {m.venue} · {m.city}</span>
        <span className="tv">{m.tv}</span>
      </div>
    </div>
  );
}

/* ---------- group table ---------- */
function GroupTable({ grp }) {
  return (
    <div className="gtable">
      <div className="gt-title">GROUP {grp.g}</div>
      <div className="gt-row head"><span className="rk">#</span><span className="tm">Team</span><span className="num">GD</span><span className="num">Pl</span><span className="pts">Pts</span></div>
      {grp.teams.map(t => (
        <div key={t.code} className={"gt-row"+(t.status==="adv"?" adv":t.status==="best3"?" best3":"")+(t.mine?" mine":"")}>
          <span className="rk tnum">{t.rk}</span>
          <span className="tm"><Flag code={t.code} flag={t.flag} size={18}/><span>{t.code}</span></span>
          <span className="num tnum">{t.gd>0?"+":""}{t.gd}</span>
          <span className="num tnum">{t.gp}</span>
          <span className="pts tnum">{t.pts}</span>
        </div>
      ))}
    </div>
  );
}
function GroupsLegend() {
  return (
    <div className="row gap12" style={{marginTop:12,fontSize:11.5,color:"var(--ink-3)",flexWrap:"wrap"}}>
      <span className="gt-foot" style={{padding:0}}><span className="k"><span className="sw" style={{background:"var(--advance)",border:"1px solid #cfe8d8"}}/> Advance to Round of 32</span></span>
      <span className="gt-foot" style={{padding:0}}><span className="k"><span className="sw" style={{background:"var(--best3)",border:"1px solid #f0e2bd"}}/> Best-third contention</span></span>
      <span className="gt-foot" style={{padding:0}}><span className="k"><span className="sw" style={{background:"#fff",border:"3px solid var(--accent)",borderRadius:3}}/> My team</span></span>
    </div>
  );
}

/* ---------- leaders ---------- */
function LeadersPanel() {
  const cats = Object.keys(window.WC.leaders);
  const [cat, setCat] = useState(cats[0]);
  const rows = window.WC.leaders[cat];
  return (
    <div className="panel">
      <div className="panel-head"><h3>Stat Leaders</h3><button className="link">Full stats →</button></div>
      <div className="stat-tabs">{cats.map(c => <button key={c} className={"stat-tab"+(c===cat?" active":"")} onClick={()=>setCat(c)}>{c}</button>)}</div>
      {rows.slice(0,5).map((r,i) => {
        const tm = window.WC.team(r.t);
        return (
          <div className="leader" key={r.p}>
            <span className="lr-rank tnum">{i+1}</span>
            <div className="lr-info"><div className="lr-name">{r.p}</div><div className="lr-meta"><Flag code={tm.code} flag={tm.flag} size={15}/> {tm.name}</div></div>
            <span className="lr-val tnum">{r.v}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- my team ---------- */
function MyTeamCard() {
  const m = window.WC.myTeam;
  return (
    <div className="myteam">
      <div className="mt-h"><Star/> My Team</div>
      <div className="mt-main">
        <Flag code={m.code} flag={m.flag} size={36}/>
        <div><div className="mt-code">{m.code}</div><div className="mt-sub">Group {m.group} · {m.rank===1?"1st":m.rank+"th"} · {m.pts} pts</div></div>
      </div>
      <div className="mt-next"><span>Next · vs {m.next.opp.code}</span><span style={{color:"rgba(255,255,255,.6)"}}>{m.next.when}</span></div>
    </div>
  );
}

Object.assign(window, { Flag, Pulse, Nav, Hero, Countdown, DateRail, MatchCard, TeamRow, GroupTable, GroupsLegend, LeadersPanel, MyTeamCard, Pin, Chev, Star });
