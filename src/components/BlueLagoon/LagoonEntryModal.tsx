import { useState, useRef, useEffect } from 'react';
import './LagoonEntryModal.css';

interface LagoonEntryModalProps {
  onEnter: (message: string) => void;
  onClose: () => void;
}

export default function LagoonEntryModal({ onEnter, onClose }: LagoonEntryModalProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 少し遅らせてキーボードを開く
    const id = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(id);
  }, []);

  const handleGo = () => {
    onEnter(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGo();
    if (e.key === 'Escape') onClose();
  };

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        className="entry-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div
        className="entry-modal"
        role="dialog"
        aria-modal="true"
        aria-label="みんなともくもく集中タイムへ"
      >
        <button
          className="entry-close"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>

        <h2 className="entry-title">みんなともくもく集中タイム</h2>
        <p className="entry-sub">意気込みをひとこと</p>

        <input
          ref={inputRef}
          className="entry-input"
          type="text"
          placeholder="今日は何をがんばる？"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={40}
          aria-label="今日の意気込み"
        />

        <button
          className="entry-go"
          onClick={handleGo}
        >
          Go
        </button>
      </div>
    </>
  );
}
