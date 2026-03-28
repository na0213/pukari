import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import type { UseLagoonReturn } from '../../hooks/useLagoon';
import type { LagoonBubble } from '../../types/bluelagoon';
import { LAGOON_SOUND_CONFIG } from '../../lib/constants';
import LagoonBubbleItem from './LagoonBubbleItem';
import SoundPicker from './SoundPicker';
import LagoonTimer, { TimerIcon } from './LagoonTimer';
import './BlueLagoonView.css';

function SoundIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h3l4-4v8l-4-4H4z" />
      <path d="M14 9c1.7 1.7 1.7 4.3 0 6" />
      <path d="M17 7c3 3 3 7 0 10" />
    </svg>
  );
}

function ExitIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4" />
      <path d="M10 9l-4 3 4 3" />
      <path d="M6 12h10" />
    </svg>
  );
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

// ── 参加人数に応じたキャンバスパラメータ ──
function getCanvasParams(count: number): {
  widthCss: string;
  ownSize: number;
  otherSize: number;
  canvasWidthFactor: number;
} {
  if (count <= 10)  return { widthCss: '100vw',  ownSize: 100, otherSize: 80, canvasWidthFactor: 1 };
  if (count <= 30)  return { widthCss: '200vw',  ownSize: 80,  otherSize: 60, canvasWidthFactor: 2 };
  if (count <= 60)  return { widthCss: '300vw',  ownSize: 60,  otherSize: 45, canvasWidthFactor: 3 };
  return             { widthCss: '400vw',  ownSize: 50,  otherSize: 35, canvasWidthFactor: 4 };
}

interface BlueLagoonViewProps {
  lagoon: UseLagoonReturn;
  onMarkBubbleDone: (id: string) => void;
  onMarkBubbleDoneToday: (id: string) => void;
}

export default function BlueLagoonView({ lagoon, onMarkBubbleDone, onMarkBubbleDoneToday }: BlueLagoonViewProps) {
  const {
    myBubble, otherBubbles, participantCount,
    sound, entryBubbleId, entryBubbleText,
    setSound, volume, setVolume, exitLagoon,
  } = lagoon;

  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  // 集中時間の蔗積（複数セッションをまたいで蜕積）
  const [baseFocusSec, setBaseFocusSec] = useState(0);    // 過去のセッションの経過秒合計
  const [sessionSec, setSessionSec] = useState(0);        // 今のセッションの経過秒
  const MAX_FOCUS_SEC = 60 * 60;                          // 60分で最大
  const focusGlow = Math.min(1, (baseFocusSec + sessionSec) / MAX_FOCUS_SEC);
  const [selectedBubble, setSelectedBubble] = useState<LagoonBubble | null>(null);
  const [showExitChoices, setShowExitChoices] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const [showBubbles, setShowBubbles] = useState(prefersReducedMotion);
  const scrollWrapperRef = useRef<HTMLDivElement | null>(null);
  const prevOtherCountRef = useRef(0);

  // sound から背景設定を取得
  const config = LAGOON_SOUND_CONFIG[sound];

  const displayBubbles = otherBubbles;

  // 星を増やして、CSSだけで奥行きを作る
  const stars = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      top: `${5 + seededRandom(i + 1) * 40}%`,
      left: `${5 + seededRandom(i + 11) * 90}%`,
      duration: `${2 + seededRandom(i + 21) * 4}s`,
      delay: `${seededRandom(i + 31) * 3}s`,
      size: `${2 + seededRandom(i + 41) * 2}px`,
    })),
  []);

  const buttonColor = {
    sound: sound === 'none' ? '#C7D7E8' : '#9FD4F0',
    exit: '#B8CDE6',
  };

  const canvasParams = getCanvasParams(participantCount);
  const isScrollable = canvasParams.canvasWidthFactor > 1;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const update = () => setIsCompact(mediaQuery.matches);
    update();

    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = window.setTimeout(() => {
      setShowBubbles(true);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const wrapper = scrollWrapperRef.current;
    const hasOverflow = canvasParams.canvasWidthFactor > 1;
    const grew = otherBubbles.length > prevOtherCountRef.current;
    prevOtherCountRef.current = otherBubbles.length;

    if (!wrapper || !isCompact || !hasOverflow || !grew) return;

    const maxScrollLeft = wrapper.scrollWidth - wrapper.clientWidth;
    if (maxScrollLeft <= 0) return;

    wrapper.scrollTo({
      left: Math.round(maxScrollLeft * 0.35),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [otherBubbles.length, canvasParams.canvasWidthFactor, isCompact, prefersReducedMotion]);

  return (
    <div
      className="lagoon-container"
      style={{ background: config.fallbackGradient }}
      aria-label="ブルーラグーン"
    >

      {/* 固定: オーロラ・水面（スクロール外） */}
      <div className="lagoon-aurora-glow" aria-hidden="true" />
      <div className="lagoon-aurora-glow-2" aria-hidden="true" />
      <div className="lagoon-aurora-glow-3" aria-hidden="true" />
      <div className="lagoon-water-shimmer" aria-hidden="true" />

      {/* 横スクロールコンテナ */}
      <div
        className="lagoon-scroll-wrapper"
        ref={scrollWrapperRef}
      >
        <div
          className="lagoon-scroll-canvas"
          style={{ width: canvasParams.widthCss }}
        >

          {/* レイヤー4: 星のキラキラ */}
          <div aria-hidden="true">
            {stars.map((star) => (
              <div
                key={star.id}
                className="lagoon-star"
                style={{
                  top: star.top,
                  left: star.left,
                  width: star.size,
                  height: star.size,
                  '--twinkle-duration': star.duration,
                  '--twinkle-delay': star.delay,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* レイヤー5: シャボン玉 */}
          {showBubbles && (
            <>
              {myBubble && (
                <LagoonBubbleItem
                  bubble={myBubble}
                  isOwn={true}
                  compact={isCompact}
                  appear
                  delay={0}
                  ownSize={canvasParams.ownSize}
                  otherSize={canvasParams.otherSize}
                  canvasWidthFactor={canvasParams.canvasWidthFactor}
                  focusGlow={focusGlow}
                  onClick={() => setSelectedBubble(myBubble)}
                />
              )}
              <AnimatePresence>
                {displayBubbles.map((bubble, index) => (
                  <LagoonBubbleItem
                    key={bubble.id}
                    bubble={bubble}
                    isOwn={false}
                    compact={isCompact}
                    appear
                    delay={0.02 + index * 0.025}
                    ownSize={canvasParams.ownSize}
                    otherSize={canvasParams.otherSize}
                    canvasWidthFactor={canvasParams.canvasWidthFactor}
                    onClick={() => setSelectedBubble(bubble)}
                  />
                ))}
              </AnimatePresence>
            </>
          )}

        </div>{/* /lagoon-scroll-canvas */}
      </div>{/* /lagoon-scroll-wrapper */}

      {/* 右端フェードアウト（スクロール可能なとき） */}
      {isScrollable && (
        <div className="lagoon-scroll-hint" aria-hidden="true" />
      )}

      {/* 固定UI: 参加人数バッジ */}
      <div className="lagoon-participants" aria-live="polite">
        <span className="lagoon-participants-dot" aria-hidden="true" />
        {participantCount}人がもくもく中
      </div>

      {/* 固定UI: 下部コントロール */}
      <div className="lagoon-controls">
        <button
          className="lagoon-ctrl-btn"
          onClick={() => {
            setShowSoundPicker((prev) => !prev);
          }}
          aria-label="サウンド設定"
        >
          <SoundIcon color={buttonColor.sound} />
          <span>サウンド</span>
        </button>

        <button
          className={`lagoon-ctrl-btn ${showTimer ? 'lagoon-ctrl-btn--timer-active' : ''}`}
          onClick={() => {
            setShowTimer((prev) => !prev);
            setShowSoundPicker(false);
          }}
          aria-label="タイマー設定"
        >
          <TimerIcon color={showTimer ? '#7ee8fa' : '#B8CDE6'} />
          <span>タイマー</span>
        </button>

        <button
          className="lagoon-ctrl-btn lagoon-ctrl-btn--exit"
          onClick={() => {
            if (entryBubbleId) {
              setShowExitChoices(true);
              return;
            }
            void exitLagoon();
          }}
          aria-label="ブルーラグーンを退出する"
        >
          <ExitIcon color={buttonColor.exit} />
          <span>退出する</span>
        </button>
      </div>

      {/* サウンドピッカー */}
      {showSoundPicker && (
        <SoundPicker
          current={sound}
          volume={volume}
          onChange={(s) => {
            setSound(s);
          }}
          onVolumeChange={setVolume}
          onClose={() => setShowSoundPicker(false)}
        />
      )}

      {/* タイマー */}
      {showTimer && (
        <LagoonTimer
          onClose={() => {
            // 退出時に今のセッションを蜕積に込む
            setBaseFocusSec((prev) => Math.min(MAX_FOCUS_SEC, prev + sessionSec));
            setSessionSec(0);
            setShowTimer(false);
          }}
          onElapsedSeconds={(secs) => setSessionSec(secs)}
        />
      )}

      {selectedBubble && (
        <div
          className="lagoon-comment-overlay"
          onClick={() => setSelectedBubble(null)}
        >
          <div
            className="lagoon-comment-card"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="lagoon-comment-label">コメント</p>
            <p className="lagoon-comment-text">{selectedBubble.message}</p>
            <button
              type="button"
              className="lagoon-comment-close"
              onClick={() => setSelectedBubble(null)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {showExitChoices && entryBubbleId && (
        <div className="lagoon-comment-overlay" onClick={() => setShowExitChoices(false)}>
          <div className="lagoon-comment-card" onClick={(e) => e.stopPropagation()}>
            <p className="lagoon-comment-label">おつかれさま！</p>
            <p className="lagoon-comment-text">{entryBubbleText ?? ''}</p>
            <button
              type="button"
              className="lagoon-comment-close"
              onClick={() => {
                onMarkBubbleDone(entryBubbleId);
                setShowExitChoices(false);
                void exitLagoon();
              }}
            >
              できた！
            </button>
            <button
              type="button"
              className="lagoon-comment-close"
              onClick={() => {
                onMarkBubbleDoneToday(entryBubbleId);
                setShowExitChoices(false);
                void exitLagoon();
              }}
            >
              今日はここまで
            </button>
            <button
              type="button"
              className="lagoon-comment-close"
              onClick={() => setShowExitChoices(false)}
            >
              戻る
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
