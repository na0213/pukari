import './AboutPage.css';

interface AboutPageProps {
  onClose: () => void;
  onOpenWelcome: () => void;
}

function BubbleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 9.5 Q9.5 8 11 9" strokeWidth="1.5" />
      <path d="M14.5 15.2 Q15.8 14.2 16.3 12.6" strokeWidth="1.4" />
      <circle cx="8.5" cy="8.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 18.5 Q6 16 8.8 16 Q9.5 13.5 12.5 13.5 Q15.1 13.5 16 15.3 Q18.5 15.3 18.5 17.6 Q18.5 19 17 19 H7.2 Q6 19 6 18.5Z" />
      <path d="M9 14.2 Q9.8 11.2 13 11.2 Q15 11.2 16.2 12.6" strokeWidth="1.6" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 8 C6 5.5 9 10.5 12 8 C15 5.5 18 10.5 21 8" />
      <path d="M3 12 C6 9.5 9 14.5 12 12 C15 9.5 18 14.5 21 12" />
      <path d="M3 16 C6 13.5 9 18.5 12 16 C15 13.5 18 18.5 21 16" />
    </svg>
  );
}

export default function AboutPage({ onClose, onOpenWelcome }: AboutPageProps) {
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
          <div className="about-icon" aria-hidden="true">
            <img src="/favicon.png" alt="" />
          </div>

          <p className="about-tagline">
            思いつきを、空に浮かべよう。
          </p>

          <p className="about-description">
            Pukariは、スケジュール管理やタスク管理が苦手な人のためのアプリです。
          </p>

          <p className="about-description">
            思いつくことはたくさんあるのに、Todoアプリも習慣化も続かない。
            書き留めたいことが散らばって、いつのまにか見失ってしまう。
          </p>

          <p className="about-description">
            そんなとき、なんでもひとまず浮かべておける。
            アイデアでも、タスクでも、気になることでも。
          </p>

          <p className="about-description">
            時間に追われず、やりたいと思ったときにゆるく振り返れる。
          </p>

          <p className="about-description">
            もくもく場では、気持ちを切り替えて集中もできる。
          </p>


          <p className="about-description">
            Pukariは、そんな場所です。
          </p>

          <div className="about-divider" />

          <ul className="about-features">
            <li>
              <span className="about-feature-icon" aria-hidden="true"><BubbleIcon /></span>
              <span>思いついたことを泡にして空へ</span>
            </li>
            <li>
              <span className="about-feature-icon" aria-hidden="true"><CloudIcon /></span>
              <span>今日の空で1日の記録をふりかえる</span>
            </li>
            <li>
              <span className="about-feature-icon" aria-hidden="true"><WaveIcon /></span>
              <span>みんなともくもく集中タイム</span>
            </li>
          </ul>

          <div className="about-divider" />

          <p className="about-footer-note">
            ver 0.1 — ゆっくり育てています。
          </p>

          <button
            className="about-more-link"
            onClick={() => {
              onClose();
              onOpenWelcome();
            }}
            aria-label="Pukariをもっと詳しく見る"
          >
            Pukariをもっと詳しく
          </button>
        </div>
      </div>
    </div>
  );
}
