'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WeatherData } from '@/lib/weather';

// ── WMO weather code helpers ──────────────────────────────────────────────────

function weatherInfo(code: number): { label: string; symbol: string } {
  if (code === 0)  return { label: 'Clear',         symbol: '☀' };
  if (code <= 2)   return { label: 'Partly cloudy', symbol: '⛅' };
  if (code === 3)  return { label: 'Overcast',      symbol: '☁' };
  if (code <= 48)  return { label: 'Fog',           symbol: '🌫' };
  if (code <= 57)  return { label: 'Drizzle',       symbol: '🌦' };
  if (code <= 67)  return { label: 'Rain',          symbol: '🌧' };
  if (code <= 77)  return { label: 'Snow',          symbol: '❄' };
  if (code <= 82)  return { label: 'Showers',       symbol: '🌦' };
  if (code <= 86)  return { label: 'Snow showers',  symbol: '🌨' };
  return           { label: 'Thunderstorm',         symbol: '⛈' };
}

// ── Unit helpers ──────────────────────────────────────────────────────────────

function toF(c: number) { return Math.round(c * 9 / 5 + 32); }
function disp(c: number, unit: 'F' | 'C') { return unit === 'F' ? toF(c) : c; }
function windDisp(kph: number, unit: 'F' | 'C') {
  return unit === 'F'
    ? { speed: Math.round(kph * 0.621371), label: 'mph' }
    : { speed: kph, label: 'km/h' };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return { day: DAYS[dt.getUTCDay()], date: `${MONTHS[dt.getUTCMonth()]} ${d}` };
}

function fullDayLabel(dateStr: string) {
  const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${FULL_DAYS[dt.getUTCDay()]}, ${FULL_MONTHS[dt.getUTCMonth()]} ${d}`;
}

// ── Wind direction ────────────────────────────────────────────────────────────

function windDirLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ── Hourly processing ─────────────────────────────────────────────────────────

interface Period {
  label: string;
  hours: string;
  tempC: number;
  code: number;
  windKph: number;
  windDirStr: string;
  precipPct: number;
  humidity: number;
}

const TIME_PERIODS = [
  { label: 'Overnight', hours: '12–6 AM',  startH: 0,  endH: 6  },
  { label: 'Morning',   hours: '6 AM–12 PM', startH: 6,  endH: 12 },
  { label: 'Afternoon', hours: '12–6 PM',  startH: 12, endH: 18 },
  { label: 'Evening',   hours: '6–11 PM',  startH: 18, endH: 24 },
];

function avg(nums: number[]) {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function worstCode(codes: number[]): number {
  const severity = (c: number) => {
    if (c >= 95) return 6;
    if (c >= 80) return 5;
    if (c >= 61) return 4;
    if (c >= 51) return 3;
    if (c >= 45) return 2;
    if (c >= 1)  return 1;
    return 0;
  };
  return codes.reduce((a, b) => severity(b) > severity(a) ? b : a);
}

function processHourly(raw: {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  relative_humidity_2m: number[];
}): Period[] {
  return TIME_PERIODS.map(({ label, hours, startH, endH }) => {
    // Parse hour from ISO string directly to avoid timezone issues
    // Open-Meteo returns local time when timezone=auto, e.g. "2026-06-10T14:00"
    const idx = raw.time
      .map((t, i) => {
        const h = parseInt(t.slice(11, 13), 10);
        return h >= startH && h < endH ? i : -1;
      })
      .filter(i => i >= 0);

    if (idx.length === 0) return null;

    return {
      label,
      hours,
      tempC:      avg(idx.map(i => Math.round(raw.temperature_2m[i]))),
      code:       worstCode(idx.map(i => raw.weather_code[i])),
      windKph:    avg(idx.map(i => Math.round(raw.wind_speed_10m[i]))),
      windDirStr: windDirLabel(avg(idx.map(i => raw.wind_direction_10m[i]))),
      precipPct:  Math.max(...idx.map(i => raw.precipitation_probability[i] ?? 0)),
      humidity:   avg(idx.map(i => Math.round(raw.relative_humidity_2m[i]))),
    };
  }).filter(Boolean) as Period[];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  data: WeatherData;
  roofType: 'open' | 'retractable' | 'fixed';
  lat: number;
  lng: number;
}

export function VenueWeather({ data, roofType, lat, lng }: Props) {
  const [unit, setUnit]             = useState<'F' | 'C'>('F');
  const [open, setOpen]               = useState(false);
  const [popupStyle, setPopupStyle]   = useState<React.CSSProperties>({});
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loadingDay, setLoadingDay]   = useState<string | null>(null);
  const [hourlyCache, setHourlyCache] = useState<Map<string, Period[]>>(new Map());
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Restore the saved temperature unit after mount (localStorage is client-only).
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wc-temp-unit') as 'F' | 'C';
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only hydration read
      if (saved === 'F' || saved === 'C') setUnit(saved);
    } catch {}
  }, []);

  const toggleUnit = (u: 'F' | 'C') => {
    setUnit(u);
    try { localStorage.setItem('wc-temp-unit', u); } catch {}
  };

  const openPopup = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      setPopupStyle(isMobile ? {
        position: 'fixed',
        top: r.bottom + 8,
        left: 8,
        right: 8,
        maxHeight: `calc(100dvh - ${r.bottom + 24}px)`,
      } : {
        position: 'fixed',
        top: r.bottom + 8,
        right: Math.max(8, window.innerWidth - r.right),
        maxHeight: `calc(100dvh - ${r.bottom + 24}px)`,
      });
    }
    setOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setOpen(false);
    setExpandedDay(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = () => { setOpen(false); setExpandedDay(null); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [open]);

  const handleDayClick = useCallback(async (date: string) => {
    // Toggle collapse
    if (expandedDay === date) {
      setExpandedDay(null);
      return;
    }

    // Already cached
    if (hourlyCache.has(date)) {
      setExpandedDay(date);
      return;
    }

    // Fetch hourly for this date
    setLoadingDay(date);
    setExpandedDay(date);
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lng}` +
        `&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,wind_direction_10m,relative_humidity_2m` +
        `&timezone=auto` +
        `&start_date=${date}&end_date=${date}`;
      const res = await fetch(url);
      const json = await res.json();
      const periods = processHourly(json.hourly);
      setHourlyCache(prev => new Map(prev).set(date, periods));
    } catch {
      // leave expanded with no data — UI handles gracefully
    } finally {
      setLoadingDay(null);
    }
  }, [expandedDay, hourlyCache, lat, lng]);

  const { label, symbol } = weatherInfo(data.current.code);
  const tempDisplay = disp(data.current.tempC, unit);

  return (
    <>
      <div className="wx-chip">
        <span className="wx-symbol">{symbol}</span>
        <span className="wx-temp tnum">{tempDisplay}°</span>
        <span className="wx-cond">{label}</span>
        {roofType !== 'open' && (
          <span className="wx-roof-note">Roof can close</span>
        )}
        <span className="wx-divider" aria-hidden="true" />
        <span className="wx-toggle">
          <button className={`wx-unit${unit === 'F' ? ' on' : ''}`} onClick={() => toggleUnit('F')}>F°</button>
          <button className={`wx-unit${unit === 'C' ? ' on' : ''}`} onClick={() => toggleUnit('C')}>C°</button>
        </span>
        <button ref={triggerRef} className="wx-forecast-btn" onClick={openPopup}>
          5-day
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={closePopup} />
          <div className="wx-popup" style={popupStyle}>

            <div className="wx-popup-head">
              <span>5-day forecast</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="wx-toggle" style={{ display: 'inline-flex' }}>
                  <button className={`wx-unit dark${unit === 'F' ? ' on' : ''}`} onClick={() => toggleUnit('F')}>F°</button>
                  <button className={`wx-unit dark${unit === 'C' ? ' on' : ''}`} onClick={() => toggleUnit('C')}>C°</button>
                </span>
                <button className="wx-close" onClick={closePopup}>✕</button>
              </div>
            </div>

            {/* Day cards */}
            <div className="wx-days">
              {data.forecast.map(day => {
                const { label: dl, symbol: ds } = weatherInfo(day.code);
                const hi = disp(day.maxC, unit);
                const lo = disp(day.minC, unit);
                const { day: dayName, date: dateStr } = dayLabel(day.date);
                const isExpanded = expandedDay === day.date;
                return (
                  <button
                    key={day.date}
                    className={`wx-day${isExpanded ? ' expanded' : ''}`}
                    onClick={() => handleDayClick(day.date)}
                    aria-expanded={isExpanded}
                  >
                    <div className="wx-day-name">{dayName}</div>
                    <div className="wx-day-date">{dateStr}</div>
                    <div className="wx-day-symbol">{ds}</div>
                    <div className="wx-day-cond">{dl}</div>
                    <div className="wx-day-temps">
                      <span className="wx-hi tnum">{hi}°</span>
                      <span className="wx-lo tnum">{lo}°</span>
                    </div>
                    {day.precipPct > 0 && (
                      <div className="wx-precip">💧 {day.precipPct}%</div>
                    )}
                    <div className="wx-day-tap">
                      {isExpanded
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      }
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hourly detail panel */}
            {expandedDay && (
              <div className="wx-detail">
                <div className="wx-detail-head">
                  {fullDayLabel(expandedDay)} — Hourly breakdown
                </div>
                {loadingDay === expandedDay ? (
                  <div className="wx-detail-loading">Fetching forecast…</div>
                ) : (hourlyCache.get(expandedDay) ?? []).length === 0 ? (
                  <div className="wx-detail-loading">No data available.</div>
                ) : (
                  <div className="wx-periods">
                    {(hourlyCache.get(expandedDay) ?? []).map(p => {
                      const { label: pl, symbol: ps } = weatherInfo(p.code);
                      const temp = disp(p.tempC, unit);
                      return (
                        <div key={p.label} className="wx-period">
                          <div className="wx-period-left">
                            <span className="wx-period-name">{p.label}</span>
                            <span className="wx-period-hours">{p.hours}</span>
                          </div>
                          <div className="wx-period-symbol">{ps}</div>
                          <div className="wx-period-center">
                            <span className="wx-period-temp tnum">{temp}°</span>
                            <span className="wx-period-cond">{pl}</span>
                          </div>
                          <div className="wx-period-right">
                            <span className="wx-period-wind">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .6 }}>
                                <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                                <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                                <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
                              </svg>
                              {(() => { const w = windDisp(p.windKph, unit); return `${w.speed} ${w.label} ${p.windDirStr}`; })()}
                            </span>
                            <span className="wx-period-humidity">
                              💧 {p.humidity}% humidity
                            </span>
                            {p.precipPct > 0 && (
                              <span className="wx-period-precip">
                                🌧 {p.precipPct}% rain
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {roofType !== 'open' && (
              <div className="wx-popup-note">
                This venue has a {roofType} roof — weather may not affect play.
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
