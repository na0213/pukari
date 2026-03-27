import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Bubble } from '../../types/bubble';
import type { BubbleColorKey } from '../../lib/bubbleColors';
import {
  BUBBLE_COLOR_OPTIONS,
  normalizeBubbleColor,
} from '../../lib/bubbleColors';
import './BubbleDetail.css';

function LagoonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <path d="M3 8C6 5.5 9 10.5 12 8C15 5.5 18 10.5 21 8" />
      <path d="M3 12C6 9.5 9 14.5 12 12C15 9.5 18 14.5 21 12" />
      <path d="M3 16C6 13.5 9 18.5 12 16C15 13.5 18 18.5 21 16" />
    </svg>
  );
}

interface BubbleDetailProps {
  bubble: Bubble;
  isDoneToday: boolean;
  showOnboardingGuide?: boolean;
  onClose: () => void;
  onFocusInLagoon: (id: string) => void;
  onKeep: (id: string) => void;
  onUnkeep: (id: string) => void;
  onMarkDone: (id: string) => void;
  onMarkDoneToday: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onUpdateColor: (id: string, color: BubbleColorKey | null) => void;
  onUpdateRepeat: (id: string, repeat: boolean) => void;
  onRemove?: (id: string) => void;
}

export default function BubbleDetail({
  bubble,
  isDoneToday,
  showOnboardingGuide = false,
  onClose,
  onFocusInLagoon,
  onKeep,
  onUnkeep,
  onMarkDone,
  onMarkDoneToday,
  onUpdateText,
  onUpdateMemo,
  onUpdateColor,
  onUpdateRepeat,
  onRemove,
}: BubbleDetailProps) {
  const [text, setText] = useState(bubble.text);
  const [memo, setMemo] = useState(bubble.memo ?? '');
  const [selectedColor, setSelectedColor] = useState<BubbleColorKey | null>(
    bubble.color ?? null
  );
  const [repeatEnabled, setRepeatEnabled] = useState(bubble.repeat ?? false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'memo' | 'done'>('memo');

  useEffect(() => {
    setText(bubble.text);
    setMemo(bubble.memo ?? '');
    setSelectedColor(normalizeBubbleColor(bubble.color) ?? null);
    setRepeatEnabled(bubble.repeat ?? false);
    setConfirmDelete(false);
    setOnboardingStep('memo');
  }, [bubble.id, bubble.memo, bubble.color, bubble.repeat]);

  const handleTextBlur = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setText(bubble.text);
      return;
    }
    if (trimmed !== bubble.text) {
      onUpdateText(bubble.id, trimmed);
    }
  };

  const handleMemoBlur = () => {
    if (memo !== (bubble.memo ?? '')) {
      onUpdateMemo(bubble.id, memo);
    }
  };

  const showMainButtons = bubble.status !== 'completed';
  const isTodayBubble = bubble.status === 'nearby';

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
        <button
          type="button"
          className="bubble-detail-close-top"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>

        {/* ドラッグハンドル */}
        <div className="bubble-detail-handle" aria-hidden="true" />

        {/* 泡のテキスト */}
        <input
          className="bubble-detail-text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleTextBlur}
          maxLength={100}
          aria-label="メモのタイトル"
        />

        {showOnboardingGuide && onboardingStep === 'memo' && (
          <div className="bubble-detail-guide bubble-detail-guide--memo" aria-live="polite">
            <p className="bubble-detail-guide-title">次はここ</p>
            <p className="bubble-detail-guide-text">
              必要ならここに補足メモを残せます。書かなくても大丈夫です。
            </p>
            <button
              type="button"
              className="bubble-detail-guide-action"
              onClick={() => setOnboardingStep('done')}
            >
              メモはあとで
            </button>
          </div>
        )}

        {/* メモ欄 */}
        <textarea
          className={[
            'bubble-detail-memo',
            showOnboardingGuide && onboardingStep === 'memo' ? 'bubble-detail-memo--guided' : '',
          ].join(' ')}
          value={memo}
          onChange={(e) => {
            setMemo(e.target.value);
            if (showOnboardingGuide && onboardingStep === 'memo') {
              setOnboardingStep('done');
            }
          }}
          onFocus={() => {
            if (showOnboardingGuide && onboardingStep === 'memo') {
              setOnboardingStep('done');
            }
          }}
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
        </div>

        {/* アクション */}
        {showMainButtons && (
        <div className="bubble-detail-actions">
          {showOnboardingGuide && onboardingStep === 'done' && (
            <div className="bubble-detail-guide bubble-detail-guide--done" aria-live="polite">
              <p className="bubble-detail-guide-title">最後にこれ</p>
              <p className="bubble-detail-guide-text">
                今回は下の「できた！」を押して、記録が空に残る流れを試してみてください。
              </p>
            </div>
          )}

          <div className="bubble-detail-chip-row">
            <button
              type="button"
              className={[
                'bubble-detail-toggle',
                isTodayBubble ? 'bubble-detail-toggle--active bubble-detail-toggle--today' : '',
                showOnboardingGuide ? 'bubble-detail-secondary--muted' : '',
              ].join(' ')}
              onClick={() => {
                if (isTodayBubble) onUnkeep(bubble.id);
                else onKeep(bubble.id);
              }}
              aria-pressed={isTodayBubble}
              aria-label="今日やる"
            >
              <span className="bubble-detail-toggle-icon" aria-hidden="true">
                ◎
              </span>
              今日やる
            </button>

            <button
              type="button"
              className={[
                'bubble-detail-toggle',
                repeatEnabled ? 'bubble-detail-toggle--active' : '',
                showOnboardingGuide ? 'bubble-detail-secondary--muted' : '',
              ].join(' ')}
              onClick={() => {
                const next = !repeatEnabled;
                setRepeatEnabled(next);
                onUpdateRepeat(bubble.id, next);
              }}
              aria-pressed={repeatEnabled}
              aria-label="繰り返す"
            >
              <span className="bubble-detail-toggle-icon" aria-hidden="true">
                ↻
              </span>
              繰り返す
            </button>
          </div>

          {repeatEnabled && (
            <p className="bubble-detail-repeat-note">
              できた後も泡を残します
            </p>
          )}

          <button
            className={[
              'bubble-detail-btn',
              'bubble-detail-btn--done',
              showOnboardingGuide && onboardingStep === 'done' ? 'bubble-detail-btn--guided' : '',
            ].join(' ')}
            onClick={() => {
              if (repeatEnabled) {
                onMarkDoneToday(bubble.id);
                onClose();
                return;
              }
              onMarkDone(bubble.id);
              onClose();
            }}
            disabled={isDoneToday}
            aria-disabled={isDoneToday}
          >
            {isDoneToday ? '✓ 今日は記録済み' : 'できた！'}
          </button>

          <button
            className="bubble-detail-btn bubble-detail-btn--lagoon"
            onClick={() => onFocusInLagoon(bubble.id)}
          >
            <span className="bubble-detail-btn-icon" aria-hidden="true">
              <LagoonIcon />
            </span>
            <span className="bubble-detail-btn-copy">
              <span className="bubble-detail-btn-title">もくもく集中部屋へ</span>
              <span className="bubble-detail-btn-subtitle">このメモに取り組むために行ってみる</span>
            </span>
          </button>
          </div>
        )}
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
                  メモのデータがすべて消えます。<br />この操作は元に戻せません。
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
