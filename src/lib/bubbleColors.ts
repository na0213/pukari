import type { CSSProperties } from 'react';

export type BubbleColorKey =
  | 'rose'
  | 'mint'
  | 'lavender'
  | 'sun';

export interface BubbleColorOption {
  key: BubbleColorKey;
  label: string;
  swatch: string;
  border: string;
  glow: string;
  shadow: string;
}

export const BUBBLE_COLOR_OPTIONS: BubbleColorOption[] = [
  {
    key: 'rose',
    label: 'ピンク',
    swatch: 'linear-gradient(135deg, #f5a9c1, #ee769a)',
    border: 'rgba(218, 102, 142, 0.62)',
    glow: 'rgba(218, 102, 142, 0.26)',
    shadow: 'rgba(218, 102, 142, 0.16)',
  },
  {
    key: 'mint',
    label: '緑',
    swatch: 'linear-gradient(135deg, #aee6c0, #68bf87)',
    border: 'rgba(88, 170, 114, 0.62)',
    glow: 'rgba(88, 170, 114, 0.24)',
    shadow: 'rgba(88, 170, 114, 0.14)',
  },
  {
    key: 'lavender',
    label: '紫',
    swatch: 'linear-gradient(135deg, #cab5f4, #a77ce3)',
    border: 'rgba(143, 105, 208, 0.62)',
    glow: 'rgba(143, 105, 208, 0.24)',
    shadow: 'rgba(143, 105, 208, 0.14)',
  },
  {
    key: 'sun',
    label: '黄色',
    swatch: 'linear-gradient(135deg, #f7dd72, #eab62f)',
    border: 'rgba(205, 156, 32, 0.62)',
    glow: 'rgba(205, 156, 32, 0.24)',
    shadow: 'rgba(205, 156, 32, 0.14)',
  },
];

const COLOR_BY_KEY = new Map(BUBBLE_COLOR_OPTIONS.map((option) => [option.key, option]));

const LEGACY_COLOR_MAP: Partial<Record<string, BubbleColorKey>> = {
  sage: 'mint',
  plum: 'lavender',
  mauve: 'rose',
  ocean: 'mint',
};

export function isBubbleColorKey(color: string): color is BubbleColorKey {
  return COLOR_BY_KEY.has(color as BubbleColorKey);
}

export function normalizeBubbleColor(color?: string | null): BubbleColorKey | undefined {
  if (!color) return undefined;
  const legacy = LEGACY_COLOR_MAP[color];
  if (legacy) return legacy;
  return isBubbleColorKey(color) ? color : undefined;
}

export function getBubbleColorOption(color: BubbleColorKey): BubbleColorOption {
  return COLOR_BY_KEY.get(color)!;
}

export function getBubbleColorStyle(color?: BubbleColorKey | null): CSSProperties {
  if (!color) return {};
  const option = getBubbleColorOption(color);
  return {
    '--bubble-color-border': option.border,
    '--bubble-color-glow': option.glow,
    '--bubble-color-shadow': option.shadow,
  } as CSSProperties;
}
