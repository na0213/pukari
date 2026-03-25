import { useRef, useEffect } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Bubble, BubbleLog } from '../../types/bubble';
import { useDailySky } from '../../hooks/useDailySky';
import type { DailySkyDetail } from '../../hooks/useDailySky';
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

// ── できた数テキスト ──
function getCountText(count: number): string {
  if (count === 0) return 'まだ何もなくても、大丈夫。';
  return `${count}つ、できた`;
}

// ── バブルサイズ ──
function getBubbleSize(count: number): number {
  if (count <= 10) return 70;
  if (count <= 20) return 55;
  return 40;
}

// ── 1日分のスライド ──
interface DaySlideProps {
  dayData: DailySkyDetail;
  direction: number;
  dayIndex: number;
  totalDays: number;
  onGoNewer: () => void;
  onGoOlder: () => void;
}

function DaySlide({
  dayData, direction,
  dayIndex, totalDays,
  onGoNewer, onGoOlder,
}: DaySlideProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const items = dayData.doneItems;
  const count = items.length;
  const bubbleSize = getBubbleSize(count);
  const step = Math.round(bubbleSize * 0.85);
  const bottomPad = 40;
  const totalStackHeight = count > 0
    ? bottomPad + (count - 1) * step + bubbleSize + 32
    : 0;

  const textSize = bubbleSize >= 70 ? '11px' : bubbleSize >= 55 ? '9px' : '8px';

  // バブルエリアを下端にスクロール（1つ目のバブルが画面下部に来るように）
  useEffect(() => {
    const el = scrollRef.current;
    if (el && count > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [dayData.date, count]);

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
          <p className="day-panel-count">{getCountText(count)}</p>
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
      <div className="day-panel-scroll-wrapper">
        <div className="day-panel-scroll" ref={scrollRef}>
          {count === 0 ? (
            <div className="day-panel-empty" aria-hidden="true" />
          ) : (
            <div
              className="day-panel-inner"
              style={{ minHeight: `${totalStackHeight}px` }}
            >
              {items.map((item, i) => {
                const leftPercent = 50 + Math.sin(i * 1.9) * 24;
                const bottomPx = bottomPad + i * step;

                return (
                  <div
                    key={item.bubbleId}
                    style={{
                      position: 'absolute',
                      bottom: `${bottomPx}px`,
                      left: `${leftPercent}%`,
                      transform: 'translateX(-50%)',
                      width: `${bubbleSize}px`,
                      height: `${bubbleSize}px`,
                    }}
                  >
                    <motion.div
                      initial={prefersReduced ? false : { opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={prefersReduced
                        ? { duration: 0 }
                        : { delay: i * 0.1, duration: 0.5, ease: 'easeOut' }
                      }
                      style={{ width: '100%', height: '100%' }}
                    >
                      <div
                        className="day-bubble"
                        style={{
                          width: `${bubbleSize}px`,
                          height: `${bubbleSize}px`,
                          '--float-delay': `${(i * 0.3) % 3}s`,
                        } as React.CSSProperties}
                      >
                        <span
                          className="day-bubble-text"
                          style={{ fontSize: textSize }}
                        >
                          {item.text}
                        </span>
                        {item.isCompleted && (
                          <span className="day-bubble-check" aria-label="完了">
                            ✓
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
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

  const currentYear = new Date().getFullYear();

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
          <YearlyView bubbles={bubbles} logs={logs} year={currentYear} onRemove={onRemove} />
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
