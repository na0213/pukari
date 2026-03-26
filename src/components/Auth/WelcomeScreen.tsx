import { useState } from 'react';
import type { UseAuthReturn } from '../../hooks/useAuth';
import GoogleConsentModal from './GoogleConsentModal';
import './WelcomeScreen.css';

// Google ブランドアイコン
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 10.5V8.7a3.5 3.5 0 0 1 7 0v1.8" />
      <rect x="6.5" y="10.5" width="11" height="8.5" rx="2" />
      <path d="M12 13.5v2.2" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.9 5.7L19.6 11l-5.7 1.9L12 18.6l-1.9-5.7L4.4 11l5.7-2.3L12 3z" />
    </svg>
  );
}

const FEATURE_ITEMS = [
  {
    title: '思いつきを浮かべる',
    text: 'アイデアもタスクも、まずは泡に。',
  },
  {
    title: 'メモを追加する',
    text: '泡の中に、あとで見返すメモを残せます。',
  },
  {
    title: '3つの状態でゆるく整理',
    text: 'キープ / 今日はここまで / できた！ で進み具合がわかります。',
  },
  {
    title: '空の色が少しずつ変わる',
    text: '今日の積み重ねで、背景の空も表情を変えます。',
  },
  {
    title: 'みんなともくもくタイムへ',
    text: '一緒にもくもく作業する集中モード。意気込みを入れても、空欄のままでもOKです。',
  },
  {
    title: 'サウンドも選べる',
    text: '気分に合わせて、音と空気感を切り替えられます。',
  },
];

interface WelcomeActionsProps {
  isBusy: boolean;
  isGuestLoading: boolean;
  onOpenGoogle: () => void;
  onGuest: () => void;
  className?: string;
}

function WelcomeActions({
  isBusy,
  isGuestLoading,
  onOpenGoogle,
  onGuest,
  className = '',
}: WelcomeActionsProps) {
  return (
    <div className={`welcome-actions ${className}`.trim()}>
      <button
        className="welcome-google-btn"
        onClick={onOpenGoogle}
        disabled={isBusy}
        aria-label="Googleでログインする"
      >
        <GoogleIcon />
        Googleログイン
      </button>

      <div className="welcome-guest-area">
        <button
          className="welcome-guest-btn"
          onClick={onGuest}
          disabled={isBusy}
        >
          {isGuestLoading ? '準備中…' : 'まずはゲストで試してみる'}
        </button>
        <p className="welcome-guest-note">
          この端末だけで使えます。<br />
          あとからGoogleアカウントと連携できます。
        </p>
      </div>
    </div>
  );
}

interface WelcomeScreenProps {
  auth: UseAuthReturn;
  onOpenPrivacy: () => void;
}

export default function WelcomeScreen({ auth, onOpenPrivacy }: WelcomeScreenProps) {
  const [logoError, setLogoError] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [showGoogleConsent, setShowGoogleConsent] = useState(false);

  const handleGuest = async () => {
    setIsGuestLoading(true);
    await auth.signInAnonymously();
    setIsGuestLoading(false);
  };

  const isBusy = isGuestLoading;

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <section className="welcome-hero">
          <div className="welcome-hero-copy">
            <div className="welcome-logo">
              {logoError ? (
                <span className="welcome-logo-text">Pukari</span>
              ) : (
                <img
                  src="/images/logo.png"
                  alt="Pukari"
                  className="welcome-logo-image"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>

            <p className="welcome-tagline">がんばらなくても使える、ゆるい整理アプリ</p>
            <h1 className="welcome-title">思いつきを泡にして、やさしく整理。</h1>
            <p className="welcome-lead">
              アイデアもタスクも、まずは気軽に泡にして浮かべるだけ。
              あとからメモを足したり、ゆるく見返せます。
            </p>

            <div className="welcome-hero-stats" aria-label="できること">
              <span>思いつきを泡に</span>
              <span>泡にメモを追加</span>
              <span>集中タイムに参加</span>
            </div>

            <WelcomeActions
              isBusy={isBusy}
              isGuestLoading={isGuestLoading}
              onOpenGoogle={() => setShowGoogleConsent(true)}
              onGuest={handleGuest}
              className="welcome-actions--hero"
            />
          </div>

          <div className="welcome-hero-visual" aria-label="Pukariの画面イメージ">
            <article className="welcome-preview welcome-preview--home">
              <div className="welcome-preview-top">
                <span className="welcome-preview-kicker">TOP</span>
                <span className="welcome-preview-tag">泡に浮かべる</span>
              </div>
              <div className="welcome-preview-bubbles">
                <span className="welcome-preview-bubble welcome-preview-bubble--lg">アプリ作る</span>
                <span className="welcome-preview-bubble welcome-preview-bubble--md">プレゼン</span>
                <span className="welcome-preview-bubble welcome-preview-bubble--sm">筋トレ</span>
              </div>
              <p className="welcome-preview-copy">
                思いついたことを、そのまま空に浮かべます。
              </p>
            </article>

            <article className="welcome-preview welcome-preview--detail">
              <div className="welcome-preview-top">
                <span className="welcome-preview-kicker">MEMO</span>
                <span className="welcome-preview-tag">泡にメモ</span>
              </div>
              <div className="welcome-preview-sheet">
                <p className="welcome-preview-title">【目標】アプリつくる</p>
                <div className="welcome-preview-note">
                  <span>・筋トレアプリ</span>
                  <span>・家計簿アプリ</span>
                </div>
                <div className="welcome-preview-statuses">
                  <span>◎ キープ</span>
                  <span>今日はここまで</span>
                  <span>できた！</span>
                </div>
              </div>
              <p className="welcome-preview-copy">
                メモを足して、キープや完了の状態も残せます。
              </p>
            </article>

            <article className="welcome-preview welcome-preview--lagoon">
              <div className="welcome-preview-top">
                <span className="welcome-preview-kicker">LAGOON</span>
                <span className="welcome-preview-tag">集中する</span>
              </div>
              <div className="welcome-preview-lagoon">
                <span className="welcome-preview-star" />
                <span className="welcome-preview-star welcome-preview-star--dim" />
                <span className="welcome-preview-lagoon-bubble">やるぞ</span>
              </div>
              <p className="welcome-preview-copy">
                もくもく中の人の泡が浮かび、音や空気感も切り替えられます。
              </p>
            </article>
          </div>
        </section>

        <section className="welcome-story">
          <div className="welcome-story-head">
            <span className="welcome-story-kicker">できること</span>
            <h2 className="welcome-story-title">Pukariで、こんなふうに使えます。</h2>
          </div>

          <ul className="welcome-feature-list">
            {FEATURE_ITEMS.map((item) => (
              <li key={item.title} className="welcome-feature-item">
                <span className="welcome-feature-icon" aria-hidden="true"><SparkIcon /></span>
                <div className="welcome-feature-body">
                  <p className="welcome-feature-title">{item.title}</p>
                  <p className="welcome-feature-text">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="welcome-story-bottom">
            <div className="welcome-security">
              <span className="welcome-security-icon" aria-hidden="true"><LockIcon /></span>
              <p className="welcome-security-text">
                データは安全なクラウドに保存されます
              </p>
            </div>

            <WelcomeActions
              isBusy={isBusy}
              isGuestLoading={isGuestLoading}
              onOpenGoogle={() => setShowGoogleConsent(true)}
              onGuest={handleGuest}
              className="welcome-actions--footer"
            />
          </div>
        </section>

      </div>

      {showGoogleConsent && (
        <GoogleConsentModal
          mode="signin"
          auth={auth}
          onClose={() => setShowGoogleConsent(false)}
          onOpenPrivacy={onOpenPrivacy}
        />
      )}
    </div>
  );
}
