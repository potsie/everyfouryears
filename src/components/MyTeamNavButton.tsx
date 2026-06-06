'use client';

import { useMyTeam } from '@/contexts/my-team-context';

export function MyTeamNavButton() {
  const { myTeam, openPicker } = useMyTeam();

  return (
    <button
      onClick={openPicker}
      className="flex items-center gap-[7px] font-semibold text-[13px] whitespace-nowrap cursor-pointer"
      style={{
        background: 'var(--navy)',
        color: '#fff',
        padding: '8px 13px',
        borderRadius: 9,
        border: '1px solid var(--navy)',
      }}
    >
      <span>★</span> {myTeam ?? 'My Team'}
    </button>
  );
}
