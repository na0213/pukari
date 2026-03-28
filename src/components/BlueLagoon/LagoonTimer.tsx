import { useState, useEffect, useCallback, useRef } from 'react';
import './LagoonTimer.css';

// ────────────────────────────────────────────
// プリセット（分）
// ────────────────────────────────────────────
const PRESETS = [5, 10, 15, 25, 30, 45, 60] as const;

// ────────────────────────────────────────────
// SVG 円形プログレスバーのパラメータ
// ────────────────────────────────────────────
const RADIUS = 80;
const STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

// ────────────────────────────────────────────
// CSS グロー星（done状態表示）
// ────────────────────────────────────────────
function GlowStar() {
  return (
    <div className="ltimer-glow-star" aria-hidden="true">
      <div className="ltimer-glow-halo ltimer-glow-halo--outer" />
      <div className="ltimer-glow-halo ltimer-glow-halo--mid" />
      <div className="ltimer-glow-core" />
    </div>
  );
}

// ────────────────────────────────────────────
// タイマーアイコン
// ────────────────────────────────────────────
export function TimerIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9 3h6" />
      <path d="M12 3v2" />
    </svg>
  );
}



// ────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────
interface LagoonTimerProps {
  onClose: () => void;
  onElapsedSeconds?: (seconds: number) => void; // 現在セッションの経過秒数（完了時はtodalSeconds）
}

type Phase = 'setup' | 'running' | 'paused' | 'done';

export default function LagoonTimer({ onClose, onElapsedSeconds }: LagoonTimerProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [customMinutes, setCustomMinutes] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── タイマー進行 ──
  useEffect(() => {
    if (phase !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          setPhase('done');
          onElapsedSeconds?.(totalSeconds); // 完了: セッション全体を経過として報告
          return 0;
        }
        onElapsedSeconds?.(totalSeconds - next);
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, totalSeconds, onElapsedSeconds]);

  // ── プリセット選択 ──
  const selectPreset = useCallback((minutes: number) => {
    const secs = minutes * 60;
    setTotalSeconds(secs);
    setRemaining(secs);
    setCustomMinutes('');
  }, []);

  // ── カスタム入力 ──
  const applyCustom = useCallback(() => {
    const min = parseInt(customMinutes, 10);
    if (!isNaN(min) && min > 0 && min <= 360) {
      const secs = min * 60;
      setTotalSeconds(secs);
      setRemaining(secs);
    }
  }, [customMinutes]);

  // ── スタート ──
  const handleStart = useCallback(() => {
    if (remaining <= 0) return;
    setPhase('running');
  }, [remaining]);

  // ── 一時停止 / 再開 ──
  const handlePauseResume = useCallback(() => {
    setPhase((p) => (p === 'running' ? 'paused' : 'running'));
  }, []);

  // ── リセット ──
  const handleReset = useCallback(() => {
    setRemaining(totalSeconds);
    setPhase('setup');
    // リセット時はコールバックしない—襲積は親コンポーネントで管理
  }, [totalSeconds]);

  // ── プログレス計算 ──
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // 残り時間に応じてグラデーション色を変化
  const getArcColor = () => {
    if (progress > 0.6) return 'url(#aurora-gradient-full)';
    if (progress > 0.3) return 'url(#aurora-gradient-mid)';
    return 'url(#aurora-gradient-low)';
  };

  // ────────────────────────────────────────────
  // 設定パネル
  // ────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <>
        <div className="ltimer-overlay" aria-hidden="true" onClick={onClose} />
        <div className="ltimer-panel" role="dialog" aria-label="タイマー設定">
          <div className="ltimer-header">
            <p className="ltimer-title">
              <span className="ltimer-title-icon" aria-hidden="true">
                <TimerIcon color="currentColor" />
              </span>
              <span>タイマー設定</span>
            </p>
            <button
              type="button"
              className="ltimer-close-btn"
              onClick={onClose}
              aria-label="タイマーを閉じる"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="ltimer-divider" />

          {/* プリセット */}
          <p className="ltimer-section-label">時間設定</p>
          <div className="ltimer-presets">
            {PRESETS.map((min) => (
              <button
                key={min}
                className={`ltimer-preset-btn ${totalSeconds === min * 60 ? 'ltimer-preset-btn--active' : ''}`}
                onClick={() => selectPreset(min)}
              >
                {min}<span className="ltimer-preset-unit">分</span>
              </button>
            ))}
          </div>

          {/* カスタム入力 */}
          <div className="ltimer-custom-row">
            <input
              type="number"
              className="ltimer-custom-input"
              placeholder="任意の分数"
              min="1"
              max="360"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onBlur={applyCustom}
              onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
              aria-label="カスタム分数を入力"
            />
            <span className="ltimer-custom-label">分</span>
          </div>

          {/* プレビュー */}
          <div className="ltimer-preview">
            <span className="ltimer-preview-time">{formatTime(remaining)}</span>
          </div>

          {/* スタートボタン */}
          <button
            type="button"
            className="ltimer-start-btn"
            onClick={handleStart}
            disabled={remaining <= 0}
          >
            <span className="ltimer-start-btn-aurora" aria-hidden="true" />
            Start
          </button>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────
  // タイマー表示（running / paused / done）
  // ────────────────────────────────────────────
  return (
    <div className={`ltimer-display ${phase === 'done' ? 'ltimer-display--done' : ''}`} aria-live="polite" aria-label="タイマー">

      {/* SVG 円形プログレス */}
      <div className="ltimer-ring-wrap">
        <svg
          className="ltimer-ring"
          viewBox="0 0 180 180"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="aurora-gradient-full" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,255,180,0.9)" />
              <stop offset="50%" stopColor="rgba(80,160,255,0.9)" />
              <stop offset="100%" stopColor="rgba(160,80,255,0.9)" />
            </linearGradient>
            <linearGradient id="aurora-gradient-mid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(80,160,255,0.9)" />
              <stop offset="100%" stopColor="rgba(200,100,255,0.9)" />
            </linearGradient>
            <linearGradient id="aurora-gradient-low" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,160,60,0.9)" />
              <stop offset="100%" stopColor="rgba(255,80,120,0.9)" />
            </linearGradient>
            <filter id="aurora-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* done時の強いグロウ */}
            <filter id="aurora-glow-done">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* トラック */}
          <circle
            cx="90" cy="90" r={RADIUS}
            fill="none"
            stroke="rgba(100,200,255,0.08)"
            strokeWidth={STROKE}
          />

          {/* プログレス弧 */}
          <circle
            cx="90" cy="90" r={RADIUS}
            fill="none"
            stroke={phase === 'done' ? 'rgba(220,240,255,0.92)' : getArcColor()}
            strokeWidth={phase === 'done' ? 1.5 : STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={phase === 'done' ? 0 : dashOffset}
            transform="rotate(-90 90 90)"
            filter={phase === 'done' ? 'url(#aurora-glow-done)' : 'url(#aurora-glow)'}
            className="ltimer-ring-progress"
          />
        </svg>

        {/* 中央: 時刻 or グロー星 */}
        {phase === 'done' ? (
          <div className="ltimer-center-text">
            <GlowStar />
          </div>
        ) : (
          <div className="ltimer-center-text">
            <span className={`ltimer-time-display ${phase === 'paused' ? 'ltimer-time-display--paused' : ''}`}>
              {formatTime(remaining)}
            </span>
            {phase === 'paused' && (
              <span className="ltimer-pause-label">一時停止中</span>
            )}
          </div>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="ltimer-controls">
        {phase !== 'done' ? (
          <>
            <button
              type="button"
              className="ltimer-ctrl-btn"
              onClick={handlePauseResume}
              aria-label={phase === 'running' ? '一時停止' : '再開'}
            >
              {phase === 'running' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
              <span>{phase === 'running' ? '一時停止' : '再開'}</span>
            </button>

            <button
              type="button"
              className="ltimer-ctrl-btn ltimer-ctrl-btn--reset"
              onClick={handleReset}
              aria-label="リセット"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>リセット</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="ltimer-ctrl-btn ltimer-ctrl-btn--again"
              onClick={handleReset}
              aria-label="もう一度"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>もう一度</span>
            </button>

            <button
              type="button"
              className="ltimer-ctrl-btn ltimer-ctrl-btn--exit"
              onClick={onClose}
              aria-label="タイマーを閉じる"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              <span>閉じる</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
