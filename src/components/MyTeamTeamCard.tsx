'use client';

import Link from 'next/link';
import { useMyTeam } from '@/contexts/my-team-context';

interface MyTeamTeamCardProps {
  abbr: string;
  href: string;
  children: React.ReactNode;
}

export function MyTeamTeamCard({ abbr, href, children }: MyTeamTeamCardProps) {
  const { myTeam } = useMyTeam();
  const isMyTeam = !!myTeam && abbr.toUpperCase() === myTeam.toUpperCase();

  return (
    <Link
      href={href}
      className="team-flag-card"
      style={isMyTeam ? { borderColor: 'var(--navy)', borderWidth: 2 } : undefined}
    >
      {children}
    </Link>
  );
}
