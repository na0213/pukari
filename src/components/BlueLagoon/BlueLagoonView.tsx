import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { UseLagoonReturn } from '../../hooks/useLagoon';
import { LAGOON_SOUND_CONFIG } from '../../lib/constants';
import LagoonBubbleItem from './LagoonBubbleItem';
import SoundPicker from './SoundPicker';
import './BlueLagoonView.css';

// ── 画像ロード状態管理 ──
function useImageLoader(src: string): 'loading' | 'loaded' | 'error' {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    setState('loading');
    const img = new Image();
    img.onload = () => setState('loaded');
    img.onerror = () => setState('error');
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  return state;
}

interface BlueLagoonViewProps {
  lagoon: UseLagoonReturn;
}

export default function BlueLagoonView({ lagoon }: BlueLagoonViewProps) {
  const {
    myBubble, otherBubbles, participantCount,
    mode, sound,
    setSound, exitLagoon,
  } = lagoon;

  const [showSoundPicker, setShowSoundPicker] = useState(false);

  // sound から背景設定を取得
  const config = LAGOON_SOUND_CONFIG[sound];
  const imageState = useImageLoader(config.imageFile);
  const showImage = imageState === 'loaded';

  const displayBubbles = mode === 'together' ? otherBubbles : [];

  // 星を8個、画面の上半分にランダム配置（マウント時に固定）
  const stars = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      top: `${5 + Math.random() * 40}%`,
      left: `${5 + Math.random() * 90}%`,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 3}s`,
      size: `${2 + Math.random() * 2}px`,
    })),
  []);

  return (
    <div
      className="lagoon-container"
      style={!showImage ? { background: config.fallbackGradient } : undefined}
      aria-label="ブルーラグーン"
    >

      {/* レイヤー1: 背景画像（ロード完了後にフェードイン） */}
      {showImage && (
        <div
          className="lagoon-bg-image"
          style={{ backgroundImage: `url(${config.imageFile})` }}
          aria-hidden="true"
        />
      )}

      {/* レイヤー2a: オーロラ明滅（緑系） */}
      <div className="lagoon-aurora-glow" aria-hidden="true" />

      {/* レイヤー2b: オーロラ明滅（紫系） */}
      <div className="lagoon-aurora-glow-2" aria-hidden="true" />

      {/* レイヤー3: 水面の揺らぎ */}
      <div className="lagoon-water-shimmer" aria-hidden="true" />

      {/* レイヤー4: 星のキラキラ */}
      <div aria-hidden="true">
        {stars.map((star) => (
          <div
            key={star.id}
            className="lagoon-star"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              '--twinkle-duration': star.duration,
              '--twinkle-delay': star.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* レイヤー5: シャボン玉とUI */}
      <div className="lagoon-content">

        {/* 参加人数 */}
        <div className="lagoon-participants" aria-live="polite">
          <span className="lagoon-participants-dot" aria-hidden="true" />
          {participantCount}人がもくもく中
        </div>

        {/* ソロ表示バナー */}
        {mode === 'solo' && (
          <div className="lagoon-solo-badge" aria-label="一人もくもくタイム">
            一人もくもくタイム
          </div>
        )}

        {/* 意気込みシャボン玉エリア */}
        <div className="lagoon-bubbles-area" aria-hidden="true">
          {myBubble && (
            <LagoonBubbleItem bubble={myBubble} isOwn={true} />
          )}
          <AnimatePresence>
            {displayBubbles.map((bubble) => (
              <motion.div
                key={bubble.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              >
                <LagoonBubbleItem bubble={bubble} isOwn={false} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 下部コントロール（サウンド + 退出のみ） */}
        <div className="lagoon-controls">
          <button
            className="lagoon-ctrl-btn"
            onClick={() => setShowSoundPicker((prev) => !prev)}
            aria-label="サウンド設定"
          >
            {sound === 'none' ? '🔇' : '🔊'}
            <span>サウンド</span>
          </button>

          <button
            className="lagoon-ctrl-btn lagoon-ctrl-btn--exit"
            onClick={exitLagoon}
            aria-label="ブルーラグーンを退出する"
          >
            ←
            <span>退出する</span>
          </button>
        </div>

      </div>{/* /lagoon-content */}

      {/* サウンドピッカー */}
      {showSoundPicker && (
        <SoundPicker
          current={sound}
          onChange={(s) => {
            setSound(s);
            setShowSoundPicker(false);
          }}
          onClose={() => setShowSoundPicker(false)}
        />
      )}

    </div>
  );
}
