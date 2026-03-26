import { useRef, useEffect } from 'react';
import { useState } from 'react';
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

// ── バブルサイズ ──
function getBubbleSize(count: number): number {
  if (count <= 10) return 70;
  if (count <= 20) return 55;
  return 40;
}

function getBottleColumns(size: number): number {
  if (size >= 70) return 3;
  if (size >= 55) return 4;
  return 5;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (Math.sin(hash) + 1) / 2;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [jarHeight, setJarHeight] = useState(320);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

  const bubbleMap = new Map(allBubbles.map((b) => [b.id, b]));

  const items = dayData.doneItems;
  const count = items.length;
  const bubbleSize = getBubbleSize(count);
  const columns = getBottleColumns(bubbleSize);
  const stepY = Math.round(bubbleSize * 0.66);
  const stepX = columns === 1 ? 0 : 62 / (columns - 1);
  const bottomPad = 60;
  const contentHeight = count > 0
    ? bottomPad + Math.max(0, Math.ceil(count / columns) - 1) * stepY + bubbleSize + 60
    : 0;

  const textSize = bubbleSize >= 70 ? '11px' : bubbleSize >= 55 ? '9px' : '8px';

  // 瓶の高さ: 利用可能スペースの95% vs コンテンツ高さ の大きいほう
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper) {
      const available = wrapper.offsetHeight;
      const minH = Math.max(contentHeight, Math.floor(available * 0.95));
      setJarHeight(Math.max(280, minH));
    }
  }, [contentHeight]);

  // バブルエリアを下端にスクロール
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
        <div className="day-panel-scroll" ref={scrollRef}>
          {count === 0 ? (
            <div className="day-cylinder-stage day-cylinder-stage--empty" aria-hidden="true">
              <div className="day-jar" style={{ height: `${jarHeight}px` }}>
                <div className="day-jar-glass" />
                <div className="day-jar-liquid" />
                <div className="day-cylinder-empty">
                  <p>まだ何も浮かんでいない日です。</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="day-cylinder-stage">
              <div className="day-jar" style={{ height: `${jarHeight}px` }}>
                {/* バブル（ガラス装飾の下に配置、先にレンダリング） */}
                <div className="day-jar-bubbles">
                  {items.map((item, i) => {
                    const row = Math.floor(i / columns);
                    const lane = i % columns;
                    const rowOffset = row % 2 === 0 ? 0 : stepX / 2;
                    const baseLeft = 50 - 31;
                    const leftPercent = Math.max(
                      18,
                      Math.min(
                        82,
                        baseLeft + rowOffset + lane * stepX + (seededRandom(`${item.bubbleId}:x`) - 0.5) * 4,
                      ),
                    );
                    const bottomPx = bottomPad + row * stepY;
                    const bubble = bubbleMap.get(item.bubbleId);
                    const bubbleStyle = bubble ? getBubbleColorStyle(bubble.color) : {};

                    return (
                      <div
                        key={item.bubbleId}
                        className="day-jar-bubble-pos"
                        style={{
                          bottom: `${bottomPx}px`,
                          left: `${leftPercent}%`,
                          width: `${bubbleSize}px`,
                          height: `${bubbleSize}px`,
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
                            className="day-bubble"
                            style={{
                              width: `${bubbleSize}px`,
                              height: `${bubbleSize}px`,
                              ...bubbleStyle,
                            } as React.CSSProperties}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBubbleId(item.bubbleId);
                            }}
                            aria-label={`${item.text} の詳細を見る`}
                          >
                            <span
                              className="day-bubble-text"
                              style={{ fontSize: textSize }}
                            >
                              {item.text}
                            </span>
                          </button>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
                {/* ガラスの光沢（バブルの上に重ねる） */}
                <div className="day-jar-glass" />
                <div className="day-jar-liquid" />
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
