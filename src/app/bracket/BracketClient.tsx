'use client';

import { useState, useEffect, useLayoutEffect, useRef, useMemo, createContext, useContext } from 'react';
import Link from 'next/link';
import { Flag } from '@/components/Flag';
import { PageHero } from '@/components/PageHero';
import { useMyTeam } from '@/contexts/my-team-context';
import { isTBD, hydrateClientBracket } from '@/lib/bracket-data';
import type { Tie, PathResult, WCBracketData, BracketColumn, TieTeam, SerializableBracket } from '@/lib/bracket-data';

/* ---------- context ---------- */
const BracketCtx = createContext<WCBracketData>(null as unknown as WCBracketData);
function useBK() { return useContext(BracketCtx); }

/* ---------- inline icons ---------- */
function Pulse() {
  return <span className="pulse-dot" style={{ width: 7, height: 7 }} />;
}
function PinIco() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function CheckIco() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}

function short(w: string | null): string {
  return (w || '').replace(/^\w+ · /, '').replace(':00', '');
}

function localTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(':00', '');
}

function localDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function bracketWhen(t: Tie): string {
  if (t.dateISO) {
    if (t.state === 'tbd') return `${localDate(t.dateISO)} · ${localTime(t.dateISO)}`;
    return localTime(t.dateISO);
  }
  return short(t.when);
}

/* ---------- compact tie (full bracket) ---------- */
interface BTieProps {
  t: Tie;
  path: PathResult;
  active: string | null;
}

// Hoisted out of BTie so it isn't redefined on every render (react-hooks/static-components).
function BTieTeamRow({ t, s, isPost, isLive }: { t: Tie; s: 'a' | 'b'; isPost: boolean; isLive: boolean }) {
  const team = t[s];
  const win = isPost && t.winner === s;
  const lose = isPost && t.winner !== s;
  if (isTBD(team)) {
    return <div className="bt-row tbd"><span className="bt-code">{team.src}</span></div>;
  }
  return (
    <div className={`bt-row${win ? ' win' : ''}${lose ? ' lose' : ''}`}>
      <Flag logo={(team as TieTeam).flag} abbr={(team as TieTeam).code} size={15} />
      <span className="bt-code">{(team as TieTeam).code}</span>
      {(isPost || isLive) && t.score && (
        <span className="bt-sc tnum">{t.score[s === 'a' ? 0 : 1]}</span>
      )}
    </div>
  );
}

function BTie({ t, path, active }: BTieProps) {
  const bk = useBK();
  const isPost = t.state === 'post';
  const isLive = t.state === 'in';
  const isTbd = t.state === 'tbd';
  const onPath = path.confirmed.has(t.id);
  const onFut = path.future.has(t.id);
  const faded = !!active && !onPath && !onFut;

  const hasMine = !isTbd && (
    (!isTBD(t.a) && (t.a as TieTeam).code === bk.myTeam) ||
    (!isTBD(t.b) && (t.b as TieTeam).code === bk.myTeam)
  );

  let foot: React.ReactNode = null;
  if (isLive) {
    foot = <div className="bt-foot live"><Pulse /><span>{t.tag} · {t.clock}</span></div>;
  } else if ((t.state === 'pre' || isTbd) && t.tag) {
    foot = (
      <div className="bt-foot">
        <span className="tg">{t.tag}</span>
        {t.state === 'pre' && (t.dateISO || t.when) && <> · {bracketWhen(t)}</>}
      </div>
    );
  }

  const cls = [
    'btie',
    isLive ? 'is-live' : '',
    isTbd ? 'is-tbd' : '',
    onPath ? 'on-path' : '',
    onFut ? 'on-future' : '',
    faded ? 'faded' : '',
    hasMine ? 'has-mine' : '',
  ].filter(Boolean).join(' ');

  const mineCode = hasMine ? bk.myTeam : '';

  return (
    <a
      data-tie={t.id}
      className={cls}
      href={`/match/${t.id}`}
    >
      {hasMine && (
        <span
          className="bt-mine"
          title={`${mineCode} — your team`}
          aria-label={`${mineCode} is your team`}
        >
          <CheckIco />
        </span>
      )}
      <BTieTeamRow t={t} s="a" isPost={isPost} isLive={isLive} />
      <BTieTeamRow t={t} s="b" isPost={isPost} isLive={isLive} />
      {foot}
    </a>
  );
}

/* ---------- center final + third ---------- */
function FinalCard({ path }: { path: PathResult }) {
  const bk = useBK();
  const f = bk.final;
  const onPath = path.future.has(f.id) || path.confirmed.has(f.id);
  return (
    <a
      data-tie={f.id}
      className="bk-final"
      href={`/match/${f.id}`}
      style={onPath ? { outline: '2px solid var(--accent)', outlineOffset: 2 } : undefined}
    >
      <div className="bf-cap">
        <span className="bf-trophy">🏆</span>
        <div className="bf-ttl">Final</div>
      </div>
      <div className="bf-rows">
        <div className="bf-row">
          <span className="bf-code">{isTBD(f.a) ? f.a.src : (f.a as TieTeam).code}</span>
        </div>
        <div className="bf-row">
          <span className="bf-code">{isTBD(f.b) ? f.b.src : (f.b as TieTeam).code}</span>
        </div>
      </div>
      <div className="bf-when">{f.venue} · {bracketWhen(f)}</div>
    </a>
  );
}

function ThirdCard() {
  const bk = useBK();
  const t = bk.third;
  return (
    <a data-tie={t.id} className="bk-third" href={`/match/${t.id}`}>
      <div className="b3-cap">Third Place</div>
      <div className="b3-row"><span>{isTBD(t.a) ? t.a.src : (t.a as TieTeam).code}</span></div>
      <div className="b3-row"><span>{isTBD(t.b) ? t.b.src : (t.b as TieTeam).code}</span></div>
    </a>
  );
}

/* ---------- full bracket ---------- */
interface FullBracketProps {
  path: PathResult;
  active: string | null;
  onFocusRound: (key: string) => void;
}

interface LineSeg {
  key: string;
  d: string;
  conn: string;
}

function FullBracket({ path, active, onFocusRound }: FullBracketProps) {
  const bk = useBK();
  const gridRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LineSeg[]>([]);
  const [dims, setDims] = useState({ w: 1180, h: 528 });

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const measure = () => {
      const W = grid.offsetWidth;
      const H = grid.offsetHeight;
      setDims({ w: W, h: H });

      const pos: Record<string, { l: number; t: number; w: number; h: number }> = {};
      grid.querySelectorAll('[data-tie]').forEach((el) => {
        const id = el.getAttribute('data-tie')!;
        const e = el as HTMLElement;
        pos[id] = { l: e.offsetLeft, t: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight };
      });

      const segs: LineSeg[] = [];
      bk.all.forEach((t) => {
        if (!t.parent || t.round === '3P') return;
        const c = pos[t.id], p = pos[t.parent];
        if (!c || !p) return;
        const y1 = c.t + c.h / 2;
        const y2 = p.t + p.h / 2;
        let x1: number, x2: number;
        if (t.side === 'L') { x1 = c.l + c.w; x2 = p.l; }
        else { x1 = c.l; x2 = p.l + p.w; }
        const mx = (x1 + x2) / 2;
        segs.push({ key: t.id, d: `M${x1} ${y1} H${mx} V${y2} H${x2}`, conn: `${t.id}>${t.parent}` });
      });
      setLines(segs);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [bk]);

  function Col({ col }: { col: BracketColumn }) {
    return (
      <div className={`bk-col${col.side === 'C' ? ' center' : ''}`}>
        {col.ties.map((t) => (
          <BTie key={t.id} t={t} path={path} active={active} />
        ))}
      </div>
    );
  }

  const RM = (k: string) => bk.roundMeta.find((m) => m.key === k)!;

  return (
    <div className="bk-stage">
      <div className="bk-heads">
        {['R32', 'R16', 'QF', 'SF'].map((k) => {
          const m = RM(k);
          return (
            <button key={`L-${k}`} className="bk-head" onClick={() => onFocusRound(k)} title={`Focus ${m.label}`}>
              <span className="rl">{m.label}</span>
              <span className="rn">{m.n} {m.n === 1 ? 'tie' : 'ties'}</span>
            </button>
          );
        })}
        {(() => { const m = RM('F'); return (
          <button key="F-C" className="bk-head center" onClick={() => onFocusRound('F')} title="Focus Final">
            <span className="rl">{m.label}</span>
            <span className="rn">{m.n} tie</span>
          </button>
        ); })()}
        {['SF', 'QF', 'R16', 'R32'].map((k) => {
          const m = RM(k);
          return (
            <button key={`R-${k}`} className="bk-head" onClick={() => onFocusRound(k)} title={`Focus ${m.label}`}>
              <span className="rl">{m.label}</span>
              <span className="rn">{m.n} {m.n === 1 ? 'tie' : 'ties'}</span>
            </button>
          );
        })}
      </div>

      <div className="bk-grid" ref={gridRef}>
        <svg
          className="bk-lines"
          width={dims.w}
          height={dims.h}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
        >
          {lines.map((s) => {
            const cls = path.conns.has(s.conn) ? 'on' : path.futureConns.has(s.conn) ? 'future' : active ? 'dim' : '';
            return <path key={s.key} d={s.d} className={cls} />;
          })}
        </svg>

        {bk.columnsL.map((c, i) => <Col key={`L${i}`} col={c} />)}

        <div className="bk-col center">
          <FinalCard path={path} />
          <ThirdCard />
        </div>

        {bk.columnsR.map((c, i) => <Col key={`R${i}`} col={c} />)}
      </div>
    </div>
  );
}

/* ---------- large tie card (by round) ---------- */
const ROUND_LABELS: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarterfinal',
  SF: 'Semifinal', F: 'Final', '3P': 'Third-Place Playoff',
};

// Hoisted out of BigTie so it isn't redefined on every render (react-hooks/static-components).
function BigTieRow({ t, s, isPost, isLive }: { t: Tie; s: 'a' | 'b'; isPost: boolean; isLive: boolean }) {
  const team = t[s];
  const win = isPost && t.winner === s;
  const lose = isPost && t.winner !== s;
  if (isTBD(team)) {
    return <div className="btl-row"><span className="btl-name tbd">{team.src}</span></div>;
  }
  return (
    <div className={`btl-row${lose ? ' lose' : ''}`}>
      <Flag logo={(team as TieTeam).flag} abbr={(team as TieTeam).code} size={30} />
      <span className="btl-name">
        {(team as TieTeam).code}
        <span className="full">{(team as TieTeam).name}</span>
      </span>
      {(isPost || isLive) && t.score && (
        <span className="btl-sc tnum" style={win ? { color: 'var(--ink)' } : undefined}>
          {t.score[s === 'a' ? 0 : 1]}
        </span>
      )}
    </div>
  );
}

function BigTie({ t }: { t: Tie }) {
  const isPost = t.state === 'post';
  const isLive = t.state === 'in';
  const meta = ROUND_LABELS[t.round];
  const isPens = t.clock?.includes('pens');
  const showTag = t.tag && (t.round === 'QF' || t.round === 'SF');

  return (
    <a className={`btie-lg${isLive ? ' is-live' : ''}`} href={`/match/${t.id}`}>
      <div className="btl-head">
        <span className="tag">{showTag ? `${t.tag} · ` : ''}{meta}</span>
        {isLive
          ? <span className="st live"><Pulse /> {t.clock}</span>
          : isPost
            ? <span className="st ft">{t.dateISO ? `${localDate(t.dateISO)} · ` : ''}{isPens ? t.clock!.toUpperCase() : 'FULL TIME'}</span>
            : <span className="st">{t.dateISO ? `${localDate(t.dateISO)} · ${localTime(t.dateISO)}` : short(t.when)}</span>
        }
      </div>
      <div className="btl-body"><BigTieRow t={t} s="a" isPost={isPost} isLive={isLive} /><BigTieRow t={t} s="b" isPost={isPost} isLive={isLive} /></div>
      <div className="btl-foot">
        <span className="venue">
          <PinIco />
          <span>{t.venue} · {t.city}</span>
        </span>
        <span className="tv">{t.tv}</span>
      </div>
    </a>
  );
}

function ByRound({ round, setRound }: { round: string; setRound: (k: string) => void }) {
  const bk = useBK();
  const meta = bk.roundMeta.find((m) => m.key === round) || bk.roundMeta[0];
  const ties = [...bk.byRound[round], ...(round === 'F' ? bk.byRound['3P'] : [])];
  const narrow = round === 'SF' || round === 'F';
  const liveCount = ties.filter((t) => t.state === 'in').length;
  const doneCount = ties.filter((t) => t.state === 'post').length;

  return (
    <>
      <div className="bround-tabs">
        {bk.roundMeta.map((m) => (
          <button
            key={m.key}
            className={`bround-tab${m.key === round ? ' on' : ''}`}
            onClick={() => setRound(m.key)}
          >
            {m.label} <span className="c tnum">{m.n}</span>
          </button>
        ))}
      </div>
      <div className="bround-head">
        <h2>{meta.label}</h2>
        <span className="meta">{liveCount} live · {doneCount} decided</span>
      </div>
      <div className={`bround-grid${narrow ? ' narrow' : ''}`}>
        {ties.map((t) => <BigTie key={t.id} t={t} />)}
      </div>
    </>
  );
}

/* ---------- main client component ---------- */
interface BracketClientProps {
  data: SerializableBracket;
}

export function BracketClient({ data: serialized }: BracketClientProps) {
  const { myTeam } = useMyTeam();
  const data = useMemo(
    () => hydrateClientBracket({ ...serialized, myTeam: myTeam ?? '' }),
    [serialized, myTeam],
  );
  const [view, setView] = useState<'Full' | 'Round'>(() => {
    if (typeof window === 'undefined') return 'Full';
    return (localStorage.getItem('wc-bracket-view') as 'Full' | 'Round') || 'Full';
  });
  const [round, setRound] = useState(() => {
    if (typeof window === 'undefined') return 'R32';
    return localStorage.getItem('wc-bracket-round') || 'R32';
  });
  const [trace, setTrace] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem('wc-bracket-view', view); } catch (_) {}
  }, [view]);
  useEffect(() => {
    try { localStorage.setItem('wc-bracket-round', round); } catch (_) {}
  }, [round]);

  const active = trace;
  const path = useMemo(() => data.pathForTeam(active), [data, active]);

  const focusRound = (k: string) => { setRound(k); setView('Round'); };

  return (
    <BracketCtx.Provider value={data}>
      <PageHero
        eyebrow="2026 FIFA World Cup"
        title="Knockout Bracket"
        sub={<>
          <span style={{ color: '#fff', fontWeight: 700 }}>32</span> teams
          <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>31</span> matches
          <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
          <span>{data.window}</span>
        </>}
      />

      <div className="bk-controls">
        <div className="seg" role="tablist" aria-label="Bracket view">
          <button
            role="tab"
            aria-selected={view === 'Full'}
            className={view === 'Full' ? 'on' : ''}
            onClick={() => setView('Full')}
          >
            Full bracket
          </button>
          <button
            role="tab"
            aria-selected={view === 'Round'}
            className={view === 'Round' ? 'on' : ''}
            onClick={() => setView('Round')}
          >
            By round
          </button>
        </div>

        {view === 'Full' && (
          <>
            <div className="bk-trace">
              <span>Trace</span>
              <select
                value={trace || ''}
                onChange={(e) => { setTrace(e.target.value || null); }}
              >
                <option value="">a team…</option>
                {data.alive.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {trace && (
                <button className="clear" onClick={() => setTrace(null)} aria-label="Clear">✕</button>
              )}
            </div>
          </>
        )}

        <div className="fspace" />
        <Link className="btn" href="/schedule?stage=ko">Knockout schedule →</Link>
      </div>

      {view === 'Full' ? (
        <>
          <FullBracket path={path} active={active} onFocusRound={focusRound} />
          <div className="bk-legend">
            <span className="k"><span className="sw" style={{ background: 'var(--live)' }} /> Advanced</span>
            <span className="k"><Pulse /> Live now</span>
            <span className="k"><span className="sw" style={{ background: 'var(--inset)', border: '1px dashed var(--line-2)' }} /> Awaiting teams</span>
            <span className="k"><span className="ln" /> Confirmed path</span>
            <span className="k"><span className="ln dash" /> Possible route</span>
            {myTeam && (
              <span className="k">
                <span className="bt-mine" style={{ position: 'static', width: 14, height: 14 }}><CheckIco /></span>
                {' '}Your team
              </span>
            )}
          </div>
          <div className="bk-view-note">
            <p style={{ color: 'var(--ink-2)', fontSize: 13, padding: '20px 4px', textAlign: 'center' }}>
              The full bracket is best viewed on a wider screen.{' '}
              <button
                style={{ border: 'none', background: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
                onClick={() => setView('Round')}
              >
                Switch to By round →
              </button>
            </p>
          </div>
        </>
      ) : (
        <ByRound round={round} setRound={setRound} />
      )}
    </BracketCtx.Provider>
  );
}
