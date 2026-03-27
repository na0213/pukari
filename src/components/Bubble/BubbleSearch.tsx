import { motion, AnimatePresence } from 'framer-motion';
import type { Bubble } from '../../types/bubble';
import './BubbleSearch.css';

interface BubbleSearchProps {
  bubbles: Bubble[];              // activeBubbles（空に見えている泡のみ）
  onSelect: (id: string) => void;
  onClose: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
  });
}

export default function BubbleSearch({ bubbles, onSelect, onClose }: BubbleSearchProps) {
  // 「今日やる」を先頭、その中で作成日が新しい順
  const sorted = [...bubbles].sort((a, b) => {
    const statusDiff = Number(b.status === 'nearby') - Number(a.status === 'nearby');
    if (statusDiff !== 0) return statusDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <AnimatePresence>
      <>
        {/* 背後のオーバーレイ（タップで閉じる） */}
        <motion.div
          className="bubble-search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 検索パネル */}
        <motion.div
          className="bubble-search-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          aria-modal="true"
          role="dialog"
          aria-label="泡を探す"
        >
          <div className="bubble-search-handle" aria-hidden="true" />
          <p className="bubble-search-title">泡を探す</p>

          <div className="bubble-search-list" role="listbox">
            {sorted.length === 0 ? (
              <p className="bubble-search-empty">泡がありません</p>
            ) : (
              sorted.map((bubble) => (
                <button
                  key={bubble.id}
                  className="bubble-search-item"
                  onClick={() => { onSelect(bubble.id); onClose(); }}
                  role="option"
                  aria-selected={false}
                >
                  <span className="bubble-search-item-text">{bubble.text}</span>
                  <span className="bubble-search-item-meta">
                    {bubble.status === 'nearby' && (
                      <span className="bubble-search-keep-mark">◎</span>
                    )}
                    {formatDate(bubble.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
