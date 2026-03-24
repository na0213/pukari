import type { LagoonBubble } from '../../types/bluelagoon';
import './LagoonBubbleItem.css';

interface LagoonBubbleItemProps {
  bubble: LagoonBubble;
  isOwn: boolean;
}

// IDから決定論的な位置とアニメーション設定を算出
function styleFromBubble(
  id: string,
  isOwn: boolean
): React.CSSProperties {
  const hex = id.replace(/-/g, '').slice(0, 12);
  const n = parseInt(hex.slice(0, 8), 16);
  const m = parseInt(hex.slice(4, 12), 16);

  const x = 8 + (n % 1000) / 1000 * 72;       // 8% - 80%
  const y = 12 + (Math.abs(m) % 800) / 800 * 50; // 12% - 62%
  const size = isOwn ? 72 : 52 + (n % 200) / 200 * 16;
  const duration = 5 + (n % 3000) / 3000 * 4;   // 5〜9秒
  const delay = -((m % 6000) / 1000);            // 負のdelay でランダム開始

  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  };
}

export default function LagoonBubbleItem({ bubble, isOwn }: LagoonBubbleItemProps) {
  const style = styleFromBubble(bubble.id, isOwn);

  return (
    <div
      className={`lagoon-bubble ${isOwn ? 'lagoon-bubble--mine' : 'lagoon-bubble--other'}`}
      style={style}
      aria-label={isOwn ? `自分の意気込み: ${bubble.message}` : `参加者の意気込み`}
    >
      {bubble.message && (
        <p className="lagoon-bubble-text">{bubble.message}</p>
      )}
    </div>
  );
}
