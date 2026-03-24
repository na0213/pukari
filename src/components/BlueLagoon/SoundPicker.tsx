import type { LagoonSound } from '../../types/bluelagoon';
import { LAGOON_SOUND_CONFIG } from '../../lib/constants';
import './SoundPicker.css';

const SOUND_ORDER: LagoonSound[] = ['none', 'rain', 'wave', 'bonfire'];

interface SoundPickerProps {
  current: LagoonSound;
  onChange: (sound: LagoonSound) => void;
  onClose: () => void;
}

export default function SoundPicker({ current, onChange, onClose }: SoundPickerProps) {
  return (
    <>
      <div className="picker-overlay" onClick={onClose} aria-hidden="true" />

      <div className="picker-panel" role="dialog" aria-label="サウンド選択">
        <p className="picker-title">♪ サウンド・背景</p>
        <div className="picker-divider" />
        <ul className="picker-list" role="radiogroup">
          {SOUND_ORDER.map((value) => (
            <li key={value}>
              <button
                className={`picker-option ${current === value ? 'picker-option--active' : ''}`}
                role="radio"
                aria-checked={current === value}
                onClick={() => onChange(value)}
              >
                <span className="picker-radio" aria-hidden="true">
                  {current === value ? '●' : '○'}
                </span>
                {LAGOON_SOUND_CONFIG[value].label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
