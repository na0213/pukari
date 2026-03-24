// 無料プランの泡の上限
export const FREE_BUBBLE_LIMIT = 100;

// 自動ドリフトまでの日数（floating状態でタップなし）
export const AUTO_DRIFT_DAYS = 14;

// 「今日の空」無料閲覧日数
export const FREE_JOURNAL_DAYS = 30;

// ブルーラグーン サウンド＆背景の統合設定
export const LAGOON_SOUND_CONFIG: Record<string, {
  label: string;
  soundFile: string | null;
  imageFile: string;
  fallbackGradient: string;
}> = {
  none: {
    label: '無音',
    soundFile: null,
    imageFile: '/images/lagoon-aurora.png',
    fallbackGradient: 'linear-gradient(45deg, #0a0a2e, #1a1a4e, #0d3b66, #1a6b4a)',
  },
  rain: {
    label: '雨音',
    soundFile: '/sounds/rain.mp3',
    imageFile: '/images/theme-rain.png',
    fallbackGradient: 'linear-gradient(180deg, #4a5568, #718096, #a0aec0, #718096)',
  },
  wave: {
    label: '波の音',
    soundFile: '/sounds/wave.mp3',
    imageFile: '/images/theme-ocean.png',
    fallbackGradient: 'linear-gradient(180deg, #2b6cb0, #4299e1, #63b3ed, #ebf8ff)',
  },
  bonfire: {
    label: '焚き火',
    soundFile: '/sounds/bonfire.mp3',
    imageFile: '/images/theme-bonfire.png',
    fallbackGradient: 'linear-gradient(180deg, #1a202c, #2d3748, #744210, #c05621)',
  },
};

// アプリ名
export const APP_NAME = 'Pukari';
export const APP_TAGLINE = 'float your thoughts, gently.';
export const APP_TAGLINE_JA = '途中でも消えない、思いつきの避難所。';

// 画像パス（差し替え可能）
export const APP_LOGO = '/images/logo.png';
export const APP_ICON_192 = '/icon-192.png';
export const APP_ICON_512 = '/icon-512.png';
