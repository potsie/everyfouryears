import Link from 'next/link';
import { Flag } from '@/components/Flag';
import type { PlayerWorldCupLog, PlayerLogRow } from '@/lib/stats-live';
import type { PmsrMatchRow, PlayerPmsrSummary } from '@/lib/pmsr';

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

function PhysicalRows({ rows }: { rows: PmsrMatchRow[] }) {
  return (
    <>
      <div className="wc-log-row head">
        <span>Date</span>
        <span>Opp</span>
        <span style={{ textAlign: 'center' }}>Dist</span>
        <span style={{ textAlign: 'center' }}>Sprints</span>
        <span style={{ textAlign: 'center' }}>Speed</span>
      </div>
      {rows.map(r => (
        <Link className="wc-log-row" key={r.eventId} href={`/match/${r.eventId}`}>
          <span className="wc-date">{r.date ? fmtDate(r.date) : '—'}</span>
          <span className="wc-opp">
            <Flag
              logo={`https://a.espncdn.com/i/teamlogos/countries/500/${r.oppAbbr.toLowerCase()}.png`}
              abbr={r.oppAbbr}
              size={15}
            />
            {r.oppAbbr}
          </span>
          <span className="tnum" style={{ textAlign: 'center' }}>
            {(r.total_distance_m / 1000).toFixed(1)}
            <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 2 }}>km</span>
          </span>
          <span className="tnum" style={{ textAlign: 'center' }}>{r.sprints}</span>
          <span className="tnum" style={{ textAlign: 'center' }}>
            {r.top_speed_kmh.toFixed(1)}
            <span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 2 }}>km/h</span>
          </span>
        </Link>
      ))}
    </>
  );
}

function PlayerPhysical({ pmsr }: { pmsr: PlayerPmsrSummary }) {
  const { totals, matches } = pmsr;
  return (
    <div className="t-card" style={{ marginTop: 18 }}>
      <div className="t-card-head"><h3>Running &amp; physical</h3></div>
      <div className="wc-tot">
        <div className="wc-tot-cell">
          <div className="v tnum">{totals.topSpeedKmh.toFixed(1)}</div>
          <div className="k">Top speed</div>
          <div className="s">km/h · best</div>
        </div>
        <div className="wc-tot-cell">
          <div className="v tnum">{(totals.totalDistanceM / 1000).toFixed(1)}</div>
          <div className="k">Distance</div>
          <div className="s">km · total</div>
        </div>
        <div className="wc-tot-cell">
          <div className="v tnum">{totals.sprints}</div>
          <div className="k">Sprints</div>
          <div className="s">total</div>
        </div>
      </div>
      {matches.length > 1 && (
        <div className="wc-log-scroll">
          <div className="wc-log phys">
            <PhysicalRows rows={matches} />
          </div>
        </div>
      )}
    </div>
  );
}

export function PlayerWorldCup({ log, pmsr }: { log: PlayerWorldCupLog; pmsr?: PlayerPmsrSummary | null }) {
  return (
    <>
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
      {pmsr && <PlayerPhysical pmsr={pmsr} />}
    </>
  );
}
