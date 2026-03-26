import { useState } from 'react';
import type { UseAuthReturn } from '../../hooks/useAuth';
import './GoogleConsentModal.css';

function GoogleGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

interface GoogleConsentModalProps {
  /** 'signin': ウェルカム画面からのGoogleログイン  link': ゲストからのアカウント連携 */
  mode: 'signin' | 'link';
  auth: UseAuthReturn;
  onClose: () => void;
  onOpenPrivacy: () => void;
}

export default function GoogleConsentModal({ mode, auth, onClose, onOpenPrivacy }: GoogleConsentModalProps) {
  const [isBusy, setIsBusy] = useState(false);

  const handleContinue = async () => {
    setIsBusy(true);
    if (mode === 'link') {
      await auth.linkGoogleAccount();
      // linkGoogleAccount はリダイレクトするため通常ここには戻らない
    } else {
      await auth.signInWithGoogle();
      // signInWithGoogle もリダイレクト。エラー時のみここに戻る
    }
    setIsBusy(false);
  };

  return (
    <div className="gconsent-overlay" onClick={onClose} aria-modal="true" role="dialog" aria-label="Googleアカウント連携について">
      <div className="gconsent-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="gconsent-title">
          {mode === 'signin' ? 'Googleでログイン' : 'Googleアカウント連携について'}
        </h2>

        <p className="gconsent-lead">
          {mode === 'signin' ? (
            <>
              メールアドレスと名前を取得します<br />
              （いつでも削除できます）
            </>
          ) : (
            <>連携すると、以下の情報が<br />Pukariに保存されます:</>
          )}
        </p>

        {mode === 'link' && (
          <>
            <ul className="gconsent-list">
              <li>メールアドレス</li>
              <li>表示名</li>
              <li>プロフィール画像</li>
            </ul>

            <p className="gconsent-note">
              これらは認証とデータ同期のみに使用し、<br />
              第三者への提供は行いません。
            </p>

            <p className="gconsent-note">
              連携後は、異なる端末やブラウザからも<br />
              同じデータにアクセスできるようになります。
            </p>
          </>
        )}

        <button
          className="gconsent-privacy-link"
          onClick={onOpenPrivacy}
          type="button"
        >
          プライバシーポリシーを読む
        </button>

        <div className="gconsent-actions">
          <button
          className="gconsent-google-btn"
          onClick={handleContinue}
          disabled={isBusy}
          type="button"
        >
          <GoogleGIcon />
          {isBusy ? '接続中…' : 'Googleで続ける'}
        </button>
          <button
            className="gconsent-cancel"
            onClick={onClose}
            type="button"
          >
            やめる
          </button>
        </div>
      </div>
    </div>
  );
}
