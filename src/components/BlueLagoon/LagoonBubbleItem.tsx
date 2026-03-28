import type { LagoonBubble } from '../../types/bluelagoon';
import { motion, useReducedMotion } from 'framer-motion';
import './LagoonBubbleItem.css';

interface LagoonBubbleItemProps {
  bubble: LagoonBubble;
  isOwn: boolean;
  compact?: boolean;
  onClick?: () => void;
  appear?: boolean;
  delay?: number;
  ownSize?: number;
  otherSize?: number;
  canvasWidthFactor?: number;
  focusGlow?: number; // 0〜1: タイマー進捗（自分の泡のみ）
}

// IDから決定論的な位置とアニメーション設定を算出
function styleFromBubble(
  id: string,
  isOwn: boolean,
  ownSize: number,
  otherSize: number,
  canvasWidthFactor: number,
): React.CSSProperties {
  const hex = id.replace(/-/g, '').slice(0, 12);
  const n = parseInt(hex.slice(0, 8), 16);
  const m = parseInt(hex.slice(4, 12), 16);

  // 自分の泡は最初のビューポート内（左端〜100vw）に収める
  const x = isOwn
    ? (8 / canvasWidthFactor) + (n % 1000) / 1000 * (64 / canvasWidthFactor)
    : 8 + (n % 1000) / 1000 * 72;              // 他者は全幅に散布
  const y = 12 + (Math.abs(m) % 800) / 800 * 50;
  const sizeBase = isOwn ? ownSize : otherSize;
  const sizeJitter = isOwn ? 0 : Math.round((n % 200) / 200 * sizeBase * 0.15);
  const size = sizeBase + sizeJitter;
  const duration = 7 + (n % 3000) / 3000 * 3;
  const delay = -((m % 6000) / 1000);

  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  };
}

export default function LagoonBubbleItem({
  bubble,
  isOwn,
  compact = false,
  onClick,
  appear = false,
  delay = 0,
  ownSize = compact ? 75 : 100,
  otherSize = compact ? 55 : 80,
  canvasWidthFactor = 1,
  focusGlow = 0,
}: LagoonBubbleItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const style = styleFromBubble(bubble.id, isOwn, ownSize, otherSize, canvasWidthFactor);

  // focusGlow に応じたオーロラ重ね合わせ強度
  const glowStyle: React.CSSProperties = focusGlow > 0 ? {
    '--focus-glow-opacity': focusGlow,
    '--focus-glow-scale': 1 + focusGlow * 0.12,
  } as React.CSSProperties : {};

  const motionProps = appear && !prefersReducedMotion
    ? {
        initial: { scale: 0.08, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: {
          delay,
          duration: 0.9,
          ease: 'easeOut' as const,
        },
      }
    : {
        initial: false,
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0 },
      };

  return (
    <motion.button
      type="button"
      className="lagoon-bubble"
      style={style}
      aria-label={isOwn ? `自分のコメント: ${bubble.message}` : `参加者のコメント: ${bubble.message}`}
      {...motionProps}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div
        className={`lagoon-bubble-surface ${isOwn ? 'lagoon-bubble-surface--mine' : 'lagoon-bubble-surface--other'} ${compact ? 'lagoon-bubble-surface--compact' : ''} ${focusGlow > 0 ? 'lagoon-bubble-surface--focus' : ''}`}
        style={glowStyle}
      >
        {bubble.message && (
          <p className="lagoon-bubble-text">{bubble.message}</p>
        )}
      </div>
    </motion.button>
  );
}
