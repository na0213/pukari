import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Bubble } from '../../types/bubble';
import type { BubbleColorKey } from '../../lib/bubbleColors';
import {
  BUBBLE_COLOR_OPTIONS,
  getBubbleColorOption,
  normalizeBubbleColor,
} from '../../lib/bubbleColors';
import './BubbleDetail.css';

interface BubbleDetailProps {
  bubble: Bubble;
  isDoneToday: boolean;
  onClose: () => void;
  onKeep: (id: string) => void;
  onUnkeep: (id: string) => void;
  onMarkDone: (id: string) => void;
  onMarkDoneToday: (id: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onUpdateColor: (id: string, color: BubbleColorKey | null) => void;
  onRemove?: (id: string) => void;
}

export default function BubbleDetail({
  bubble,
  isDoneToday,
  onClose,
  onKeep,
  onUnkeep,
  onMarkDone,
  onMarkDoneToday,
  onUpdateMemo,
  onUpdateColor,
  onRemove,
}: BubbleDetailProps) {
  const [memo, setMemo] = useState(bubble.memo ?? '');
  const [selectedColor, setSelectedColor] = useState<BubbleColorKey | null>(
    bubble.color ?? null
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setMemo(bubble.memo ?? '');
    setSelectedColor(normalizeBubbleColor(bubble.color) ?? null);
    setConfirmDelete(false);
  }, [bubble.id, bubble.memo, bubble.color]);

  const handleMemoBlur = () => {
    if (memo !== (bubble.memo ?? '')) {
      onUpdateMemo(bubble.id, memo);
    }
  };

  const createdLabel = bubble.createdAt.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const showMainButtons = bubble.status !== 'completed';
  const showKeep = bubble.status === 'floating';
  const showUnkeep = bubble.status === 'nearby';

  return (
    <motion.div
      className="bubble-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={`「${bubble.text}」の詳細`}
    >
      <motion.div
        className="bubble-detail-card"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* ドラッグハンドル */}
        <div className="bubble-detail-handle" aria-hidden="true" />

        {/* 泡のテキスト */}
        <p className="bubble-detail-text">{bubble.text}</p>

        {/* 状態バッジ（キープ中のみ表示） */}
        {bubble.status === 'nearby' && (
          <span className="bubble-detail-status" aria-label="状態: キープ中">
            ◎ キープ中
          </span>
        )}

        {/* メモ欄 */}
        <textarea
          className="bubble-detail-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={handleMemoBlur}
          placeholder="メモを追加..."
          rows={2}
          aria-label="補足メモ"
          maxLength={500}
        />

        {/* カラー選択 */}
        <div className="bubble-detail-color-section" aria-label="シャボン玉のカラー選択">
          <p className="bubble-detail-section-label">カラー</p>
          <div className="bubble-detail-colors" role="radiogroup" aria-label="シャボン玉のカラー">
            <button
              type="button"
              className={[
                'bubble-detail-color',
                'bubble-detail-color--none',
                selectedColor === null ? 'bubble-detail-color--active' : '',
              ].join(' ')}
              onClick={() => {
                setSelectedColor(null);
                onUpdateColor(bubble.id, null);
              }}
              role="radio"
              aria-checked={selectedColor === null}
              aria-label="なし"
            >
              なし
            </button>
            {BUBBLE_COLOR_OPTIONS.map((option) => {
              const active = selectedColor === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={[
                    'bubble-detail-color',
                    active ? 'bubble-detail-color--active' : '',
                  ].join(' ')}
                  style={{ background: option.swatch }}
                  onClick={() => {
                    setSelectedColor(option.key);
                    onUpdateColor(bubble.id, option.key);
                  }}
                  role="radio"
                  aria-checked={active}
                  aria-label={option.label}
                >
                  <span className="bubble-detail-color-dot" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <p className="bubble-detail-color-name">
            {selectedColor ? getBubbleColorOption(selectedColor).label : 'なし'}
          </p>
        </div>

        {/* 作成日 */}
        <p className="bubble-detail-date">{createdLabel} に浮かんだ</p>

        {/* アクション */}
        {showMainButtons && (
          <div className="bubble-detail-actions">
            {/* キープ（floating のみ） */}
            {showKeep && (
              <button
                className="bubble-detail-btn bubble-detail-btn--keep"
                onClick={() => { onKeep(bubble.id); onClose(); }}
              >
                ◎ キープする
              </button>
            )}

            {showUnkeep && (
              <button
                className="bubble-detail-btn bubble-detail-btn--unkeep"
                onClick={() => { onUnkeep(bubble.id); onClose(); }}
              >
                キープをやめる
              </button>
            )}

            {/* 「今日はここまで」と「できた！」を横並び */}
            <div className="bubble-detail-main-row">
              <button
                className={[
                  'bubble-detail-btn--today',
                  isDoneToday ? 'bubble-detail-btn--today-done' : '',
                ].join(' ')}
                onClick={isDoneToday ? undefined : () => onMarkDoneToday(bubble.id)}
                disabled={isDoneToday}
                aria-disabled={isDoneToday}
              >
                {isDoneToday ? '✓ 今日は記録済み' : '今日はここまで'}
              </button>

              <button
                className="bubble-detail-btn bubble-detail-btn--done"
                onClick={() => { onMarkDone(bubble.id); onClose(); }}
              >
                できた！
              </button>
            </div>
          </div>
        )}

        {/* 閉じるボタン */}
        <div className="bubble-detail-footer">
          <button className="bubble-detail-btn--close" onClick={onClose}>
            閉じる
          </button>
        </div>

        {/* 削除エリア */}
        {onRemove && (
          <div className="bubble-detail-delete-area">
            {!confirmDelete ? (
              <button
                className="bubble-detail-delete-link"
                onClick={() => setConfirmDelete(true)}
              >
                この泡を消す
              </button>
            ) : (
              <div className="bubble-detail-delete-confirm">
                <p className="bubble-detail-delete-confirm-text">
                  このシャボン玉を消しますか？この操作は元に戻せません。
                </p>
                <div className="bubble-detail-delete-confirm-btns">
                  <button
                    className="bubble-detail-delete-cancel"
                    onClick={() => setConfirmDelete(false)}
                  >
                    やめる
                  </button>
                  <button
                    className="bubble-detail-delete-ok"
                    onClick={() => { onRemove(bubble.id); onClose(); }}
                  >
                    消す
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
