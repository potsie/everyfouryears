'use client';

import { useState } from 'react';

interface FlagProps {
  logo?: string;
  abbr: string;
  size?: number;
  className?: string;
}

export function Flag({ logo, abbr, size = 24, className = '' }: FlagProps) {
  const [failed, setFailed] = useState(false);

  if (!logo || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-[5px] font-display font-bold flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: Math.round(size * 0.75),
          fontSize: Math.round(size * 0.28),
          color: 'var(--navy)',
          background: 'linear-gradient(135deg,#eef2f8,#dfe6f1)',
          letterSpacing: '0.01em',
        }}
      >
        {abbr.slice(0, 3)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={abbr}
      width={size}
      height={Math.round(size * 0.75)}
      className={`rounded-[5px] object-cover flex-shrink-0 ${className}`}
      style={{ boxShadow: 'inset 0 0 0 1px rgba(11,29,51,.08)' }}
      onError={() => setFailed(true)}
    />
  );
}
