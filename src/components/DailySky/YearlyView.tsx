import { useMemo, useState, useRef } from 'react';
import type { Bubble, BubbleLog } from '../../types/bubble';
import './YearlyView.css';

interface YearlyViewProps {
  bubbles: Bubble[];
  logs: BubbleLog[];
  year: number;
  onRemove?: (id: string) => void;
  showHint?: boolean;
}

// 泡ごとに各月に done ログがあるかを返す（0=1月, 11=12月）
function buildMonthlyMap(logs: BubbleLog[], year: number): Record<string, boolean[]> {
  const map: Record<string, boolean[]> = {};
  for (const log of logs) {
    if (log.type === 'done' && log.date.startsWith(`${year}-`)) {
      const monthIdx = parseInt(log.date.slice(5, 7), 10) - 1;
      if (!map[log.bubbleId]) map[log.bubbleId] = Array(12).fill(false);
      map[log.bubbleId][monthIdx] = true;
    }
  }
  return map;
}

const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

export default function YearlyView({ bubbles, logs, year, onRemove, showHint = false }: YearlyViewProps) {
  const currentMonth = new Date().getMonth(); // 0-indexed
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const touchRef = useRef<{ startX: number; id: string } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchRef.current = { startX: e.touches[0].clientX, id };
  };

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    if (!touchRef.current || touchRef.current.id !== id) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    touchRef.current = null;
    if (dx < -40) setSwipeId(id);
    else if (dx > 10) setSwipeId(null);
  };

  const monthlyMap = buildMonthlyMap(logs, year);
  const hintBubbleId = useMemo(() => {
    let bestId: string | null = null;
    let bestScore = -1;

    for (const bubble of bubbles) {
      const months = monthlyMap[bubble.id] ?? Array(12).fill(false);
      const score = months.filter(Boolean).length;
      if (score > bestScore) {
        bestScore = score;
        bestId = bubble.id;
      }
    }

    return bestId;
  }, [bubbles, monthlyMap]);

  // 並び順: nearby → floating → completed、同グループ内は createdAt 新しい順
  const sortedBubbles = [...bubbles].sort((a, b) => {
    const order = { nearby: 0, floating: 1, completed: 2 };
    const diff = order[a.status] - order[b.status];
    if (diff !== 0) return diff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  if (sortedBubbles.length === 0) {
    return (
      <div className="ym-empty">
        <p>まだシャボン玉がありません。</p>
      </div>
    );
  }

  return (
    <div className="ym-wrap">
      <div className="ym-year-label">{year}年</div>

      {showHint && (
        <div className="ym-hint-overlay" aria-hidden="true">
          <div className="ym-hint-text">星をタップすると内容が見られます</div>
        </div>
      )}

      <div
        className="ym-scroll"
        onClick={() => {
          setSwipeId(null);
          setActiveDeleteId(null);
        }}
      >
        <table className="ym-table">
          <thead>
            <tr>
              <th className="ym-th ym-th-name" />
              {MONTH_LABELS.map((label, i) => (
                <th key={i} className="ym-th ym-th-month">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBubbles.map((bubble) => {
              const doneMonths = monthlyMap[bubble.id] ?? Array(12).fill(false);
              const isSwiped = swipeId === bubble.id;

              return (
                <tr key={bubble.id} className="ym-row">
                  <td
                    className="ym-td ym-td-name"
                    onTouchStart={onRemove ? (e) => handleTouchStart(e, bubble.id) : undefined}
                    onTouchEnd={onRemove ? (e) => handleTouchEnd(e, bubble.id) : undefined}
                  >
                    <div className={`ym-name-cell-inner ${isSwiped ? 'ym-name-cell-inner--swiped' : ''}`}>
                      <button
                        type="button"
                        className={`ym-bubble-text-button ${showHint && bubble.id === hintBubbleId ? 'ym-bubble-text-button--hint' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!onRemove) return;
                          setActiveDeleteId((current) => (current === bubble.id ? null : bubble.id));
                        }}
                        aria-label={`${bubble.text} の操作`}
                      >
                        <span className="ym-bubble-text">{bubble.text}</span>
                      </button>
                      {onRemove && activeDeleteId === bubble.id && (
                        <button
                          type="button"
                          className="ym-delete-reveal-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(bubble.id);
                          }}
                          aria-label="この泡を消す"
                        >
                          消す
                        </button>
                      )}
                    </div>
                  </td>
                  {MONTH_LABELS.map((_, i) => {
                    const isFuture = i > currentMonth;
                    const hasDone = doneMonths[i] ?? false;
                    return (
                      <td key={i} className="ym-td ym-td-dot">
                        {!isFuture && (
                          <div
                            className={`ym-dot ${hasDone ? 'ym-dot--active' : ''}`}
                            aria-label={hasDone ? 'できた' : ''}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 削除確認ダイアログ */}
      {confirmDeleteId && (
        <div className="ym-confirm-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="ym-confirm-card" onClick={(e) => e.stopPropagation()}>
            <p className="ym-confirm-text">
              このシャボン玉を消しますか？この操作は元に戻せません。
            </p>
            <div className="ym-confirm-btns">
              <button className="ym-confirm-cancel" onClick={() => setConfirmDeleteId(null)}>
                やめる
              </button>
              <button
                className="ym-confirm-ok"
                onClick={() => {
                  onRemove?.(confirmDeleteId);
                  setConfirmDeleteId(null);
                  setSwipeId(null);
                  setActiveDeleteId(null);
                }}
              >
                消す
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
