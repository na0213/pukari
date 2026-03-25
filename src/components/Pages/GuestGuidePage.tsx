import './GuestGuidePage.css';

interface GuestGuidePageProps {
  onClose: () => void;
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

export default function GuestGuidePage({ onClose }: GuestGuidePageProps) {
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
            <li>データは安全にクラウドへ保存されます</li>
            <li>端末やブラウザが変わると、ゲストのデータは引き継がれません</li>
            <li>あとからGoogleアカウントと連携できます</li>
            <li>連携すると、今のデータのまま使い続けられます</li>
          </ul>

          <p className="guest-description">
            まずはゲストで始めて、必要になったらGoogleログインへ。
            そんな使い方ができます。
          </p>
        </div>
      </div>
    </div>
  );
}
