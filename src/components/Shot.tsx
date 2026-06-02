'use client';

interface ShotProps {
  size: number;       // diameter in px: 50 (roster card), 58 (key player), 88 (player hero)
  num?: number;       // jersey number — shown in bottom-right badge
  name: string;       // player full name — used for initials fallback
  headshotUrl?: string; // ESPN CDN URL, optional — show image if provided, circle if not
  dark?: boolean;     // player hero variant (darker stripe bg)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Shot({ size, num, name, headshotUrl, dark = false }: ShotProps) {
  const darkStripe = 'repeating-linear-gradient(135deg, #1e2d40 0 7px, #172336 7px 14px)';
  const lightStripe = 'repeating-linear-gradient(135deg, #e9edf4 0 7px, #e2e8f1 7px 14px)';

  return (
    <div
      className="shot"
      style={{
        width: size,
        height: size,
        background: headshotUrl ? undefined : (dark ? darkStripe : lightStripe),
      }}
    >
      {headshotUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={headshotUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <span
          className="mono"
          style={{
            fontSize: Math.round(size * 0.28),
            ...(dark ? { color: 'rgba(255,255,255,.75)' } : {}),
          }}
        >
          {initials(name)}
        </span>
      )}

      {num !== undefined && (
        <span className="num-badge">{num}</span>
      )}
    </div>
  );
}
