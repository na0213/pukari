import { useState, useRef } from 'react';
import { FREE_BUBBLE_LIMIT } from '../../lib/constants';
import './BubbleInput.css';

interface BubbleInputProps {
  onAdd: (text: string) => void;
  canAdd: boolean;
  totalCount: number;
}

export default function BubbleInput({ onAdd, canAdd, totalCount }: BubbleInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || !canAdd) return;
    inputRef.current?.blur();
    onAdd(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
    }
  };

  // 上限に達したとき
  if (!canAdd) {
    return (
      <div className="bubble-limit-msg" role="status">
        空がいっぱいです（{FREE_BUBBLE_LIMIT}個）
        <br />
        「できた！」で泡を完成させましょう。
      </div>
    );
  }

  return (
    <div className="bubble-input-wrap">
      <input
        ref={inputRef}
        className="bubble-input-field"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="思いついたことを浮かべる..."
        maxLength={100}
        aria-label="新しいシャボン玉のテキスト"
      />
      <button
        className="bubble-input-submit"
        onClick={handleSubmit}
        disabled={!text.trim()}
        aria-label="シャボン玉を浮かべる"
        title={`あと${FREE_BUBBLE_LIMIT - totalCount}個追加できます`}
      >
        ○
      </button>
    </div>
  );
}
