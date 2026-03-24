import { useState, useEffect, useRef } from 'react';
import type { Bubble, BubbleStatus, BubbleLog } from '../types/bubble';
import { FREE_BUBBLE_LIMIT } from '../lib/constants';
import { supabase } from '../lib/supabase';

const BUBBLES_KEY = 'pukari-bubbles';
const LOGS_KEY = 'pukari-logs';

// ── 日付ユーティリティ ──

function todayJST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// ── sizeFactor をIDから決定論的に計算（Supabase経由で読み込んだ泡に使用） ──

function sizeFactorFromId(id: string): number {
  const hex = id.replace(/-/g, '').slice(0, 8);
  const n = parseInt(hex, 16) / 0xffffffff;
  return 0.8 + n * 0.4;
}

// ── localStorage のシリアライズ ──

// 旧フォーマットを含む柔軟な型
type RawBubble = {
  id: string;
  text: string;
  memo?: string;
  status: string;
  sizeFactor?: number;
  repeatable?: boolean;  // 旧フィールド（無視）
  createdAt: string;
  touchedAt?: string;    // 旧フィールド（無視）
  completedAt?: string;
  driftedAt?: string;    // 旧フィールド（無視）
  doneAt?: string;       // 旧旧フィールド
};

function toRawBubble(b: Bubble): RawBubble {
  return {
    id: b.id,
    text: b.text,
    memo: b.memo,
    status: b.status,
    sizeFactor: b.sizeFactor,
    createdAt: b.createdAt.toISOString(),
    completedAt: b.completedAt?.toISOString(),
  };
}

function fromRawBubble(raw: RawBubble): Bubble {
  // status 移行: 旧状態 → 新状態
  const rawStatus = raw.status as string;
  let status: BubbleStatus;
  if (rawStatus === 'completed' || rawStatus === 'done') status = 'completed';
  else if (rawStatus === 'nearby') status = 'nearby';
  else status = 'floating'; // touched, drifted, floating → floating

  const completedAt = raw.completedAt
    ? new Date(raw.completedAt)
    : raw.doneAt
    ? new Date(raw.doneAt)
    : undefined;

  return {
    id: raw.id,
    text: raw.text,
    memo: raw.memo,
    status,
    sizeFactor: raw.sizeFactor ?? sizeFactorFromId(raw.id),
    createdAt: new Date(raw.createdAt),
    completedAt,
  };
}

type RawBubbleLog = {
  id: string;
  bubbleId: string;
  date: string;
  type: string; // 旧データは 'touched' がある可能性
  createdAt: string;
};

function toRawLog(l: BubbleLog): RawBubbleLog {
  return { ...l, createdAt: l.createdAt.toISOString() };
}

function fromRawLog(raw: RawBubbleLog): BubbleLog | null {
  // 旧 'touched' ログは廃止。'done' のみ残す
  if (raw.type !== 'done') return null;
  return {
    id: raw.id,
    bubbleId: raw.bubbleId,
    date: raw.date,
    type: 'done',
    createdAt: new Date(raw.createdAt),
  };
}

function loadBubbles(): Bubble[] {
  try {
    const raw = localStorage.getItem(BUBBLES_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as RawBubble[]).map(fromRawBubble);
  } catch {
    return [];
  }
}

function loadLogs(): BubbleLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as RawBubbleLog[])
      .map(fromRawLog)
      .filter((l): l is BubbleLog => l !== null);
  } catch {
    return [];
  }
}

function saveBubbles(bubbles: Bubble[]) {
  localStorage.setItem(BUBBLES_KEY, JSON.stringify(bubbles.map(toRawBubble)));
}

function saveLogs(logs: BubbleLog[]) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.map(toRawLog)));
}

// ── Supabase 行型 ──

interface BubbleRow {
  id: string;
  user_id: string;
  text: string;
  memo: string | null;
  status: string;
  size_factor: number;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

interface BubbleLogRow {
  id: string;
  bubble_id: string;
  user_id: string;
  date: string;
  type: string;
  created_at: string;
}

function fromRow(row: BubbleRow): Bubble {
  const rawStatus = row.status;
  let status: BubbleStatus;
  if (rawStatus === 'completed') status = 'completed';
  else if (rawStatus === 'nearby') status = 'nearby';
  else status = 'floating'; // touched, drifted → floating

  return {
    id: row.id,
    text: row.text,
    memo: row.memo ?? undefined,
    status,
    sizeFactor: row.size_factor,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

function fromLogRow(row: BubbleLogRow): BubbleLog | null {
  if (row.type !== 'done') return null;
  return {
    id: row.id,
    bubbleId: row.bubble_id,
    date: row.date,
    type: 'done',
    createdAt: new Date(row.created_at),
  };
}

function toRow(b: Bubble, userId: string): Omit<BubbleRow, 'updated_at'> {
  return {
    id: b.id,
    user_id: userId,
    text: b.text,
    memo: b.memo ?? null,
    status: b.status,
    size_factor: b.sizeFactor,
    created_at: b.createdAt.toISOString(),
    completed_at: b.completedAt?.toISOString() ?? null,
  };
}

function toLogRow(l: BubbleLog, userId: string): BubbleLogRow {
  return {
    id: l.id,
    bubble_id: l.bubbleId,
    user_id: userId,
    date: l.date,
    type: l.type,
    created_at: l.createdAt.toISOString(),
  };
}

// ── Supabase ヘルパー ──

async function fetchFromSupabase(userId: string) {
  const [bubblesRes, logsRes] = await Promise.all([
    supabase!
      .from('bubbles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase!
      .from('bubble_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'done')
      .order('created_at', { ascending: false }),
  ]);
  if (bubblesRes.error) throw bubblesRes.error;
  if (logsRes.error) throw logsRes.error;
  return {
    bubbles: (bubblesRes.data as BubbleRow[]).map(fromRow),
    logs: (logsRes.data as BubbleLogRow[])
      .map(fromLogRow)
      .filter((l): l is BubbleLog => l !== null),
  };
}

async function migrateToSupabase(
  userId: string,
  bubbles: Bubble[],
  logs: BubbleLog[]
) {
  if (bubbles.length === 0) return;
  await supabase!.from('bubbles').upsert(bubbles.map((b) => toRow(b, userId)));
  if (logs.length > 0) {
    await supabase!.from('bubble_logs').upsert(logs.map((l) => toLogRow(l, userId)));
  }
}

// ── 公開インターフェース ──

export interface UseBubblesReturn {
  bubbles: Bubble[];
  activeBubbles: Bubble[];   // floating + nearby（空に見えている泡）
  completedBubbles: Bubble[];

  addBubble: (text: string) => void;
  keepBubble: (id: string) => void;       // floating → nearby
  markDone: (id: string) => void;         // できた！（completed に + done ログ）
  markDoneToday: (id: string) => void;    // 今日はここまで（done ログのみ、状態維持）
  updateMemo: (id: string, memo: string) => void;
  removeBubble: (id: string) => void;

  logs: BubbleLog[];
  todayLogs: BubbleLog[];
  isBubbleDoneToday: (id: string) => boolean;
  getLogsForBubbleMonth: (bubbleId: string, year: number, month: number) => BubbleLog[];
  getDoneCountByDateForYear: (year: number) => Record<string, number>;
  getBubbleMonthlyDoneMap: (year: number) => Record<string, boolean[]>;
  todayDoneCount: number;
  totalCount: number;
  canAdd: boolean;
  isOnline: boolean;
}

export function useBubbles(): UseBubblesReturn {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => loadBubbles());
  const [logs, setLogs] = useState<BubbleLog[]>(() => loadLogs());
  const [userId, setUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  const syncedRef = useRef(false);

  // ── Supabase 認証状態を購読 ──
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Supabase から初回ロード・マイグレーション ──
  useEffect(() => {
    if (!userId || !supabase) return;

    (async () => {
      try {
        const { bubbles: sbBubbles, logs: sbLogs } = await fetchFromSupabase(userId);

        if (sbBubbles.length === 0) {
          const localBubbles = loadBubbles();
          const localLogs = loadLogs();
          if (localBubbles.length > 0) {
            await migrateToSupabase(userId, localBubbles, localLogs);
          }
        } else {
          setBubbles(sbBubbles);
          setLogs(sbLogs);
          saveBubbles(sbBubbles);
          saveLogs(sbLogs);
        }

        setIsOnline(true);
        syncedRef.current = true;
      } catch (err) {
        console.warn('Supabase sync failed — using localStorage:', err);
        setIsOnline(false);
      }
    })();
  }, [userId]);

  // ── localStorage に自動保存 ──
  useEffect(() => { saveBubbles(bubbles); }, [bubbles]);
  useEffect(() => { saveLogs(logs); }, [logs]);

  // ── Supabase 同期ヘルパー（fire-and-forget） ──

  const syncBubble = (bubble: Bubble) => {
    if (!userId || !supabase) return;
    supabase.from('bubbles').upsert(toRow(bubble, userId)).then(({ error }) => {
      if (error) console.warn('bubble sync error:', error.message);
    });
  };

  const syncBubbleUpdate = (id: string, patch: Record<string, unknown>) => {
    if (!userId || !supabase) return;
    supabase.from('bubbles').update(patch).eq('id', id).eq('user_id', userId).then(({ error }) => {
      if (error) console.warn('bubble update error:', error.message);
    });
  };

  const syncLog = (log: BubbleLog) => {
    if (!userId || !supabase) return;
    supabase.from('bubble_logs').upsert(toLogRow(log, userId)).then(({ error }) => {
      if (error) console.warn('log sync error:', error.message);
    });
  };

  // ── 派生データ ──

  const activeBubbles = bubbles.filter(
    (b) => b.status === 'floating' || b.status === 'nearby'
  );
  const completedBubbles = bubbles.filter((b) => b.status === 'completed');

  const today = todayJST();
  const todayLogs = logs.filter((l) => l.date === today);
  const todayDoneCount = todayLogs.length;
  const totalCount = bubbles.length;
  const canAdd = totalCount < FREE_BUBBLE_LIMIT;

  // ログ追加（同じ泡・日は重複しない）
  const addLog = (entry: Omit<BubbleLog, 'id' | 'createdAt'>) => {
    setLogs((prev) => {
      const exists = prev.some(
        (l) => l.bubbleId === entry.bubbleId && l.date === entry.date && l.type === entry.type
      );
      if (exists) return prev;
      const newLog: BubbleLog = { ...entry, id: crypto.randomUUID(), createdAt: new Date() };
      syncLog(newLog);
      return [...prev, newLog];
    });
  };

  // ── 操作関数 ──

  const addBubble = (text: string) => {
    if (!canAdd || !text.trim()) return;
    const newBubble: Bubble = {
      id: crypto.randomUUID(),
      text: text.trim(),
      status: 'floating',
      sizeFactor: 0.8 + Math.random() * 0.4,
      createdAt: new Date(),
    };
    setBubbles((prev) => [newBubble, ...prev]);
    syncBubble(newBubble);
  };

  // キープする（floating → nearby）
  const keepBubble = (id: string) => {
    setBubbles((prev) =>
      prev.map((b) => {
        if (b.id !== id || b.status !== 'floating') return b;
        const updated: Bubble = { ...b, status: 'nearby' };
        syncBubble(updated);
        return updated;
      })
    );
  };

  // できた！（completed に変更 + done ログ）
  const markDone = (id: string) => {
    const now = new Date();
    addLog({ bubbleId: id, date: today, type: 'done' });
    setBubbles((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated: Bubble = { ...b, status: 'completed', completedAt: now };
        syncBubble(updated);
        return updated;
      })
    );
  };

  // 今日はここまで（done ログのみ。状態変更なし）
  const markDoneToday = (id: string) => {
    addLog({ bubbleId: id, date: today, type: 'done' });
  };

  const updateMemo = (id: string, memo: string) => {
    setBubbles((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        syncBubbleUpdate(id, { memo });
        return { ...b, memo };
      })
    );
  };

  const removeBubble = (id: string) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setLogs((prev) => prev.filter((l) => l.bubbleId !== id));
    if (userId && supabase) {
      supabase.from('bubble_logs').delete().eq('bubble_id', id).eq('user_id', userId).then(({ error }) => {
        if (error) console.warn('log delete error:', error.message);
      });
      supabase.from('bubbles').delete().eq('id', id).eq('user_id', userId).then(({ error }) => {
        if (error) console.warn('bubble delete error:', error.message);
      });
    }
  };

  const isBubbleDoneToday = (id: string): boolean =>
    todayLogs.some((l) => l.bubbleId === id);

  const getDoneCountByDateForYear = (year: number): Record<string, number> => {
    const prefix = `${year}-`;
    const result: Record<string, number> = {};
    for (const log of logs) {
      if (log.type === 'done' && log.date.startsWith(prefix)) {
        result[log.date] = (result[log.date] ?? 0) + 1;
      }
    }
    return result;
  };

  const getBubbleMonthlyDoneMap = (year: number): Record<string, boolean[]> => {
    const map: Record<string, boolean[]> = {};
    for (const log of logs) {
      if (log.type === 'done' && log.date.startsWith(`${year}-`)) {
        const monthIdx = parseInt(log.date.slice(5, 7), 10) - 1;
        if (!map[log.bubbleId]) map[log.bubbleId] = Array(12).fill(false);
        map[log.bubbleId][monthIdx] = true;
      }
    }
    return map;
  };

  const getLogsForBubbleMonth = (bubbleId: string, year: number, month: number): BubbleLog[] => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return logs.filter((l) => l.bubbleId === bubbleId && l.type === 'done' && l.date.startsWith(prefix));
  };

  return {
    bubbles,
    activeBubbles,
    completedBubbles,
    addBubble,
    keepBubble,
    markDone,
    markDoneToday,
    updateMemo,
    removeBubble,
    logs,
    todayLogs,
    isBubbleDoneToday,
    getLogsForBubbleMonth,
    getDoneCountByDateForYear,
    getBubbleMonthlyDoneMap,
    todayDoneCount,
    totalCount,
    canAdd,
    isOnline,
  };
}
