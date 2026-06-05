import Link from 'next/link';

const NAV_LINKS = [
  { href: '/', label: 'Today' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/groups', label: 'Groups' },
  { href: '/bracket', label: 'Bracket' },
  { href: '/teams', label: 'Teams' },
  { href: '/venues', label: 'Venues' },
  { href: '/stats', label: 'Stats' },
  { href: '/news', label: 'News' },
];

export function Nav({ activePath = '/' }: { activePath?: string }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,.86)',
        backdropFilter: 'saturate(1.6) blur(12px)',
        borderBottom: '1px solid var(--line)',
        boxShadow: '0 1px 0 rgba(11,29,51,.06)',
      }}
    >
      <div
        style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', height: 60 }}
        className="flex items-center gap-[26px]"
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-[10px] no-underline whitespace-nowrap"
          style={{ color: 'var(--navy)', textDecoration: 'none' }}
        >
          <span
            className="flex items-center justify-center text-white text-[14px]"
            style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--navy)' }}
          >
            ⚽
          </span>
          <span className="font-display font-bold text-[16px] tracking-[-0.01em]">
            everyfouryears<span style={{ color: 'var(--live)' }}>.</span>futbol
          </span>
        </Link>

        {/* Nav links — hidden below 880px */}
        <div className="hidden [@media(min-width:880px)]:flex gap-1 flex-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="font-semibold text-[13.5px] px-[11px] py-2 rounded-[8px] no-underline whitespace-nowrap transition-colors"
              style={{
                color: activePath === link.href ? 'var(--navy)' : 'var(--ink-2)',
                background: activePath === link.href ? 'var(--inset)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Tools */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search icon — hidden below 760px */}
          <button
            className="hidden [@media(min-width:760px)]:flex items-center justify-center cursor-pointer"
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              border: '1px solid var(--line-2)',
              background: 'var(--surface)',
              color: 'var(--ink-2)',
            }}
            aria-label="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* My Team */}
          <button
            className="flex items-center gap-[7px] font-semibold text-[13px] whitespace-nowrap cursor-pointer"
            style={{
              background: 'var(--navy)',
              color: '#fff',
              padding: '8px 13px',
              borderRadius: 9,
              border: '1px solid var(--navy)',
            }}
          >
            <span>★</span> My Team
          </button>
        </div>
      </div>
    </nav>
  );
}
