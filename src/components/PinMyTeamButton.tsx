'use client';

import { useMyTeam } from '@/contexts/my-team-context';

interface PinMyTeamButtonProps {
  abbr: string;
}

export default function PinMyTeamButton({ abbr }: PinMyTeamButtonProps) {
  const { myTeam, setMyTeam } = useMyTeam();
  const isPinned = myTeam?.toUpperCase() === abbr.toUpperCase();

  const baseStyle: React.CSSProperties = {
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--ui)',
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  };

  const style: React.CSSProperties = isPinned
    ? {
        ...baseStyle,
        background: 'var(--navy)',
        color: '#fff',
        border: '1px solid var(--navy)',
      }
    : {
        ...baseStyle,
        background: 'var(--inset)',
        color: 'var(--ink-2)',
        border: '1px solid var(--line-2)',
      };

  function handleClick() {
    setMyTeam(isPinned ? null : abbr.toUpperCase());
  }

  return (
    <button style={style} onClick={handleClick}>
      {isPinned ? '★ My Team ✓' : '★ Set as My Team'}
    </button>
  );
}
