import Link from 'next/link';
import { Flag } from '@/components/Flag';
import type { PlayerWorldCupLog, PlayerLogRow } from '@/lib/stats-live';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Totals({ log }: { log: PlayerWorldCupLog }) {
  const t = log.totals;
  const cells = log.isGK
    ? [
        { k: 'Apps', v: t.apps, sub: t.subs ? `${t.starts} st · ${t.subs} sub` : `${t.starts} start${t.starts === 1 ? '' : 's'}` },
        { k: 'Clean sheets', v: t.cleanSheets },
        { k: 'Saves', v: t.saves },
        { k: 'Goals against', v: t.conceded },
      ]
    : [
        { k: 'Apps', v: t.apps, sub: t.subs ? `${t.starts} st · ${t.subs} sub` : `${t.starts} start${t.starts === 1 ? '' : 's'}` },
        { k: 'Goals', v: t.goals },
        { k: 'Assists', v: t.assists },
        { k: 'Shots', v: t.shots, sub: `${t.sog} on target` },
      ];
  return (
    <div className="wc-tot">
      {cells.map(c => (
        <div className="wc-tot-cell" key={c.k}>
          <div className="v tnum">{c.v}</div>
          <div className="k">{c.k}</div>
          {c.sub && <div className="s">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function ResultPill({ r, ts, os }: { r: PlayerLogRow['result']; ts: number; os: number }) {
  return (
    <span className={`wc-res ${r.toLowerCase()}`}>
      <b>{r}</b> <span className="tnum">{ts}–{os}</span>
    </span>
  );
}

function OutfieldRows({ rows }: { rows: PlayerLogRow[] }) {
  return (
    <>
      <div className="wc-log-row head">
        <span>Date</span><span>Opp</span><span>Result</span>
        <span title="Goals">G</span><span title="Assists">A</span>
        <span title="Shots">Sh</span><span title="Shots on target">SoT</span>
        <span title="Fouls committed">FC</span><span title="Fouls suffered">FA</span>
        <span title="Offsides">Off</span>
        <span title="Yellow cards">Y</span><span title="Red cards">R</span>
      </div>
      {rows.map(r => (
        <Link className="wc-log-row" key={r.eventId} href={`/match/${r.eventId}`}>
          <span className="wc-date">{fmtDate(r.date)}{!r.started && <i className="wc-sub" title="Substitute">s</i>}</span>
          <span className="wc-opp">
            <span className="wc-ha">{r.home ? 'v' : '@'}</span>
            <Flag logo={r.oppLogo} abbr={r.oppAbbr} size={15} />
            {r.oppAbbr}
          </span>
          <ResultPill r={r.result} ts={r.teamScore} os={r.oppScore} />
          <span className="tnum strong">{r.goals || '·'}</span>
          <span className="tnum">{r.assists || '·'}</span>
          <span className="tnum">{r.shots || '·'}</span>
          <span className="tnum">{r.sog || '·'}</span>
          <span className="tnum">{r.fouls || '·'}</span>
          <span className="tnum">{r.fouled || '·'}</span>
          <span className="tnum">{r.offsides || '·'}</span>
          <span className="tnum">{r.yellow ? <i className="wc-card y" /> : '·'}</span>
          <span className="tnum">{r.red ? <i className="wc-card r" /> : '·'}</span>
        </Link>
      ))}
    </>
  );
}

function KeeperRows({ rows }: { rows: PlayerLogRow[] }) {
  return (
    <>
      <div className="wc-log-row gk head">
        <span>Date</span><span>Opp</span><span>Result</span>
        <span title="Saves">SV</span><span title="Goals against">GA</span>
        <span title="Clean sheet">CS</span><span title="Shots faced">SF</span>
        <span title="Yellow cards">Y</span><span title="Red cards">R</span>
      </div>
      {rows.map(r => (
        <Link className="wc-log-row gk" key={r.eventId} href={`/match/${r.eventId}`}>
          <span className="wc-date">{fmtDate(r.date)}{!r.started && <i className="wc-sub" title="Substitute">s</i>}</span>
          <span className="wc-opp">
            <span className="wc-ha">{r.home ? 'v' : '@'}</span>
            <Flag logo={r.oppLogo} abbr={r.oppAbbr} size={15} />
            {r.oppAbbr}
          </span>
          <ResultPill r={r.result} ts={r.teamScore} os={r.oppScore} />
          <span className="tnum strong">{r.saves || '·'}</span>
          <span className="tnum">{r.conceded || '·'}</span>
          <span className="tnum">{r.cleanSheet ? '✓' : '·'}</span>
          <span className="tnum">{r.shotsFaced || '·'}</span>
          <span className="tnum">{r.yellow ? <i className="wc-card y" /> : '·'}</span>
          <span className="tnum">{r.red ? <i className="wc-card r" /> : '·'}</span>
        </Link>
      ))}
    </>
  );
}

export function PlayerWorldCup({ log }: { log: PlayerWorldCupLog }) {
  return (
    <div className="t-card">
      <div className="t-card-head"><h3>At the 2026 World Cup</h3></div>
      {log.rows.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          Hasn&apos;t featured yet — stats update after each match.
        </div>
      ) : (
        <>
          <Totals log={log} />
          <div className="wc-log-scroll">
            <div className={`wc-log${log.isGK ? ' gk' : ''}`}>
              {log.isGK ? <KeeperRows rows={log.rows} /> : <OutfieldRows rows={log.rows} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
