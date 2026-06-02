'use client';

import { useRef, useEffect } from 'react';

export interface TournamentDay {
  dateString: string; // YYYYMMDD format for API queries
  displayDate: string; // e.g., "Jun 11"
  displayDay: string;  // e.g., "Thu"
  matchdayIndex: number; // e.g., 1, 2, 3[cite: 8]
  isLive?: boolean;    // True if games are currently active on this day
}

interface SwiperProps {
  days: TournamentDay[];
  selectedDate: string;
  onDateSelect: (dateString: string) => void;
}

export function ScheduleSwiper({ days, selectedDate, onDateSelect }: SwiperProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected item into view if it shifts off-screen
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeItem = container.querySelector('[data-active="true"]');
    if (activeItem) {
      const containerWidth = container.offsetWidth;
      const itemOffset = (activeItem as HTMLElement).offsetLeft;
      const itemWidth = (activeItem as HTMLElement).offsetWidth;

      // Center the active date pill in the swiper window
      container.scrollTo({
        left: itemOffset - containerWidth / 2 + itemWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [selectedDate]);

  return (
    <div className="w-full bg-white border-y border-slate-100 py-3 shadow-sm relative">
      {/* 
        Scroll Container: 
        Uses native web scroll-snap for touch-swipe momentum mechanics 
      */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto px-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {days.map((day) => {
          const isSelected = day.dateString === selectedDate;

          return (
            <button
              key={day.dateString}
              onClick={() => onDateSelect(day.dateString)}
              data-active={isSelected}
              className={`flex-shrink-0 w-20 py-2 rounded-xl flex flex-col items-center justify-center border transition-all duration-200 snap-center relative ${
                isSelected
                  ? 'bg-[#0a2540] border-[#0a2540] text-white shadow-md shadow-slate-900/10 scale-105'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {/* Live Ticker Indicator Dot[cite: 7] */}
              {day.isLive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              )}

              {/* Day Name (e.g. THU) */}
              <span className={`text-[10px] uppercase font-bold tracking-wider ${
                isSelected ? 'text-slate-300' : 'text-slate-400'
              }`}>
                {day.displayDay}
              </span>

              {/* Day Date (e.g. Jun 11) */}
              <span className="text-sm font-black tracking-tight leading-tight my-0.5">
                {day.displayDate}
              </span>

              {/* Matchday Index Label[cite: 8] */}
              <span className={`text-[9px] font-medium tracking-tight ${
                isSelected ? 'text-purple-300' : 'text-slate-400'
              }`}>
                M-Day {day.matchdayIndex}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}