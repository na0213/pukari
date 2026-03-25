import { useState } from 'react';
import type { UseAuthReturn } from '../../hooks/useAuth';
import GoogleConsentModal from '../Auth/GoogleConsentModal';
import './Header.css';

function PrivacyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L4 6v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V6l-8-4z" />
      <path d="M9 12l2 2 4-4" strokeWidth="1.8" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 10.5 Q9.5 9 11 9.3" strokeWidth="1.5" />
      <circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function InstallIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="3.5" width="10" height="17" rx="2.2" />
      <path d="M10 7h4" />
      <path d="M12 11v5" />
      <path d="M9.5 13.5L12 16l2.5-2.5" />
      <path d="M10.2 19h3.6" strokeWidth="1.5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GuestIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 10.5V8.7a3.5 3.5 0 0 1 7 0v1.8" />
      <rect x="6.5" y="10.5" width="11" height="8.5" rx="2" />
      <path d="M12 13.5v2.2" />
    </svg>
  );
}

interface HeaderProps {
  onOpenAbout: () => void;
  onOpenGuest: () => void;
  onOpenPwa: () => void;
  onOpenPrivacy: () => void;
  auth: UseAuthReturn;
  onSignOut: () => void;
}

export default function Header({ onOpenAbout, onOpenGuest, onOpenPwa, onOpenPrivacy, auth, onSignOut }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showGoogleConsent, setShowGoogleConsent] = useState<'link' | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const close = () => {
    setShowMenu(false);
    setShowLogoutConfirm(false);
    setLinkError(null);
    setShowAccountMenu(false);
    setShowGoogleConsent(null);
    setDeleteError(null);
  };

  const handleLinkGoogle = () => {
    setShowGoogleConsent('link');
  };

  const handleLogout = async () => {
    close();
    await auth.signOut();
    onSignOut();
  };

  const handleOpenRename = () => {
    setRenameValue(auth.displayName);
    setRenameError(null);
    setShowRenameModal(true);
  };

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setIsRenaming(true);
    setRenameError(null);
    const result = await auth.updateDisplayName(trimmed);
    setIsRenaming(false);
    if (result?.error) {
      setRenameError('保存できませんでした。もう一度お試しください。');
    } else {
      setShowRenameModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const result = await auth.deleteAccount();
    setIsDeleting(false);
    if (result?.error) {
      console.warn('deleteAccount error:', result.error);
      setDeleteError('削除できませんでした。もう一度お試しください。');
      return;
    }
    close();
    setShowDeleteConfirm(false);
    onSignOut();
  };

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

      {/* ── Google連携同意モーダル ── */}
      {showGoogleConsent && (
        <GoogleConsentModal
          mode={showGoogleConsent}
          auth={auth}
          onClose={() => setShowGoogleConsent(null)}
          onOpenPrivacy={() => { setShowGoogleConsent(null); onOpenPrivacy(); }}
        />
      )}

      {/* ── 表示名変更モーダル ── */}
      {showRenameModal && (
        <div className="sky-modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="sky-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="表示名を変更する">
            <h2 className="sky-modal-title">表示名を変更する</h2>
            <input
              className="sky-modal-input"
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              maxLength={50}
              autoFocus
            />
            {renameError && <p className="sky-modal-error">{renameError}</p>}
            <div className="sky-modal-btns">
              <button
                className="sky-modal-btn-primary"
                onClick={handleRename}
                disabled={isRenaming || !renameValue.trim()}
              >
                {isRenaming ? '保存中…' : '保存する'}
              </button>
              <button
                className="sky-modal-btn-cancel"
                onClick={() => setShowRenameModal(false)}
              >
                やめる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── アカウント削除確認モーダル ── */}
      {showDeleteConfirm && (
        <div className="sky-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="sky-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="アカウントを削除する">
            <h2 className="sky-modal-title">アカウントを削除しますか？</h2>
            <p className="sky-modal-body">
              この操作は取り消せません。<br />
              すべてのデータが削除されます。
            </p>
            {deleteError && <p className="sky-modal-error">{deleteError}</p>}
            <div className="sky-modal-btns">
              <button
                className="sky-modal-btn-danger"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中…' : '削除する'}
              </button>
              <button
                className="sky-modal-btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                やめる
              </button>
            </div>
          </div>
        </div>
      )}

      {showMenu && (
        <>
          {/* オーバーレイ */}
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
                  <span className="sky-side-menu-icon"><AboutIcon /></span>
                  Pukariについて
                </button>
              </li>
              <li>
                <button
                  className="sky-side-menu-item"
                  onClick={() => { close(); onOpenPwa(); }}
                >
                  <span className="sky-side-menu-icon"><InstallIcon /></span>
                  ホーム画面に追加する
                </button>
              </li>
              <li>
                <button
                  className="sky-side-menu-item"
                  onClick={() => { close(); onOpenPrivacy(); }}
                >
                  <span className="sky-side-menu-icon"><PrivacyIcon /></span>
                  プライバシーポリシー
                </button>
              </li>

              {/* 区切り線 */}
              <li role="separator" className="sky-side-menu-divider" />

              {/* ── ゲストユーザー ── */}
              {auth.isAnonymous ? (
                <>
                  <li>
                    <button
                      className="sky-side-menu-info sky-side-menu-info--button"
                      onClick={() => { close(); onOpenGuest(); }}
                    >
                      <span className="sky-side-menu-info-icon"><GuestIcon /></span>
                      <div className="sky-side-menu-info-body">
                        <div className="sky-side-menu-info-label">ゲストとして利用中</div>
                        <div className="sky-side-menu-info-sub">データはSupabaseに保存されます</div>
                        <div className="sky-side-menu-info-sub sky-side-menu-info-sub--hint">タップして詳しく見る</div>
                      </div>
                      <span className="sky-side-menu-chevron" aria-hidden="true">›</span>
                    </button>
                  </li>
                  {/* ゲストセッションがある場合のみ連携ボタンを表示 */}
                  {auth.user && (
                    <li>
                      <button
                        className="sky-side-menu-item sky-side-menu-item--google"
                        onClick={handleLinkGoogle}
                      >
                        <span className="sky-side-menu-icon"><GoogleIcon /></span>
                        Googleアカウントと連携する
                      </button>
                    </li>
                  )}
                  {linkError && (
                    <li className="sky-side-menu-error">{linkError}</li>
                  )}
                </>
              ) : (
                /* ── Googleログイン済み ── */
                <>
                  <li>
                    <button
                      className="sky-side-menu-info sky-side-menu-info--button"
                      onClick={() => setShowAccountMenu(v => !v)}
                      aria-expanded={showAccountMenu}
                    >
                      <span className="sky-side-menu-info-icon">👤</span>
                      <div className="sky-side-menu-info-body">
                        <div className="sky-side-menu-info-label">{auth.displayName}</div>
                        <div className="sky-side-menu-info-sub">データは安全に同期されています</div>
                      </div>
                      <span className="sky-side-menu-chevron" aria-hidden="true">
                        {showAccountMenu ? '▲' : '▼'}
                      </span>
                    </button>
                  </li>
                  {showAccountMenu && (
                    <>
                      <li>
                        <button
                          className="sky-side-menu-item sky-side-menu-item--sub"
                          onClick={handleOpenRename}
                        >
                          表示名を変更する
                        </button>
                      </li>
                      <li>
                        <button
                          className="sky-side-menu-item sky-side-menu-item--sub sky-side-menu-item--danger"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          アカウントを削除する
                        </button>
                      </li>
                    </>
                  )}

                  {/* 区切り線 */}
                  <li role="separator" className="sky-side-menu-divider" />

                  {!showLogoutConfirm ? (
                    <li>
                      <button
                        className="sky-side-menu-item sky-side-menu-item--logout"
                        onClick={() => setShowLogoutConfirm(true)}
                      >
                        ログアウト
                      </button>
                    </li>
                  ) : (
                    <li className="sky-side-menu-logout-confirm">
                      <p className="sky-side-menu-logout-text">
                        ログアウトしますか？<br />
                        再ログインでデータを復元できます。
                      </p>
                      <div className="sky-side-menu-logout-btns">
                        <button
                          className="sky-side-menu-logout-ok"
                          onClick={handleLogout}
                        >
                          ログアウト
                        </button>
                        <button
                          className="sky-side-menu-logout-cancel"
                          onClick={() => setShowLogoutConfirm(false)}
                        >
                          やめる
                        </button>
                      </div>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
