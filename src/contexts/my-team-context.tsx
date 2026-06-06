'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';

// ── helpers ──────────────────────────────────────────────────────────────────

export function espnFlagUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/countries/500/${abbr.toLowerCase()}.png`;
}

// ── static data ──────────────────────────────────────────────────────────────

const TEAMS_48 = [
  { abbr: 'ALG', name: 'Algeria' },
  { abbr: 'ARG', name: 'Argentina' },
  { abbr: 'AUS', name: 'Australia' },
  { abbr: 'AUT', name: 'Austria' },
  { abbr: 'BEL', name: 'Belgium' },
  { abbr: 'BIH', name: 'Bosnia-Herzegovina' },
  { abbr: 'BRA', name: 'Brazil' },
  { abbr: 'CAN', name: 'Canada' },
  { abbr: 'CPV', name: 'Cape Verde' },
  { abbr: 'COL', name: 'Colombia' },
  { abbr: 'COD', name: 'Congo DR' },
  { abbr: 'CRO', name: 'Croatia' },
  { abbr: 'CUW', name: 'Curaçao' },
  { abbr: 'CZE', name: 'Czechia' },
  { abbr: 'ECU', name: 'Ecuador' },
  { abbr: 'EGY', name: 'Egypt' },
  { abbr: 'ENG', name: 'England' },
  { abbr: 'FRA', name: 'France' },
  { abbr: 'GER', name: 'Germany' },
  { abbr: 'GHA', name: 'Ghana' },
  { abbr: 'HAI', name: 'Haiti' },
  { abbr: 'IRN', name: 'Iran' },
  { abbr: 'IRQ', name: 'Iraq' },
  { abbr: 'CIV', name: 'Ivory Coast' },
  { abbr: 'JPN', name: 'Japan' },
  { abbr: 'JOR', name: 'Jordan' },
  { abbr: 'MEX', name: 'Mexico' },
  { abbr: 'MAR', name: 'Morocco' },
  { abbr: 'NED', name: 'Netherlands' },
  { abbr: 'NZL', name: 'New Zealand' },
  { abbr: 'NOR', name: 'Norway' },
  { abbr: 'PAN', name: 'Panama' },
  { abbr: 'PAR', name: 'Paraguay' },
  { abbr: 'POR', name: 'Portugal' },
  { abbr: 'QAT', name: 'Qatar' },
  { abbr: 'KSA', name: 'Saudi Arabia' },
  { abbr: 'SCO', name: 'Scotland' },
  { abbr: 'SEN', name: 'Senegal' },
  { abbr: 'RSA', name: 'South Africa' },
  { abbr: 'KOR', name: 'South Korea' },
  { abbr: 'ESP', name: 'Spain' },
  { abbr: 'SWE', name: 'Sweden' },
  { abbr: 'SUI', name: 'Switzerland' },
  { abbr: 'TUN', name: 'Tunisia' },
  { abbr: 'TUR', name: 'Türkiye' },
  { abbr: 'USA', name: 'United States' },
  { abbr: 'URU', name: 'Uruguay' },
  { abbr: 'UZB', name: 'Uzbekistan' },
];

// ── context ───────────────────────────────────────────────────────────────────

interface MyTeamContextValue {
  myTeam: string | null;
  setMyTeam: (abbr: string | null) => void;
  openPicker: () => void;
}

const MyTeamContext = createContext<MyTeamContextValue | null>(null);

export function useMyTeam(): MyTeamContextValue {
  const ctx = useContext(MyTeamContext);
  if (!ctx) {
    throw new Error('useMyTeam must be used inside <MyTeamProvider>');
  }
  return ctx;
}

// ── modal ─────────────────────────────────────────────────────────────────────

interface MyTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  myTeam: string | null;
  onSelect: (abbr: string | null) => void;
}

function MyTeamModal({ isOpen, onClose, myTeam, onSelect }: MyTeamModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // ESC key closes modal
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? TEAMS_48.filter(
        (t) =>
          t.abbr.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q),
      )
    : TEAMS_48;

  function handleSelect(abbr: string) {
    onSelect(abbr);
    onClose();
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const modal = (
    <>
    <style>{`.wc-team-btn:hover { background: var(--inset) !important; }`}</style>
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,29,51,.72)',
        zIndex: 200,
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '560px',
          width: 'calc(100% - 32px)',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--ink)',
            }}
          >
            Pick your team
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '22px',
              lineHeight: 1,
              color: 'var(--ink-3)',
              padding: '2px 4px',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams..."
            style={{
              width: '100%',
              border: '1px solid var(--line-2)',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '14px',
              fontFamily: 'var(--ui)',
              color: 'var(--ink)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div
          style={{
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '8px',
            alignContent: 'start',
          }}
        >
          {filtered.map((team) => {
            const selected = team.abbr === myTeam;
            return (
              <TeamButton
                key={team.abbr}
                team={team}
                selected={selected}
                onSelect={handleSelect}
              />
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                color: 'var(--ink-3)',
                fontSize: '14px',
                padding: '24px 0',
              }}
            >
              No teams match &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {myTeam && (
          <div
            style={{
              padding: '10px 16px 14px',
              display: 'flex',
              justifyContent: 'center',
              borderTop: '1px solid var(--line)',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--ink-2)',
                fontFamily: 'var(--ui)',
              }}
            >
              Clear my team
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );

  // Render via portal to avoid stacking context issues with sticky nav
  return ReactDOM.createPortal(modal, document.body);
}

interface TeamButtonProps {
  team: { abbr: string; name: string };
  selected: boolean;
  onSelect: (abbr: string) => void;
}

function TeamButton({ team, selected, onSelect }: TeamButtonProps) {
  return (
    <button
      onClick={() => onSelect(team.abbr)}
      className="wc-team-btn"
      data-selected={selected ? 'true' : undefined}
      style={{
        background: selected ? 'var(--inset)' : undefined,
        border: selected ? '1px solid var(--navy)' : '1px solid var(--line)',
        boxShadow: selected ? 'inset 0 0 0 2px var(--navy)' : 'none',
        borderRadius: '10px',
        padding: '10px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignItems: 'flex-start',
        textAlign: 'left',
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      <img
        src={espnFlagUrl(team.abbr)}
        alt={team.name}
        width={28}
        height={28}
        style={{
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 700,
          fontSize: '13px',
          color: 'var(--ink)',
          lineHeight: 1,
        }}
      >
        {team.abbr}
      </span>
      <span
        style={{
          fontSize: '11px',
          color: 'var(--ink-3)',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {team.name}
      </span>
    </button>
  );
}

// ── provider ──────────────────────────────────────────────────────────────────

export function MyTeamProvider({ children }: { children: React.ReactNode }) {
  const [myTeam, setMyTeamState] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // SSR-safe localStorage read on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wc2026_myteam');
      if (stored) setMyTeamState(stored);
    } catch {
      // localStorage not available (e.g. private browsing with strict settings)
    }
  }, []);

  function setMyTeam(abbr: string | null) {
    setMyTeamState(abbr);
    try {
      if (abbr === null) {
        localStorage.removeItem('wc2026_myteam');
      } else {
        localStorage.setItem('wc2026_myteam', abbr);
      }
    } catch {
      // ignore storage errors
    }
  }

  function openPicker() {
    setIsPickerOpen(true);
  }

  return (
    <MyTeamContext.Provider value={{ myTeam, setMyTeam, openPicker }}>
      {children}
      <MyTeamModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        myTeam={myTeam}
        onSelect={setMyTeam}
      />
    </MyTeamContext.Provider>
  );
}
