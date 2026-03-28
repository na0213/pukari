import { useState, useRef } from 'react';
import type { UseAuthReturn } from '../../hooks/useAuth';
import GoogleConsentModal from './GoogleConsentModal';
import './WelcomeScreen.css';

// Google ブランドアイコン
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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



// ── スクリーンショットスライド ──
const SLIDES = [
  {
    src: '/images/welcome-slide-1.png',
    alt: 'Pukari - 思いつきを泡に浮かべる画面',
    label: 'TOP',
    sub: '泡に浮かべる',
    placeholderBg: 'linear-gradient(180deg, rgba(222,240,252,0.95) 0%, rgba(200,226,246,0.95) 100%)',
    labelColor: 'rgba(62,81,107,0.66)',
    subColor: 'rgba(62,81,107,0.46)',
  },
  {
    src: '/images/welcome-slide-2.png',
    alt: 'Pukari - 泡にメモを追加する画面',
    label: 'MEMO',
    sub: '泡にメモ',
    placeholderBg: 'linear-gradient(180deg, rgba(246,249,255,0.95) 0%, rgba(230,241,252,0.95) 100%)',
    labelColor: 'rgba(62,81,107,0.66)',
    subColor: 'rgba(62,81,107,0.46)',
  },
  {
    src: '/images/welcome-slide-3.png',
    alt: 'Pukari - もくもく集中タイム画面',
    label: 'LAGOON',
    sub: '集中する',
    placeholderBg: 'linear-gradient(180deg, rgba(19,34,76,0.96) 0%, rgba(24,51,110,0.92) 100%)',
    labelColor: 'rgba(216,236,255,0.72)',
    subColor: 'rgba(216,236,255,0.50)',
  },
] as const;

const FEATURE_ITEMS = [
  {
    title: '思いつきを浮かべる',
    text: 'アイデアもタスクも、まずは浮かべる',
    imgSrc: '/images/welcome-feature-1.png',
  },
  {
    title: 'メモを追加する',
    text: '追記したいことはメモに。日々やりたいことは繰り返しに。カスタマイズはさまざま。',
    imgSrc: '/images/welcome-feature-2.png',
  },
  {
    title: 'ゆるく記録して振り返る',
    text: 'できた！を押すたび、空色が変わる。今日のできたことは、空に星となって浮かびます。',
    imgSrc: '/images/welcome-feature-4.png',
  },
  {
    title: 'みんなともくもくタイムへ',
    text: '集中できそうなときは、集中できる空間へ。他の人も浮かんでいるかも',
    imgSrc: '/images/welcome-feature-5.png',
  },
  {
    title: 'サウンドも選べる',
    text: '集中しているときは、気分に合わせて、音と空気感を切り替えられます。',
    imgSrc: '/images/welcome-feature-6.png',
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
  onOpenTerms: () => void;
  onClose?: () => void;
}

export default function WelcomeScreen({ auth, onOpenPrivacy, onOpenTerms, onClose }: WelcomeScreenProps) {
  const [logoError, setLogoError] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [showGoogleConsent, setShowGoogleConsent] = useState(false);
  const [selectedFeatureImage, setSelectedFeatureImage] = useState<{ src: string; alt: string; title: string } | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const currentSlide = SLIDES[slideIndex];



  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setSlideIndex((i) => Math.min(i + 1, SLIDES.length - 1));
      else setSlideIndex((i) => Math.max(i - 1, 0));
    }
    touchStartX.current = null;
  };

  const handleGuest = async () => {
    setIsGuestLoading(true);
    await auth.signInAnonymously();
    setIsGuestLoading(false);
  };

  const isBusy = isGuestLoading;

  return (
    <div className="welcome-screen">
      {onClose && (
        <button
          className="welcome-close-btn"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
      )}
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

            <p className="welcome-tagline">頭の中のごちゃごちゃ、ぜんぶ浮かべる</p>
            <h1 className="welcome-title">アイデアもTodoも。<br />泡に浮かべるだけの<br />メモアプリ</h1>
            <p className="welcome-lead">
              思いついたことを、気軽に泡にして浮かべるだけ。<br />
              できたことは「できた！」で記録すると、空の色が少しずつ変わる。<br />
              1年後、意外とやってた自分に気づける。
            </p>

            <div className="welcome-hero-stats" aria-label="できること">
              <span>思いついたことを泡に</span>
              <span>できたことを記録</span>
              <span>集中できる場所</span>
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
            {/* ── スクリーンショットスライダー ── */}
            <div className="welcome-slide-wrapper">
              {/* 前へ矢印 */}
              <button
                type="button"
                className="welcome-slide-arrow welcome-slide-arrow--prev"
                onClick={() => setSlideIndex((i) => Math.max(i - 1, 0))}
                disabled={slideIndex === 0}
                aria-label="前のスライドへ"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div
                className="welcome-slide-viewer"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-label="Pukariの画面スライドショー"
              >
                <div
                  className="welcome-slide-track"
                  style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                >
                  {SLIDES.map((slide, i) => (
                    <div key={i} className="welcome-slide-item" aria-hidden={i !== slideIndex}>
                      {/* 画像がない間のプレースホルダー */}
                      <div
                        className="welcome-slide-placeholder"
                        style={{ background: slide.placeholderBg }}
                        aria-hidden="true"
                      >
                        <span className="welcome-slide-placeholder-label" style={{ color: slide.labelColor }}>
                          {slide.label}
                        </span>
                        <span className="welcome-slide-placeholder-sub" style={{ color: slide.subColor }}>
                          {slide.sub}
                        </span>
                      </div>
                      {/* 実際の画像（存在する場合にプレースホルダーを覆う） */}
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        className="welcome-slide-img"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 次へ矢印 */}
              <button
                type="button"
                className="welcome-slide-arrow welcome-slide-arrow--next"
                onClick={() => setSlideIndex((i) => Math.min(i + 1, SLIDES.length - 1))}
                disabled={slideIndex === SLIDES.length - 1}
                aria-label="次のスライドへ"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* スライドコメント */}
            <div className="welcome-slide-caption" aria-live="polite">
              <span className="welcome-slide-caption-label">{currentSlide.sub}</span>
            </div>
          </div>
        </section>

        <section className="welcome-story">
          <div className="welcome-story-head">
            <span className="welcome-story-kicker">できること</span>
            <h2 className="welcome-story-title">Pukariで、こんなふうに使えます。</h2>
          </div>

          <ul className="welcome-feature-list">
            {FEATURE_ITEMS.map((item) => (
              <li key={item.title} className="welcome-feature-list-item">
                <button
                  type="button"
                  className="welcome-feature-card"
                  onClick={() =>
                    setSelectedFeatureImage({
                      src: item.imgSrc,
                      alt: `${item.title}の全体画像`,
                      title: item.title,
                    })
                  }
                  aria-label={`${item.title}の全体画像を見る`}
                >
                  <div className="welcome-feature-card-img-wrap">
                    <img
                      src={item.imgSrc}
                      alt={`${item.title}の画面イメージ`}
                      className="welcome-feature-img"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      draggable={false}
                    />
                  </div>
                  <div className="welcome-feature-card-body">
                    <div className="welcome-feature-card-header">
                      <p className="welcome-feature-title">{item.title}</p>
                    </div>
                    <p className="welcome-feature-text">{item.text}</p>
                  </div>
                </button>
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

          <div className="welcome-background">
            <div className="welcome-background-head">
              <span className="welcome-story-kicker">開発した背景</span>
              <h3 className="welcome-background-title">Pukariは、こんな気持ちから生まれました</h3>
            </div>

            <div className="welcome-background-body">
              <p>
                スケジュール管理、Todo、習慣化、ジャーナリング…<br />
                どれも試したけど、結局続かなかった私。
              </p>
              <p>
                手帳は1月で真っ白、<br />
                ジャーナリングは3ページで終了、<br />
                Todoはどれも数日で消える。<br />
                思いついたことをメモしても散らばって、いつの間にか見失う。<br />
                年末になると「今年、私は何をしたんだっけ…」と虚しくなる。
              </p>
              <p>
                そんなとき、<br />
                「なんでもいいから、まずは浮かべておこう」<br />
                と思える場所が欲しくなりました。
              </p>
              <p>
                アイデアでも、タスクでも、目標でも。<br />
                時間に追われず、やりたいと思ったときにゆるく振り返れて、<br />
                集中したいときはちゃんと集中できる。<br />
                そしてあとで「今年も意外とやってたな」と微笑める。
              </p>
              <p>
                そんな、<br />
                がんばらなくても続けられるアプリがほしくて作りました。<br />
                Pukariが、頭の中のごちゃごちゃを<br />
                優しく、泡のように包めますように。
              </p>
              <div className="welcome-background-author">
                <p className="welcome-background-author-text">
                  開発者：Natomi
                </p>
                <img
                  src="/images/natomi.png"
                  alt=""
                  aria-hidden="true"
                  className="welcome-background-author-icon"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="welcome-privacy-link"
            onClick={onOpenPrivacy}
          >
            プライバシーポリシーを見る
          </button>

          <button
            type="button"
            className="welcome-privacy-link"
            onClick={onOpenTerms}
          >
            利用規約を見る
          </button>
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

      {selectedFeatureImage && (
        <div
          className="welcome-image-modal"
          onClick={() => setSelectedFeatureImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedFeatureImage.title}
        >
          <div
            className="welcome-image-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="welcome-image-modal-close"
              onClick={() => setSelectedFeatureImage(null)}
              aria-label="閉じる"
            >
              ×
            </button>
            <img
              src={selectedFeatureImage.src}
              alt={selectedFeatureImage.alt}
              className="welcome-image-modal-img"
              draggable={false}
            />
            <p className="welcome-image-modal-caption">
              {selectedFeatureImage.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
