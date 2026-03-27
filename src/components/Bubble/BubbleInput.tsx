import { useEffect, useRef, useState } from 'react';
import { FREE_BUBBLE_LIMIT } from '../../lib/constants';
import './BubbleInput.css';

interface BubbleInputProps {
  onAdd: (text: string) => void;
  canAdd: boolean;
  totalCount: number;
  focusSignal?: number;
  placeholder?: string;
  ctaLabel?: string;
}

export default function BubbleInput({
  onAdd,
  canAdd,
  totalCount,
  focusSignal = 0,
  placeholder = '思いついたことを泡に浮かべる...',
  ctaLabel,
}: BubbleInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSignal <= 0) return;
    inputRef.current?.focus();
  }, [focusSignal]);

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
        placeholder={placeholder}
        maxLength={100}
        aria-label="新しいテキスト"
      />
      <button
        className="bubble-input-submit"
        onClick={handleSubmit}
        disabled={!text.trim()}
        aria-label="浮かべる"
        title={`あと${FREE_BUBBLE_LIMIT - totalCount}個追加できます`}
        data-has-label={ctaLabel ? 'true' : 'false'}
      >
        {ctaLabel ?? '○'}
      </button>
    </div>
  );
}
