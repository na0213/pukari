import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import type { Bubble } from '../../types/bubble';
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
    return text.length > 3 ? text.slice(0, 3) + '…' : text;
  }
  return text.length > 6 ? text.slice(0, 6) + '…' : text;
}

// ── Props ──

interface BubbleItemProps {
  bubble: Bubble;
  totalCount: number;             // activeBubbles.length（サイズ計算用）
  position: { x: number; y: number };
  onTap: (id: string) => void;
  exitAnimation?: TargetAndTransition;
  isHighlighted?: boolean;        // 検索で選択された直後の一時ハイライト
}

export default function BubbleItem({
  bubble,
  totalCount,
  position,
  onTap,
  exitAnimation,
  isHighlighted = false,
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
  } as React.CSSProperties;

  const className = [
    'bubble-item',
    `bubble-item--${bubble.status}`,
    isHighlighted ? 'bubble-item--highlighted' : '',
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
    </motion.div>
  );
}
