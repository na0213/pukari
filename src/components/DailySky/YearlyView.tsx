import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const closeDetail = () => {
    setSelectedBubbleId(null);
    setConfirmDelete(false);
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
  const selectedBubble = useMemo(
    () => sortedBubbles.find((bubble) => bubble.id === selectedBubbleId) ?? null,
    [selectedBubbleId, sortedBubbles],
  );

  if (sortedBubbles.length === 0) {
    return (
      <div className="ym-empty">
        <p>まだありません🫧</p>
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
      >
        <table className="ym-table">
          <thead>
            <tr>
              <th className="ym-th ym-th-name" />
              {MONTH_LABELS.map((label, i) => (
                <th key={i} className={`ym-th ym-th-month${i === currentMonth ? ' ym-th-month--current' : ''}`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBubbles.map((bubble) => {
              const doneMonths = monthlyMap[bubble.id] ?? Array(12).fill(false);

              return (
                <tr key={bubble.id} className="ym-row">
                  <td className="ym-td ym-td-name">
                    <button
                      type="button"
                      className={`ym-bubble-text-button ${showHint && bubble.id === hintBubbleId ? 'ym-bubble-text-button--hint' : ''}`}
                      onClick={() => setSelectedBubbleId(bubble.id)}
                      aria-label={`${bubble.text} の全文を見る`}
                    >
                      <span className="ym-bubble-text">{bubble.text}</span>
                    </button>
                  </td>
                  {MONTH_LABELS.map((_, i) => {
                    const isFuture = i > currentMonth;
                    const hasDone = doneMonths[i] ?? false;
                    return (
                      <td key={i} className={`ym-td ym-td-dot${i === currentMonth ? ' ym-td-dot--current-col' : ''}`}>
                        <div
                          className={`ym-dot${hasDone ? ' ym-dot--active' : isFuture ? ' ym-dot--future' : ''}`}
                          aria-label={hasDone ? 'できた' : ''}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedBubble && (
          <motion.div
            className="ym-detail-overlay"
            onClick={closeDetail}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="ym-detail-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <p className="ym-detail-text">
                {selectedBubble.text}
              </p>
              {onRemove && (
                <AnimatePresence mode="wait">
                  {confirmDelete ? (
                    <motion.div
                      key="confirm"
                      className="ym-detail-confirm"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="ym-detail-confirm-label">本当に消しますか？</span>
                      <div className="ym-detail-confirm-actions">
                        <button
                          type="button"
                          className="ym-detail-cancel"
                          onClick={() => setConfirmDelete(false)}
                        >
                          やっぱりやめる
                        </button>
                        <button
                          type="button"
                          className="ym-detail-delete"
                          onClick={() => {
                            onRemove(selectedBubble.id);
                            closeDetail();
                          }}
                        >
                          消す
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="action"
                      className="ym-detail-actions"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <button
                        type="button"
                        className="ym-detail-delete"
                        onClick={() => setConfirmDelete(true)}
                      >
                        消す
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
