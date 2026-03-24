// ブルーラグーンの意気込み
export interface LagoonBubble {
  id: string;
  userId: string;        // 匿名ユーザーID
  message: string;       // 意気込みテキスト
  createdAt: Date;
}

// サウンド設定（背景テーマも兼ねる）
export type LagoonSound =
  | 'none'         // 無音 → オーロラ背景
  | 'rain'         // 雨音 → 紫陽花と雨
  | 'wave'         // 波の音 → 島と海
  | 'bonfire';     // 焚き火 → 焚き火

// もくもくモード（一人 or みんな）
export type LagoonMode =
  | 'together'     // みんなでもくもく（デフォルト: sound === 'none'）
  | 'solo';        // 一人もくもくタイム（sound !== 'none'）
