// ── 入退室 SE ──
export const LAGOON_SE = {
  enter: '/sounds/lagoon-enter.mp3',
  otherEnter: '/sounds/lagoon-other.mp3',
};

// ── SE 再生ヘルパー（ファイルが存在しなければ無音） ──
export function playSE(src: string): void {
  const audio = new Audio(src);
  audio.volume = 0.5;
  audio.play().catch(() => {}); // ファイルがなければ無視
}
