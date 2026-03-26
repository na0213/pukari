import type { Bubble, BubbleLog } from '../types/bubble';
import type { DailySky, SkyPhase } from '../types/sky';

function toJSTDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getTodayJSTDate(): Date {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${todayStr}T12:00:00+09:00`);
}

function getSkyPhase(doneCount: number): SkyPhase {
  if (doneCount === 0) return 'dawn';
  if (doneCount <= 2) return 'morning';
  if (doneCount <= 4) return 'afternoon';
  if (doneCount <= 6) return 'sunset';
  return 'night';
}

// 1日分の表示アイテム
export interface DailySkyItem {
  bubbleId: string;
  text: string;
  isCompleted: boolean; // 「できた！」で完了した泡かどうか
}

// DailySky に泡の実データを加えた拡張型
export interface DailySkyDetail extends DailySky {
  doneItems: DailySkyItem[];
}

export interface UseDailySkyReturn {
  todaySky: DailySkyDetail;
  allDays: DailySkyDetail[];
  getSkyForDate: (date: string) => DailySkyDetail | null;
}

export function useDailySky(
  bubbles: Bubble[],
  logs: BubbleLog[]
): UseDailySkyReturn {
  const bubbleMap = new Map(bubbles.map((b) => [b.id, b]));

  const todayJST = getTodayJSTDate();
  const dayStrings = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayJST);
    d.setUTCDate(d.getUTCDate() - i);
    return toJSTDate(d);
  });

  function computeDay(dateStr: string): DailySkyDetail {
    const doneLogs = logs.filter((l) => l.date === dateStr && l.type === 'done');

    const doneItems: DailySkyItem[] = doneLogs
      .map((l) => {
        const b = bubbleMap.get(l.bubbleId);
        if (!b) return null;
        return {
          bubbleId: b.id,
          text: b.text,
          isCompleted: b.status === 'completed',
        };
      })
      .filter((item): item is DailySkyItem => item !== null);

    const doneCount = doneItems.length;
    const phase = getSkyPhase(doneCount);
    const bubbleIds = doneItems.map((i) => i.bubbleId);

    return {
      date: dateStr,
      phase,
      doneCount,
      bubbleIds,
      doneItems,
    };
  }

  const allDays = dayStrings.map(computeDay);
  const todaySky = allDays[0];

  const getSkyForDate = (date: string) =>
    allDays.find((d) => d.date === date) ?? null;

  return { todaySky, allDays, getSkyForDate };
}
