import './AboutPage.css';

interface AboutPageProps {
  onClose: () => void;
}

export default function AboutPage({ onClose }: AboutPageProps) {
  return (
    <div className="about-overlay" onClick={onClose} aria-label="Pukariについて">
      <div
        className="about-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Pukariについて"
      >
        <div className="about-header">
          <h2 className="about-title">Pukariについて</h2>
          <button
            className="about-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="about-body">
          <div className="about-icon" aria-hidden="true">🫧</div>

          <p className="about-tagline">
            思いつきを、空に浮かべよう。
          </p>

          <p className="about-description">
            Pukariは、頭の中に浮かんだことをシャボン玉のように空へ放つためのアプリです。
          </p>

          <p className="about-description">
            やること・気になること・やりたいこと——そういった思いつきは、書き留めなければすぐに消えてしまいます。でも、きっちり管理しようとすると、それだけでしんどくなる。
          </p>

          <p className="about-description">
            Pukariは「タスク管理」ではありません。<br />
            自分を責めないための、やさしい場所です。
          </p>

          <div className="about-divider" />

          <ul className="about-features">
            <li>
              <span className="about-feature-icon" aria-hidden="true">🫧</span>
              <span>思いついたことを泡にして空へ</span>
            </li>
            <li>
              <span className="about-feature-icon" aria-hidden="true">☁️</span>
              <span>今日の空で1日の記録をふりかえる</span>
            </li>
            <li>
              <span className="about-feature-icon" aria-hidden="true">🌊</span>
              <span>ブルーラグーンでもくもく集中タイム</span>
            </li>
          </ul>

          <div className="about-divider" />

          <p className="about-footer-note">
            ver 0.1 — ゆっくり育てています。
          </p>
        </div>
      </div>
    </div>
  );
}
