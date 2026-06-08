import type { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  titleRight?: ReactNode;
  sub?: ReactNode;
}

export function PageHero({ eyebrow, title, titleRight, sub }: PageHeroProps) {
  return (
    <div
      className="relative overflow-hidden text-white"
      style={{
        background: 'var(--navy)',
        borderRadius: 'var(--r-lg)',
        margin: '20px 0 26px',
        boxShadow: 'var(--sh-2)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(1200px 400px at 85% -10%, rgba(255,255,255,.10), transparent 60%),
            radial-gradient(800px 500px at 0% 120%, rgba(22,163,74,.16), transparent 55%)
          `,
        }}
      />
      <div className="relative" style={{ padding: '26px 28px' }}>
        {eyebrow && (
          <div
            className="font-bold text-[11px] tracking-[.14em] uppercase mb-2"
            style={{ color: 'rgba(255,255,255,.55)' }}
          >
            {eyebrow}
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <h1
            className="font-display font-extrabold text-white m-0"
            style={{ fontSize: 28, letterSpacing: '-.015em', lineHeight: 1.05 }}
          >
            {title}
          </h1>
          {titleRight && <div className="shrink-0">{titleRight}</div>}
        </div>
        {sub && (
          <div
            className="mt-2 text-[14px] font-medium flex items-center gap-[9px] flex-wrap"
            style={{ color: 'rgba(255,255,255,.70)' }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
