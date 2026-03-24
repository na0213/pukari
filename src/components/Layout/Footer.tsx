import './Footer.css';

// ── アイコン ──────────────────────────────────────────────

function BubbleIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 9.5 Q9.5 8 11 9" strokeWidth="1.5" />
    </svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6" />
      <line x1="15.2" y1="15.2" x2="20" y2="20" />
    </svg>
  );
}

function WaveIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 8 C6 5.5 9 10.5 12 8 C15 5.5 18 10.5 21 8" />
      <path d="M3 12 C6 9.5 9 14.5 12 12 C15 9.5 18 14.5 21 12" />
      <path d="M3 16 C6 13.5 9 18.5 12 16 C15 13.5 18 18.5 21 16" />
    </svg>
  );
}

function CloudSunIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {/* 太陽 */}
      <circle cx="17" cy="7" r="3" />
      <line x1="17" y1="2" x2="17" y2="3.5" strokeWidth="1.5" />
      <line x1="21.1" y1="3.9" x2="20.1" y2="4.9" strokeWidth="1.5" />
      <line x1="22" y1="7" x2="20.5" y2="7" strokeWidth="1.5" />
      <line x1="21.1" y1="10.1" x2="20.1" y2="9.1" strokeWidth="1.5" />
      {/* 雲 */}
      <path d="M2 19.5 Q2 17 5 17 Q5.5 14.5 9 14.5 Q12.5 14.5 13 16.5 Q16 16.5 16 19 Q16 20.5 14 20.5 H4 Q2 20.5 2 19.5Z"
        strokeLinejoin="round" />
    </svg>
  );
}

// ── コンポーネント ────────────────────────────────────────

export type FooterActiveItem = 'home' | 'search' | 'mokumoku' | 'kiroku';

interface FooterProps {
  activeBubbleCount: number;
  activeItem: FooterActiveItem;
  onHome: () => void;
  onSearch: () => void;
  onOpenLagoon: () => void;
  onOpenJournal: () => void;
}

const ACTIVE_COLOR   = '#5BA4CF';
const INACTIVE_COLOR = '#9CA3AF';
const DISABLED_COLOR = '#D1D5DB';

export default function Footer({
  activeBubbleCount,
  activeItem,
  onHome,
  onSearch,
  onOpenLagoon,
  onOpenJournal,
}: FooterProps) {
  const canSearch = activeBubbleCount > 0;

  const items = [
    {
      key: 'home' as FooterActiveItem,
      label: 'ホーム',
      icon: (c: string) => <BubbleIcon color={c} />,
      onClick: onHome,
      disabled: false,
      ariaLabel: 'ホームに戻る',
    },
    {
      key: 'search' as FooterActiveItem,
      label: 'さがす',
      icon: (c: string) => <SearchIcon color={c} />,
      onClick: onSearch,
      disabled: !canSearch,
      ariaLabel: '検索する',
    },
    {
      key: 'mokumoku' as FooterActiveItem,
      label: 'もくもく',
      icon: (c: string) => <WaveIcon color={c} />,
      onClick: onOpenLagoon,
      disabled: false,
      ariaLabel: 'もくもく集中タイム',
    },
    {
      key: 'kiroku' as FooterActiveItem,
      label: 'きろく',
      icon: (c: string) => <CloudSunIcon color={c} />,
      onClick: onOpenJournal,
      disabled: false,
      ariaLabel: '今日の空を見る',
    },
  ] as const;

  return (
    <nav className="app-footer" aria-label="ナビゲーション">
      {items.map((item) => {
        const isActive = activeItem === item.key;
        const color = item.disabled
          ? DISABLED_COLOR
          : isActive
            ? ACTIVE_COLOR
            : INACTIVE_COLOR;
        return (
          <button
            key={item.key}
            className={`app-footer-btn${isActive ? ' app-footer-btn--active' : ''}${item.disabled ? ' app-footer-btn--disabled' : ''}`}
            onClick={item.onClick}
            disabled={item.disabled}
            aria-label={item.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.icon(color)}
            <span className="app-footer-label" style={{ color }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
