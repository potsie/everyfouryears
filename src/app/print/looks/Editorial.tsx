import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';
import {
  STAGE_LABELS,
  STAGE_SUBLABELS,
  isSeedPlaceholder,
  fmtTime,
  fmtDayOfWeek,
  fmtDayNum,
  fmtMonthShort,
  groupByLocalDate,
  groupByStage,
  fmtScore,
} from './shared';
import { VENUES } from '@/lib/venues';

interface Props { matches: WorldCupMatchNormalized[]; }

// Split an array into n roughly-equal explicit chunks (reliable in print, unlike column-count)
function chunk<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  return Array.from({ length: n }, (_, i) => arr.slice(i * size, (i + 1) * size));
}

function Flag({ logo, abbr }: { logo: string; abbr: string }) {
  if (!logo) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="ed-flag" src={logo} alt={abbr} />;
}

function MatchRow({ m, ko }: { m: WorldCupMatchNormalized; ko: boolean }) {
  const homeIsSeed = isSeedPlaceholder(m.home.abbr);
  const awayIsSeed = isSeedPlaceholder(m.away.abbr);
  const score = fmtScore(m);

  return (
    <div className="ed-match">
      <div className="ed-time">{fmtTime(m.date)}</div>
      <div>
        <div className="ed-teams">
          {!homeIsSeed && <Flag logo={m.home.logo} abbr={m.home.abbr} />}
          <span>{m.home.abbr}</span>
          <span className="v">v</span>
          <span>{m.away.abbr}</span>
          {!awayIsSeed && <Flag logo={m.away.logo} abbr={m.away.abbr} />}
        </div>
        <div className="ed-match-meta">
          {ko
            ? <span className="ed-badge">{m.stage.replace('Round of ', 'R').replace('Quarterfinals', 'QF').replace('Semifinals', 'SF').replace('Third Place', '3rd').replace('Final', 'FIN')}</span>
            : <span className="ed-badge">{m.groupLetter ? `GRP ${m.groupLetter}` : m.stage}</span>
          }
          <span>{m.venueCity}</span>
          {score && <span className="ed-score">● {score}</span>}
        </div>
      </div>
    </div>
  );
}

interface DayBlockProps {
  dateKey: string;
  dayMatches: WorldCupMatchNormalized[];
  ko: boolean;
}

function DayBlock({ dateKey, dayMatches, ko }: DayBlockProps) {
  const iso = dayMatches[0].date;
  return (
    <div key={dateKey} className="ed-day">
      <div className="ed-day-hd">
        <span className="ed-dow">{fmtDayOfWeek(iso)}</span>
        <span className="ed-dnum">{fmtDayNum(iso)}</span>
        <span className="ed-dmon">{fmtMonthShort(iso)}</span>
      </div>
      {dayMatches.map(m => (
        <MatchRow key={m.eventId} m={m} ko={ko} />
      ))}
    </div>
  );
}

export function Editorial({ matches }: Props) {
  const byStage = groupByStage(matches);

  return (
    <div className="print-editorial">
      <div className="ed-page">
        <header className="ed-mast">
          <div className="ed-kicker">FIFA World Cup · United 2026</div>
          <h1 className="ed-title">The 2026<br />World Cup <em>Schedule</em></h1>
          <div className="ed-mast-row">
            <div className="ed-hosts">Canada <span>·</span> Mexico <span>·</span> United States</div>
            <div className="ed-meta">
              <b>48 teams · 104 matches · 16 cities</b><br />
              Jun 11 – Jul 19, 2026
            </div>
          </div>
        </header>

        {[...byStage.entries()].map(([stageId, stageMatches]) => {
          const ko = stageId > 1;
          const dayEntries = [...groupByLocalDate(stageMatches).entries()];
          const cols = chunk(dayEntries, 3);
          return (
            <section key={stageId} className={`ed-stage${ko ? ' ko' : ''}`}>
              <div className="ed-stage-hd">
                <span className="ed-stage-dot" />
                <h2 className="ed-stage-title">{STAGE_LABELS[stageId]}</h2>
                <span className="ed-stage-sub">{STAGE_SUBLABELS[stageId]}</span>
              </div>
              <div className="ed-days">
                {cols.map((colDays, ci) => (
                  <div key={ci} className="ed-col">
                    {colDays.map(([dateKey, dayMatches]) => (
                      <DayBlock key={dateKey} dateKey={dateKey} dayMatches={dayMatches} ko={ko} />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="ed-venues">
          <h2>16 Host Cities</h2>
          <div className="ed-vgrid">
            {VENUES.map((v, i) => (
              <div key={v.slug} className="ed-venue">
                <span className="ed-vnum">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="ed-vcity">{v.city}</div>
                  <div className="ed-vstadium">{v.name}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="ed-foot">
          <span>2026 FIFA WORLD CUP · UNITED</span>
          <span>TIMES IN YOUR LOCAL TIMEZONE</span>
        </div>
      </div>
    </div>
  );
}
