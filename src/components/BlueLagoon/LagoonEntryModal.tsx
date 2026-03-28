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
        aria-label="集中できそうなときはここへ"
      >
        <button
          className="entry-close"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>

        <h2 className="entry-title">ここは集中したい人が集まる場所</h2>
        <p className="entry-sub">
          みんなが泡になって浮かぶよ<br />
          だれかが静かに頑張っているかも
        </p>
        <p className="entry-sub">「ひとこと」はみんなにも見えるよ<br />退出時に消えます</p>

        <input
          ref={inputRef}
          className="entry-input"
          type="text"
          placeholder="ひとこと（無言もOK）"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
