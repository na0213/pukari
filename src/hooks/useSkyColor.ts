import type { SkyPhase } from '../types/sky';

/**
 * 「できた」数に応じて空のフェーズを返す
 */
export function useSkyColor(doneCount: number): SkyPhase {
  if (doneCount === 0) return 'dawn';
  if (doneCount <= 2) return 'morning';
  if (doneCount <= 4) return 'afternoon';
  if (doneCount <= 6) return 'sunset';
  return 'night';
}
