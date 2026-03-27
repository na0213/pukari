import { useState } from 'react';
import type { UseAuthReturn } from '../../hooks/useAuth';
import './GuestGuidePage.css';

interface GuestGuidePageProps {
  onClose: () => void;
  auth: UseAuthReturn;
}

function GuestIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 10.5V8.7a3.5 3.5 0 0 1 7 0v1.8" />
      <rect x="6.5" y="10.5" width="11" height="8.5" rx="2" />
      <path d="M12 13.5v2.2" />
    </svg>
  );
}

export default function GuestGuidePage({ onClose, auth }: GuestGuidePageProps) {
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    setLinkError(null);
    const result = await auth.linkGoogleAccount();
    setIsLinking(false);
    if (result?.error) {
      setLinkError('連携できませんでした。もう一度お試しください。');
      return;
    }
  };

  const handleDeleteGuestData = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const result = await auth.deleteAccount();
    setIsDeleting(false);
    if (result?.error) {
      setDeleteError('削除できませんでした。もう一度お試しください。');
      return;
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="guest-overlay" onClick={onClose} aria-label="ゲスト利用とは？">
      <div
        className="guest-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="ゲスト利用とは？"
      >
        <div className="guest-header">
          <h2 className="guest-title">ゲスト利用とは？</h2>
          <button
            className="guest-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="guest-body">
          <div className="guest-icon" aria-hidden="true"><GuestIcon /></div>

          <p className="guest-tagline">
            まずは、アカウントなしでふらっと始める。
          </p>

          <p className="guest-description">
            ゲスト利用では、思いついたことをそのまま使い始められます。
            ひとまず試したいときに向いています。
          </p>

          <ul className="guest-points">
            <li>入力した内容は、今お使いのブラウザに保存されます</li>
            <li>あとからGoogleアカウントと連携すれば、データは消えません</li>
          </ul>

          <div className="guest-points guest-points--warning" aria-label="ご注意">
            <p className="guest-points-heading">【ご注意】以下の場合は、データが引き継がれません。</p>
            <ul className="guest-points-list">
              <li>別の端末（スマホからPCなど）で開いた場合</li>
              <li>別のブラウザ（ChromeからSafariなど）で開いた場合</li>
              <li>シークレットモードで利用した場合</li>
            </ul>
          </div>

          <p className="guest-description">
            まずはゲストで始めて、必要になったらGoogleログインへ
          </p>

          <div className="guest-actions">

            {!showLinkConfirm ? (
              <button
                className="guest-action-btn guest-action-btn--primary"
                onClick={() => {
                  setDeleteError(null);
                  setShowLinkConfirm(true);
                }}
              >
                Googleアカウントと連携する
              </button>
            ) : (
              <div className="guest-action-confirm guest-action-confirm--primary">
                <p className="guest-action-confirm-text">
                  今のデータをそのまま引き継ぎます。<br />
                  連携しますか？
                </p>
                <p className="guest-action-confirm-note">
                  連携すると、端末が変わってもデータが消えません。
                </p>
                {linkError && <p className="guest-action-error">{linkError}</p>}
                <div className="guest-action-btns">
                  <button
                    className="guest-action-btn guest-action-btn--primary"
                    onClick={handleLinkGoogle}
                    disabled={isLinking}
                  >
                    {isLinking ? '連携中…' : '連携する'}
                  </button>
                  <button
                    className="guest-action-btn guest-action-btn--cancel"
                    onClick={() => setShowLinkConfirm(false)}
                  >
                    やめる
                  </button>
                </div>
              </div>
            )}

            {!showDeleteConfirm ? (
              <button
                className="guest-action-btn guest-action-btn--danger"
                onClick={() => {
                  setLinkError(null);
                  setShowDeleteConfirm(true);
                }}
              >
                ゲストデータを削除する
              </button>
            ) : (
              <div className="guest-action-confirm guest-action-confirm--danger">
                <p className="guest-action-confirm-text">
                  この端末のゲストデータをすべて削除します。<br />
                  よろしいですか？
                </p>
                <p className="guest-action-confirm-note">
                  この操作は取り消せません。すべてのデータが削除されます。
                </p>
                {deleteError && <p className="guest-action-error">{deleteError}</p>}
                <div className="guest-action-btns">
                  <button
                    className="guest-action-btn guest-action-btn--danger"
                    onClick={handleDeleteGuestData}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '削除中…' : '削除する'}
                  </button>
                  <button
                    className="guest-action-btn guest-action-btn--cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    やめる
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
