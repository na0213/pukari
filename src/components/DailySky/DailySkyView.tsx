import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Bubble, BubbleLog } from '../../types/bubble';
import { useDailySky } from '../../hooks/useDailySky';
import type { DailySkyDetail } from '../../hooks/useDailySky';
import { getBubbleColorStyle } from '../../lib/bubbleColors';
import YearlyView from './YearlyView';
import './DailySkyView.css';

// ── 日付フォーマット: 「3月24日（月）」──
function formatDateDisplay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00+09:00`);
  const monthDay = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
  }).format(date);
  const weekday = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
  }).format(date);
  return `${monthDay}（${weekday}）`;
}

interface BackgroundStar {
  id: number;
  left: number;
  top: number;
  size: number;
  opacity: number;
}

function generateBackgroundStars(): BackgroundStar[] {
  const count = 60;
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: 5 + Math.random() * 90,
    top: 5 + Math.random() * 90,
    size: 2 + Math.floor(Math.random() * 2),
    opacity: 0.2 + Math.random() * 0.3,
  }));
}

interface PlacedStar {
  bubbleId: string;
  left: number;
  top: number;
  size: number;
  opacity: number;
  twinkleOpacity: number;
  duration: number;
  delay: number;
  glowStrong: string;
  glowSoft: string;
}

function getStarGlowVars(color?: Bubble['color']): React.CSSProperties {
  if (!color) {
    return {
      '--star-glow-strong': 'rgba(255, 206, 89, 0.80)',
      '--star-glow-soft': 'rgba(255, 206, 89, 0.30)',
    } as React.CSSProperties;
  }

  const option = getBubbleColorStyle(color) as React.CSSProperties & {
    '--bubble-color-border'?: string;
    '--bubble-color-glow'?: string;
  };

  return {
    '--star-glow-strong': option['--bubble-color-border'] ?? 'rgba(200, 220, 255, 1)',
    '--star-glow-soft': option['--bubble-color-glow'] ?? 'rgba(200, 220, 255, 0.35)',
  } as React.CSSProperties;
}

function getPlacedStars(items: DailySkyDetail['doneItems'], bubbleMap: Map<string, Bubble>): PlacedStar[] {
  return items.map((item, index) => {
    const bubble = bubbleMap.get(item.bubbleId);
    const recency = items.length <= 1 ? 1 : 1 - index / Math.max(1, items.length - 1);
    const sizeScore = Math.min(1, Math.max(0, recency * 0.72 + Math.random() * 0.28));
    const bucket = sizeScore > 0.66 ? 'large' : sizeScore > 0.33 ? 'medium' : 'small';
    const size = bucket === 'large' ? 8 : bucket === 'medium' ? 6 : 4;
    const opacityBase = bucket === 'large' ? 0.7 : bucket === 'medium' ? 0.55 : 0.4;
    const opacity = opacityBase + Math.random() * (1 - opacityBase);
    const twinkleOpacity = Math.min(1, opacity + 0.2 + Math.random() * 0.2);
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 3;
    const glow = getStarGlowVars(bubble?.color) as React.CSSProperties & {
      '--star-glow-strong'?: string;
      '--star-glow-soft'?: string;
    };

    return {
      bubbleId: item.bubbleId,
      left: 5 + Math.random() * 90,
      top: 5 + Math.random() * 90,
      size,
      opacity,
      twinkleOpacity,
      duration,
      delay,
      glowStrong: glow['--star-glow-strong'] ?? 'rgba(255, 206, 89, 0.80)',
      glowSoft: glow['--star-glow-soft'] ?? 'rgba(255, 206, 89, 0.30)',
    };
  });
}

// ── バブル詳細ポップアップ ──
interface BubblePopupProps {
  bubble: Bubble;
  onClose: () => void;
}

function BubblePopup({ bubble, onClose }: BubblePopupProps) {
  const completedDate = bubble.completedAt
    ? new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(bubble.completedAt))
    : null;

  return (
    <motion.div
      className="day-popup-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="day-popup"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="day-popup-text">{bubble.text}</p>
        {bubble.memo && (
          <p className="day-popup-memo">{bubble.memo}</p>
        )}
        {completedDate && (
          <p className="day-popup-date">できた: {completedDate}</p>
        )}
        <button className="day-popup-close" onClick={onClose}>
          とじる
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── 1日分のスライド ──
interface DaySlideProps {
  dayData: DailySkyDetail;
  bubbles: Bubble[];
  direction: number;
  dayIndex: number;
  totalDays: number;
  onGoNewer: () => void;
  onGoOlder: () => void;
}

function DaySlide({
  dayData, bubbles: allBubbles, direction,
  dayIndex, totalDays,
  onGoNewer, onGoOlder,
}: DaySlideProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [skyHeight, setSkyHeight] = useState(360);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

  const bubbleMap = useMemo(() => new Map(allBubbles.map((b) => [b.id, b])), [allBubbles]);
  const backgroundStars = useMemo(() => generateBackgroundStars(), [dayData.date]);
  const items = dayData.doneItems;
  const count = items.length;
  const placementKey = useMemo(() => items.map((item) => item.bubbleId).join('|'), [items]);
  const placedStars = useMemo(() => getPlacedStars(items, bubbleMap), [bubbleMap, placementKey]);

  // 星空の高さ: 利用可能スペース vs コンテンツ高さ の大きいほう
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper) {
      const available = wrapper.offsetHeight;
      const minH = Math.max(360, Math.floor(available * 0.95));
      setSkyHeight(Math.max(360, minH));
    }
  }, [dayData.date]);

  const slideVariants = {
    enter: { x: direction > 0 ? '100%' : '-100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: direction > 0 ? '-100%' : '100%', opacity: 0 },
  };

  return (
    <motion.div
      className="daily-sky-panel"
      key={dayData.date}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      {/* 日付・できた数ヘッダー（ナビ矢印付き） */}
      <div className="day-panel-header">
        <button
          className="day-nav day-nav--older"
          onClick={onGoOlder}
          disabled={dayIndex >= totalDays - 1}
          aria-label="過去の日へ"
        >
          ‹
        </button>

        <div className="day-panel-header-center">
          <p className="day-panel-date">{formatDateDisplay(dayData.date)}</p>
          <p className="day-panel-note">光る星をタップすると内容が見られます</p>
        </div>

        <button
          className="day-nav day-nav--newer"
          onClick={onGoNewer}
          disabled={dayIndex === 0}
          aria-label="新しい日へ"
        >
          ›
        </button>
      </div>

      {/* シャボン玉エリア */}
      <div className="day-panel-scroll-wrapper" ref={wrapperRef}>
        <div className="day-panel-scroll">
          {count === 0 ? (
            <div className="day-sky-stage day-sky-stage--empty" aria-hidden="true">
              <div className="day-sky-background-stars">
                {backgroundStars.map((star) => (
                  <span
                    key={star.id}
                    className="day-sky-background-star"
                    style={{
                      left: `${star.left}%`,
                      top: `${star.top}%`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      opacity: star.opacity,
                    }}
                  />
                ))}
              </div>
              <div className="day-cylinder-empty">
                <p>まだありません🫧</p>
              </div>
            </div>
          ) : (
            <div className="day-sky-stage" style={{ height: `${skyHeight}px` }}>
              <div className="day-sky-background-stars">
                {backgroundStars.map((star) => (
                  <span
                    key={star.id}
                    className="day-sky-background-star"
                    style={{
                      left: `${star.left}%`,
                      top: `${star.top}%`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      opacity: star.opacity,
                    }}
                    />
                  ))}
              </div>
              <div className="day-sky-stars">
                {placedStars.map((star, i) => {
                  const bubble = bubbleMap.get(star.bubbleId);
                  const starStyle: React.CSSProperties = {
                    ...getStarGlowVars(bubble?.color),
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    '--star-opacity': star.opacity,
                    '--star-peak-opacity': star.twinkleOpacity,
                    '--twinkle-duration': `${star.duration}s`,
                    '--twinkle-delay': `${star.delay}s`,
                    '--star-glow-strong': star.glowStrong,
                    '--star-glow-soft': star.glowSoft,
                  } as React.CSSProperties;

                  return (
                    <div
                      key={star.bubbleId}
                      className="day-sky-star-pos"
                      style={{
                        top: `${star.top}%`,
                        left: `${star.left}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        zIndex: count - i,
                      }}
                    >
                      <motion.div
                        initial={prefersReduced ? false : { opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={prefersReduced
                          ? { duration: 0 }
                          : { delay: i * 0.08, duration: 0.45, ease: 'easeOut' }
                        }
                        style={{ width: '100%', height: '100%' }}
                      >
                        <button
                          type="button"
                          className="day-star"
                          style={starStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBubbleId(star.bubbleId);
                          }}
                          aria-label={`${bubble?.text ?? 'できたこと'} の詳細を見る`}
                        />
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* バブル詳細ポップアップ */}
      <AnimatePresence>
        {selectedBubbleId && bubbleMap.get(selectedBubbleId) && (
          <BubblePopup
            bubble={bubbleMap.get(selectedBubbleId)!}
            onClose={() => setSelectedBubbleId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── メインコンポーネント ──

interface DailySkyViewProps {
  bubbles: Bubble[];
  logs: BubbleLog[];
  onClose: () => void;
  onRemove?: (id: string) => void;
}

type TabType = 'today' | 'year';

export default function DailySkyView({ bubbles, logs, onClose, onRemove }: DailySkyViewProps) {
  const { allDays } = useDailySky(bubbles, logs);

  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [dayIndex, setDayIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showYearHint, setShowYearHint] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (activeTab !== 'year') {
      setShowYearHint(false);
      return;
    }

    try {
      if (localStorage.getItem('starHintShown') === 'true') {
        return;
      }
      localStorage.setItem('starHintShown', 'true');
    } catch {
      return;
    }

    setShowYearHint(true);
    const timer = window.setTimeout(() => {
      setShowYearHint(false);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeTab]);

  const goOlder = () => {
    if (dayIndex < allDays.length - 1) {
      setDirection(1);
      setDayIndex((i) => i + 1);
    }
  };

  const goNewer = () => {
    if (dayIndex > 0) {
      setDirection(-1);
      setDayIndex((i) => i - 1);
    }
  };

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    if (info.offset.x < -50 || info.velocity.x < -400) goNewer();
    else if (info.offset.x > 50 || info.velocity.x > 400) goOlder();
  };

  const currentDay = allDays[dayIndex];

  return (
    <motion.div
      className={`daily-sky-wrapper sky-daily--${currentDay.phase}`}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.3 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 80 || info.velocity.y > 500) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label={activeTab === 'today' ? '今日の空' : '今年できたこと'}
    >
      {/* ── 上部バー（× ボタン + タブ） ── */}
      <div className="daily-sky-top-bar" onClick={(e) => e.stopPropagation()}>
        <button
          className="daily-sky-close-x-top"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
        <div className="daily-sky-tabs">
          <button
            className={`daily-sky-tab ${activeTab === 'today' ? 'daily-sky-tab--active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            今日の空
          </button>
          <button
            className={`daily-sky-tab ${activeTab === 'year' ? 'daily-sky-tab--active' : ''}`}
            onClick={() => setActiveTab('year')}
          >
            今年できたこと
          </button>
        </div>
      </div>

      {/* ── コンテンツエリア ── */}
      <div className="daily-sky-content-area">

        {/* 今日の空タブ */}
        {activeTab === 'today' && (
          <motion.div
            className="daily-sky-today-area"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <DaySlide
                key={currentDay.date}
                dayData={currentDay}
                bubbles={bubbles}
                direction={direction}
                dayIndex={dayIndex}
                totalDays={allDays.length}
                onGoNewer={goNewer}
                onGoOlder={goOlder}
              />
            </AnimatePresence>
          </motion.div>
        )}

        {/* 今年できたことタブ */}
        {activeTab === 'year' && (
          <YearlyView
            bubbles={bubbles}
            logs={logs}
            year={currentYear}
            onRemove={onRemove}
            showHint={showYearHint}
          />
        )}
      </div>

      {/* ── フッター ── */}
      <div
        className="daily-sky-footer"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="daily-sky-close-btn" onClick={onClose}>
          空に戻る
        </button>
      </div>
    </motion.div>
  );
}
