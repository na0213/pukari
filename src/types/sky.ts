// 空の色の段階
export type SkyPhase =
  | 'dawn'      // 早朝の薄い青（0個）
  | 'morning'   // 昼の明るい青（1-2個）
  | 'afternoon' // 午後の温かい空（3-4個）
  | 'sunset'    // 夕焼けのオレンジ（5-6個）
  | 'night';    // 星空（7+個）

// 1日の空の記録
export interface DailySky {
  date: string;       // YYYY-MM-DD
  phase: SkyPhase;
  doneCount: number;  // できた数
  bubbleIds: string[]; // その日に関わった泡のID
}
