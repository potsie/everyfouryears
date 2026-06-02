'use client';

import type { WorldCupMatchNormalized } from '@/lib/normalize/world-cup-normalizer';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  match: WorldCupMatchNormalized;
}

export function LiveStatsDrawer({ isOpen, onClose, match }: DrawerProps) {
  if (!isOpen) return null;

  const getBarWidth = (homeVal: string, awayVal: string): number => {
    const h = parseFloat(homeVal) || 0;
    const a = parseFloat(awayVal) || 0;
    if (h === 0 && a === 0) return 50;
    return (h / (h + a)) * 100;
  };

  const stats = [
    { label: 'Ball Possession', key: 'possession', isPct: true },
    { label: 'Total Shots', key: 'shots' },
    { label: 'Shots on Target', key: 'shotsOnTarget' },
    { label: 'Goalkeeper Saves', key: 'saves' },
    { label: 'Corners Won', key: 'corners' },
    { label: 'Fouls Committed', key: 'fouls' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(11,29,51,.4)', backdropFilter: 'blur(4px)' }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative flex flex-col h-full bg-white shadow-2xl"
        style={{
          width: '100%',
          maxWidth: 440,
          animation: 'slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 text-white"
          style={{ background: 'var(--navy)' }}
        >
          <div>
            <div
              className="text-[10px] uppercase tracking-widest font-bold mb-0.5"
              style={{ color: 'rgba(255,255,255,.6)' }}
            >
              Match Analytics
            </div>
            <div className="text-[14px] font-black">
              {match.home.abbr} vs {match.away.abbr}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-bold text-[13px] cursor-pointer"
            style={{ color: 'rgba(255,255,255,.8)', background: 'none', border: 'none' }}
          >
            ✕ Close
          </button>
        </div>

        {/* Goal scorers */}
        <div
          className="text-[12px]"
          style={{ background: '#0b1d33', color: '#e2e8f1' }}
        >
          {[match.home, match.away].map(team => (
            <div key={team.id} className="px-6 py-2">
              <span className="font-bold mr-2" style={{ color: '#f59e0b' }}>{team.abbr}:</span>
              {team.goals.length > 0
                ? team.goals.map(g => `${g.scorer} (${g.minute})`).join(', ')
                : '—'}
            </div>
          ))}
        </div>

        {/* Stats bars */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          <h3
            className="text-[11px] font-black uppercase tracking-widest"
            style={{ color: 'var(--ink-3)' }}
          >
            Team Match Statistics
          </h3>

          {stats.map(stat => {
            const homeVal = match.home.stats[stat.key] || '0';
            const awayVal = match.away.stats[stat.key] || '0';
            const barWidth = getBarWidth(homeVal, awayVal);

            return (
              <div key={stat.key} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[12px] font-bold" style={{ color: 'var(--ink-2)' }}>
                  <span className="w-12 font-black" style={{ color: 'var(--ink)' }}>
                    {homeVal}{stat.isPct ? '%' : ''}
                  </span>
                  <span
                    className="text-center text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--ink-3)' }}
                  >
                    {stat.label}
                  </span>
                  <span className="w-12 text-right font-black" style={{ color: 'var(--ink)' }}>
                    {awayVal}{stat.isPct ? '%' : ''}
                  </span>
                </div>
                <div
                  className="w-full flex overflow-hidden"
                  style={{ height: 10, borderRadius: 99, background: 'var(--inset)' }}
                >
                  <div
                    style={{
                      width: `${barWidth}%`,
                      background: 'var(--navy)',
                      transition: 'width 500ms',
                      borderRight: '2px solid white',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      background: '#3b82f6',
                      transition: 'width 500ms',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
