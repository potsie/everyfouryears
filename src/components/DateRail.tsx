'use client';

import { useRef, useEffect } from 'react';

export interface DateRailDay {
  yyyymmdd: string;
  dow: string;
  day: number;
  matchCount: number;
  phase: 'group' | 'ko';
}

interface DateRailProps {
  days: DateRailDay[];
  selectedDate: string;
  onDateSelect: (yyyymmdd: string) => void;
}

export function DateRail({ days, selectedDate, onDateSelect }: DateRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const active = rail.querySelector('[data-active="true"]') as HTMLElement | null;
    if (!active) return;
    const left = active.offsetLeft - rail.offsetWidth / 2 + active.offsetWidth / 2;
    rail.scrollTo({ left, behavior: 'smooth' });
  }, [selectedDate]);

  const scroll = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  return (
    <div className="flex items-center gap-2" style={{ margin: '0 0 22px' }}>
      {/* Left chevron */}
      <button
        onClick={() => scroll(-1)}
        className="flex items-center justify-center flex-shrink-0 cursor-pointer"
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          border: '1px solid var(--line-2)',
          background: 'var(--surface)',
          color: 'var(--ink-2)',
        }}
        aria-label="Scroll left"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {/* Scrollable rail */}
      <div
        ref={railRef}
        className="flex gap-[7px] flex-1 scrollbar-none"
        style={{ overflowX: 'auto', scrollBehavior: 'smooth', padding: '3px 1px' }}
      >
        {days.map(day => {
          const isActive = day.yyyymmdd === selectedDate;
          const isKo = day.phase === 'ko';

          return (
            <button
              key={day.yyyymmdd}
              data-active={isActive}
              onClick={() => onDateSelect(day.yyyymmdd)}
              className="flex-shrink-0 flex flex-col items-center cursor-pointer transition-all"
              style={{
                minWidth: 58,
                padding: '8px 13px',
                borderRadius: 'var(--r-sm)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                background: isActive ? 'var(--accent)' : 'var(--surface)',
                color: isActive ? 'var(--accent-ink)' : 'var(--ink)',
                textAlign: 'center',
              }}
            >
              <span
                className="text-[10px] font-bold tracking-[.08em] uppercase"
                style={{ color: isActive ? 'rgba(255,255,255,.72)' : 'var(--ink-3)' }}
              >
                {day.dow}
              </span>
              <span
                className="font-display font-bold text-[18px] leading-[1.1] mt-[1px]"
                style={{
                  color: isActive
                    ? '#fff'
                    : isKo
                    ? 'var(--danger)'
                    : 'var(--ink)',
                }}
              >
                {day.day}
              </span>
              <span
                className="text-[10px] font-semibold mt-[2px]"
                style={{ color: isActive ? 'rgba(255,255,255,.72)' : 'var(--ink-3)' }}
              >
                {day.matchCount}m
              </span>
            </button>
          );
        })}
      </div>

      {/* Right chevron */}
      <button
        onClick={() => scroll(1)}
        className="flex items-center justify-center flex-shrink-0 cursor-pointer"
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          border: '1px solid var(--line-2)',
          background: 'var(--surface)',
          color: 'var(--ink-2)',
        }}
        aria-label="Scroll right"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
