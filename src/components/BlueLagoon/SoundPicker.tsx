import type { LagoonSound } from '../../types/bluelagoon';
import { LAGOON_SOUND_CONFIG } from '../../lib/constants';
import './SoundPicker.css';

const SOUND_ORDER: LagoonSound[] = ['none', 'rain', 'wave', 'bonfire'];

interface SoundPickerProps {
  current: LagoonSound;
  volume: number;
  onChange: (sound: LagoonSound) => void;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4v11.5" />
      <path d="M14 4l7-2v11.5" />
      <path d="M14 15.5a3 3 0 1 1-2-2.83" />
      <path d="M7 7v9.5" />
    </svg>
  );
}

export default function SoundPicker({ current, volume, onChange, onVolumeChange, onClose }: SoundPickerProps) {
  return (
    <>
      <div className="picker-overlay" aria-hidden="true" />

      <div className="picker-panel" role="dialog" aria-label="サウンド選択">
        <div className="picker-header">
          <p className="picker-title">
            <span className="picker-title-icon" aria-hidden="true"><MusicIcon /></span>
            <span>サウンド・背景</span>
          </p>
          <button
            type="button"
            className="picker-close"
            onClick={onClose}
            aria-label="サウンドを閉じる"
          >
            <CloseIcon />
          </button>
        </div>
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

        <div className="picker-volume">
          <div className="picker-volume-header">
            <span>音量</span>
            <span className="picker-volume-value">{Math.round(volume * 100)}%</span>
          </div>
          <input
            className="picker-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.currentTarget.value))}
            aria-label="サウンド音量"
          />
        </div>
      </div>
    </>
  );
}
