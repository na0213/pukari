import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import type { Bubble } from '../../types/bubble';
import { getBubbleColorStyle } from '../../lib/bubbleColors';
import './BubbleItem.css';

// ── サイズ計算 ──

function getBaseSize(totalCount: number): number {
  if (totalCount <= 10) return 90;
  if (totalCount <= 30) return 60;
  if (totalCount <= 60) return 42;
  return 30;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (Math.sin(hash) + 1) / 2;
}

function getBubbleSize(totalCount: number, bubble: Bubble): number {
  const base = getBaseSize(totalCount);
  const keepMultiplier = bubble.status === 'nearby' ? 1.3 : 1.0;
  return Math.round(base * bubble.sizeFactor * keepMultiplier);
}

// ── テキスト表示 ──

function getDisplayText(text: string, size: number): string | null {
  if (size < 35) return null;
  if (size < 60) {
    return text.length > 5 ? text.slice(0, 5) + '…' : text;
  }
  return text.length > 9 ? text.slice(0, 9) + '…' : text;
}

// ── Props ──

interface BubbleItemProps {
  bubble: Bubble;
  totalCount: number;             // activeBubbles.length（サイズ計算用）
  position: { x: number; y: number };
  onTap: (id: string) => void;
  exitAnimation?: TargetAndTransition;
  isHighlighted?: boolean;        // 検索で選択された直後の一時ハイライト
  isFocused?: boolean;            // 検索で中央に寄せた泡
}

export default function BubbleItem({
  bubble,
  totalCount,
  position,
  onTap,
  exitAnimation,
  isHighlighted = false,
  isFocused = false,
}: BubbleItemProps) {
  const floatDuration = useMemo(
    () => 3 + seededRandom(`${bubble.id}:duration`) * 3,
    [bubble.id]
  );  // 3〜6s
  const floatDelay = useMemo(
    () => seededRandom(`${bubble.id}:delay`) * 3,
    [bubble.id]
  );          // 0〜3s

  const size = getBubbleSize(totalCount, bubble);
  const fontSize = Math.max(7, Math.round(size * 0.15));
  const displayText = getDisplayText(bubble.text, size);

  const cssVars = {
    '--float-duration': `${floatDuration}s`,
    '--float-delay': `${floatDelay}s`,
    left: `${position.x}%`,
    top: `${position.y}%`,
    width: `${size}px`,
    height: `${size}px`,
    ...(bubble.color ? getBubbleColorStyle(bubble.color) : {}),
  } as React.CSSProperties;

  const className = [
    'bubble-item',
    `bubble-item--${bubble.status}`,
    bubble.color ? 'bubble-item--colored' : '',
    bubble.repeat ? 'bubble-item--repeat' : '',
    isHighlighted ? 'bubble-item--highlighted' : '',
    isFocused ? 'bubble-item--focused' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const defaultExit = exitAnimation ?? {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.3 },
  };

  return (
    <motion.div
      className={className}
      style={cssVars}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={defaultExit}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 18,
        delay: floatDelay * 0.3,
      }}
      onClick={() => onTap(bubble.id)}
      aria-label={`シャボン玉: ${bubble.text}、状態: ${bubble.status}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onTap(bubble.id);
      }}
    >
      {displayText !== null && (
        <span className="bubble-text" style={{ fontSize: `${fontSize}px` }}>
          {displayText}
        </span>
      )}
      {bubble.repeat && (
        <span className="bubble-repeat-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="bubble-repeat-icon" focusable="false" aria-hidden="true">
            <path
              d="M20 6v5h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 18v-5h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.5 9.5A7 7 0 0 0 7 7.5L4 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.5 14.5A7 7 0 0 0 17 16.5L20 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </motion.div>
  );
}
