import { useRef, useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import type { Bubble } from '../../types/bubble';
import { useBubbles } from '../../hooks/useBubbles';
import { useSkyColor } from '../../hooks/useSkyColor';
import BubbleItem from '../Bubble/BubbleItem';
import BubbleInput from '../Bubble/BubbleInput';
import BubbleDetail from '../Bubble/BubbleDetail';
import BubbleSearch from '../Bubble/BubbleSearch';
import DailySkyView from '../DailySky/DailySkyView';
import LagoonEntryModal from '../BlueLagoon/LagoonEntryModal';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import type { FooterActiveItem } from '../Layout/Footer';
import './SkyView.css';

// ── 星のデータ ──
interface StarData {
  id: number; x: number; y: number;
  size: number; duration: number; delay: number;
}

function generateStars(count: number): StarData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 2 + Math.random() * 94,
    y: 2 + Math.random() * 85,
    size: 2 + Math.random() * 2,
    duration: 1.5 + Math.random() * 2,
    delay: Math.random() * 4,
  }));
}

// ── 空のキャンバス幅（泡の個数に応じて拡張） ──
function getSkyCanvasWidth(count: number): string {
  if (count <= 10) return '100%';
  if (count <= 30) return '200vw';
  if (count <= 60) return '300vw';
  return '400vw';
}

// ── 泡の位置マップ（IDで安定した位置を管理） ──
function usePositionMap() {
  const mapRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const getPosition = (
    id: string,
    existing: { x: number; y: number }[],
    range: { x: [number, number]; y: [number, number] }
  ): { x: number; y: number } => {
    if (!mapRef.current.has(id)) {
      let pos = {
        x: range.x[0] + Math.random() * (range.x[1] - range.x[0]),
        y: range.y[0] + Math.random() * (range.y[1] - range.y[0]),
      };
      let attempts = 0;
      while (
        attempts < 40 &&
        existing.some((p) => Math.hypot(p.x - pos.x, p.y - pos.y) < 14)
      ) {
        pos = {
          x: range.x[0] + Math.random() * (range.x[1] - range.x[0]),
          y: range.y[0] + Math.random() * (range.y[1] - range.y[0]),
        };
        attempts++;
      }
      mapRef.current.set(id, pos);
    }
    return mapRef.current.get(id)!;
  };

  return { getPosition, positionMap: mapRef };
}

// ── 位置レンジ定数 ──
const ACTIVE_RANGE = { x: [5, 88] as [number, number], y: [5, 62] as [number, number] };

// ── exit アニメーション ──
const EXIT_COMPLETED: TargetAndTransition = {
  scale: 1.8,
  opacity: 0,
  transition: { duration: 0.7, ease: 'easeOut' },
};

interface SkyViewProps {
  onEnterLagoon: (message: string) => Promise<void>;
  onOpenAbout: () => void;
  onOpenPwa: () => void;
}

export default function SkyView({ onEnterLagoon, onOpenAbout, onOpenPwa }: SkyViewProps) {
  const {
    bubbles,
    activeBubbles,
    todayDoneCount,
    totalCount,
    canAdd,
    addBubble,
    keepBubble,
    markDone,
    markDoneToday,
    updateMemo,
    removeBubble,
    logs,
    isBubbleDoneToday,
    getLogsForBubbleMonth,
  } = useBubbles();

  const skyPhase = useSkyColor(todayDoneCount);
  const { getPosition, positionMap } = usePositionMap();

  // UI状態
  const [showJournal, setShowJournal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showLagoonEntry, setShowLagoonEntry] = useState(false);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [highlightedBubbleId, setHighlightedBubbleId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // exit アニメーション中の泡
  const [exitingBubbles, setExitingBubbles] = useState<
    Array<Bubble & { exitAnimation: TargetAndTransition }>
  >([]);

  // スクロールコンテナ参照
  const skyRef = useRef<HTMLDivElement>(null);

  const stars = useMemo(() => generateStars(17), []);

  // 選択中の泡（exiting中も含めて探す）
  const selectedBubble =
    activeBubbles.find((b) => b.id === selectedBubbleId) ??
    exitingBubbles.find((b) => b.id === selectedBubbleId);

  // ── フッターのアクティブアイテム ──
  const activeItem: FooterActiveItem = showSearch
    ? 'search'
    : showLagoonEntry
      ? 'mokumoku'
      : showJournal
        ? 'kiroku'
        : 'home';

  // ── 操作ハンドラ ──

  const handleTap = (id: string) => setSelectedBubbleId(id);
  const handleKeep = (id: string) => keepBubble(id);

  const handleMarkDone = (id: string) => {
    const bubble = activeBubbles.find((b) => b.id === id);
    if (bubble) {
      setExitingBubbles((prev) => [
        ...prev.filter((b) => b.id !== id),
        { ...bubble, exitAnimation: EXIT_COMPLETED },
      ]);
      setTimeout(() => {
        setExitingBubbles((prev) => prev.filter((b) => b.id !== id));
      }, 900);
    }
    markDone(id);
    setSelectedBubbleId(null);
  };

  const handleMarkDoneToday = (id: string) => {
    markDoneToday(id);
  };

  const handleHome = () => {
    skyRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  // ── 検索：選択された泡に自動スクロール＋ハイライト ──
  const handleSelectBubble = (id: string) => {
    setShowSearch(false);
    const container = skyRef.current;
    const pos = positionMap.current.get(id);
    if (container && pos) {
      const scrollTarget =
        (pos.x / 100) * container.scrollWidth - container.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
    }
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedBubbleId(id);
    highlightTimerRef.current = setTimeout(() => setHighlightedBubbleId(null), 2000);
  };

  // ── 新しい泡が追加されたらスクロール ──
  const prevCountRef = useRef(activeBubbles.length);
  useEffect(() => {
    if (activeBubbles.length > prevCountRef.current) {
      const newest = activeBubbles[0];
      const container = skyRef.current;
      if (newest && container) {
        const pos = positionMap.current.get(newest.id);
        if (pos) {
          const scrollTarget =
            (pos.x / 100) * container.scrollWidth - container.clientWidth / 2;
          container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
        }
      }
    }
    prevCountRef.current = activeBubbles.length;
  }, [activeBubbles.length, activeBubbles, positionMap]);

  // cleanup
  useEffect(() => () => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
  }, []);

  // ── 泡リスト ──
  const activeIds = new Set(activeBubbles.map((b) => b.id));
  const displayBubbles = [
    ...activeBubbles,
    ...exitingBubbles.filter((b) => !activeIds.has(b.id)),
  ];

  const activePositions: { x: number; y: number }[] = [];
  const positionedBubbles = displayBubbles.map((bubble) => {
    const pos = getPosition(bubble.id, activePositions, ACTIVE_RANGE);
    activePositions.push(pos);
    return { bubble, pos };
  });

  const isScrollable = activeBubbles.length > 10;
  const skyCanvasWidth = getSkyCanvasWidth(activeBubbles.length);

  // 未使用変数の警告を避ける（getLogsForBubbleMonth は DailySkyView で使用）
  void getLogsForBubbleMonth;

  return (
    <div className={`sky-view sky-view--${skyPhase}`} aria-label="Pukariの空">

      {/* ヘッダー */}
      <Header onOpenAbout={onOpenAbout} onOpenPwa={onOpenPwa} />

      {/* 星レイヤー（night のみ） */}
      {skyPhase === 'night' && (
        <div className="sky-stars" aria-hidden="true">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                '--twinkle-duration': `${star.duration}s`,
                '--twinkle-delay': `${star.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* 横スクロールエリア */}
      <div className="sky-scroll-container" ref={skyRef}>
        <div className="sky-canvas" style={{ width: skyCanvasWidth }}>
          <AnimatePresence>
            {positionedBubbles.map(({ bubble, pos }) => {
              const exiting = exitingBubbles.find((e) => e.id === bubble.id);
              return (
                <BubbleItem
                  key={bubble.id}
                  bubble={bubble}
                  totalCount={activeBubbles.length}
                  position={pos}
                  onTap={handleTap}
                  exitAnimation={exiting?.exitAnimation}
                  isHighlighted={highlightedBubbleId === bubble.id}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* スクロールヒント */}
      {isScrollable && <div className="sky-scroll-hint" aria-hidden="true" />}

      {/* 入力バー（フッターの上に固定） */}
      <div className="sky-input-bar">
        <BubbleInput
          onAdd={addBubble}
          canAdd={canAdd}
          totalCount={totalCount}
        />
      </div>

      {/* フッター（4ボタン） */}
      <Footer
        activeBubbleCount={activeBubbles.length}
        activeItem={activeItem}
        onHome={handleHome}
        onSearch={() => setShowSearch(true)}
        onOpenLagoon={() => setShowLagoonEntry(true)}
        onOpenJournal={() => setShowJournal(true)}
      />

      {/* BubbleDetail モーダル */}
      <AnimatePresence>
        {selectedBubble && (
          <BubbleDetail
            key={selectedBubbleId}
            bubble={selectedBubble}
            isDoneToday={isBubbleDoneToday(selectedBubble.id)}
            onClose={() => setSelectedBubbleId(null)}
            onKeep={handleKeep}
            onMarkDone={handleMarkDone}
            onMarkDoneToday={handleMarkDoneToday}
            onUpdateMemo={updateMemo}
            onRemove={removeBubble}
          />
        )}
      </AnimatePresence>

      {/* 検索パネル */}
      {showSearch && (
        <BubbleSearch
          bubbles={activeBubbles}
          onSelect={handleSelectBubble}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* ブルーラグーン入室モーダル */}
      {showLagoonEntry && (
        <LagoonEntryModal
          onEnter={(message) => {
            setShowLagoonEntry(false);
            onEnterLagoon(message);
          }}
          onClose={() => setShowLagoonEntry(false)}
        />
      )}

      {/* 今日の空ジャーナル */}
      <AnimatePresence>
        {showJournal && (
          <DailySkyView
            bubbles={bubbles}
            logs={logs}
            onClose={() => setShowJournal(false)}
            onRemove={removeBubble}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
