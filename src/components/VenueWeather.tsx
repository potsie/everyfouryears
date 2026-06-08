'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WeatherData } from '@/lib/weather';

// WMO weather code → label + symbol
function weatherInfo(code: number): { label: string; symbol: string } {
  if (code === 0)  return { label: 'Clear',          symbol: '☀' };
  if (code <= 2)   return { label: 'Partly cloudy',  symbol: '⛅' };
  if (code === 3)  return { label: 'Overcast',       symbol: '☁' };
  if (code <= 48)  return { label: 'Fog',            symbol: '🌫' };
  if (code <= 57)  return { label: 'Drizzle',        symbol: '🌦' };
  if (code <= 67)  return { label: 'Rain',           symbol: '🌧' };
  if (code <= 77)  return { label: 'Snow',           symbol: '❄' };
  if (code <= 82)  return { label: 'Showers',        symbol: '🌦' };
  if (code <= 86)  return { label: 'Snow showers',   symbol: '🌨' };
  return           { label: 'Thunderstorm',          symbol: '⛈' };
}

function toF(c: number) { return Math.round(c * 9 / 5 + 32); }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return { day: DAYS[dt.getUTCDay()], date: `${MONTHS[dt.getUTCMonth()]} ${d}` };
}

interface Props {
  data: WeatherData;
  roofType: 'open' | 'retractable' | 'fixed';
}

export function VenueWeather({ data, roofType }: Props) {
  const [unit, setUnit] = useState<'F' | 'C'>('F');
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wc-temp-unit') as 'F' | 'C';
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
      setPopupStyle({
        position: 'fixed',
        top: r.bottom + 8,
        right: Math.max(8, window.innerWidth - r.right),
      });
    }
    setOpen(true);
  }, []);

  const closePopup = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, [open]);

  const { label, symbol } = weatherInfo(data.current.code);
  const tempDisplay = unit === 'F' ? toF(data.current.tempC) : data.current.tempC;

  return (
    <>
      <div className="wx-chip">
        <span className="wx-symbol">{symbol}</span>

        <span className="wx-temp tnum">{tempDisplay}°</span>

        <span className="wx-cond">{label}</span>

        {roofType !== 'open' && (
          <span className="wx-roof-note">Roof can close</span>
        )}

        <span className="wx-divider" />

        <span className="wx-toggle">
          <button
            className={`wx-unit${unit === 'F' ? ' on' : ''}`}
            onClick={() => toggleUnit('F')}
          >F°</button>
          <button
            className={`wx-unit${unit === 'C' ? ' on' : ''}`}
            onClick={() => toggleUnit('C')}
          >C°</button>
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
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={closePopup}
          />
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
            <div className="wx-days">
              {data.forecast.map(day => {
                const { label: dl, symbol: ds } = weatherInfo(day.code);
                const hi = unit === 'F' ? toF(day.maxC) : day.maxC;
                const lo = unit === 'F' ? toF(day.minC) : day.minC;
                const { day: dayName, date: dateStr } = dayLabel(day.date);
                return (
                  <div key={day.date} className="wx-day">
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
                  </div>
                );
              })}
            </div>
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
