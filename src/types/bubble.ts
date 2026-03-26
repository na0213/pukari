import type { BubbleColorKey } from '../lib/bubbleColors';

// シャボン玉の状態（簡素化）
export type BubbleStatus =
  | 'floating'   // 浮かんでいる（初期状態）
  | 'nearby'     // キープした
  | 'completed'; // できた（空に溶けた）

// シャボン玉のデータ
export interface Bubble {
  id: string;
  text: string;           // 1行のつぶやき
  memo?: string;          // 補足メモ（任意）
  color?: BubbleColorKey; // シャボン玉の色
  status: BubbleStatus;
  sizeFactor: number;     // ランダムサイズ係数（0.8〜1.2）作成時に決定
  createdAt: Date;
  completedAt?: Date;     // できた日時（completed のみ）
}

// 泡の日ごとの記録
export interface BubbleLog {
  id: string;
  bubbleId: string;
  date: string;           // YYYY-MM-DD（JST）
  type: 'done';           // 'touched' を廃止。'done' のみ
  createdAt: Date;
}
