import { useMemo, useRef, useState } from 'react';
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
  const keepMultiplier = bubble.status === 'nearby' ? 1.42 : 1.0;
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
  onDragEnd?: (id: string, deltaXPct: number, deltaYPct: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  exitAnimation?: TargetAndTransition;
  isHighlighted?: boolean;        // 検索で選択された直後の一時ハイライト
  isFocused?: boolean;            // 検索で中央に寄せた泡
}

export default function BubbleItem({
  bubble,
  totalCount,
  position,
  onTap,
  onDragEnd,
  containerRef,
  exitAnimation,
  isHighlighted = false,
  isFocused = false,
}: BubbleItemProps) {
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
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
      className={`${className}${dragging ? ' bubble-item--dragging' : ''}`}
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
      drag={!!onDragEnd}
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={containerRef ?? false}
      onDragStart={(_e, info) => {
        isDragging.current = false;
        dragStartPos.current = { x: info.point.x, y: info.point.y };
        setDragging(true);
      }}
      onDrag={(_e, info) => {
        const dx = Math.abs(info.point.x - dragStartPos.current.x);
        const dy = Math.abs(info.point.y - dragStartPos.current.y);
        if (dx > 4 || dy > 4) isDragging.current = true;
      }}
      onDragEnd={(_e, info) => {
        setDragging(false);
        // ドラッグ直後のクリック発火を防ぐため、少し遅延させてフラグを戻す
        setTimeout(() => {
          isDragging.current = false;
        }, 50);

        if (!onDragEnd) return;
        const container = containerRef?.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const pctX = (info.offset.x / rect.width) * 100;
        const pctY = (info.offset.y / rect.height) * 100;
        onDragEnd(bubble.id, pctX, pctY);
      }}
      onClick={() => {
        if (!isDragging.current) onTap(bubble.id);
      }}
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
        <span className="bubble-repeat-infinity" aria-hidden="true">∞</span>
      )}
    </motion.div>
  );
}
