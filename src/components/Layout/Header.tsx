import { useState } from 'react';
import './Header.css';

interface HeaderProps {
  onOpenAbout: () => void;
  onOpenPwa: () => void;
}

export default function Header({ onOpenAbout, onOpenPwa }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  const close = () => setShowMenu(false);

  return (
    <>
      <header className="sky-header" role="banner">
        <span className="sky-header-title">
          <img
            src="/images/logo.png"
            alt="Pukari"
            className="header-logo-image"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="header-logo-text">Pukari</span>
        </span>
        <button
          className="sky-header-menu-btn"
          onClick={() => setShowMenu(true)}
          aria-label="メニューを開く"
          aria-expanded={showMenu}
        >
          ☰
        </button>
      </header>

      {showMenu && (
        <>
          {/* オーバーレイ（外タップで閉じる） */}
          <div
            className="sky-menu-overlay"
            onClick={close}
            aria-hidden="true"
          />

          {/* サイドパネル */}
          <nav className="sky-side-menu" aria-label="メニュー">
            <div className="sky-side-menu-header">
              <span className="sky-side-menu-title">Pukari</span>
              <button
                className="sky-side-menu-close"
                onClick={close}
                aria-label="メニューを閉じる"
              >
                ×
              </button>
            </div>

            <ul className="sky-side-menu-list">
              <li>
                <button
                  className="sky-side-menu-item"
                  onClick={() => { close(); onOpenAbout(); }}
                >
                  <span className="sky-side-menu-icon">🫧</span>
                  Pukariについて
                </button>
              </li>
              <li>
                <button
                  className="sky-side-menu-item"
                  onClick={() => { close(); onOpenPwa(); }}
                >
                  <span className="sky-side-menu-icon">📲</span>
                  ホーム画面に追加する
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
