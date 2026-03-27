import { useState, useEffect, useRef, useCallback } from 'react';
import type { LagoonBubble, LagoonSound, LagoonMode } from '../types/bluelagoon';
import { supabase } from '../lib/supabase';
import { LAGOON_SOUND_CONFIG } from '../lib/constants';
import { LAGOON_SE, playSE } from '../lib/lagoonConfig';

// ── BGMループ ──
interface LoopSound {
  play: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  unload: () => void;
}

const LOOP_CROSSFADE_SECONDS = 0.55;
const LOOP_SCHEDULE_AHEAD_SECONDS = 2.5;
const LOOP_SCHEDULER_INTERVAL_MS = 100;
const audioBufferCache = new Map<string, Promise<AudioBuffer>>();
let sharedAudioContext: AudioContext | null = null;
const LAGOON_VOLUME_KEY = 'pukari-lagoon-volume';

type LoopOptions = {
  loopTrimStartSeconds?: number;
  loopTrimEndSeconds?: number;
};

function getAudioContext(): AudioContext {
  if (sharedAudioContext) return sharedAudioContext;

  const Ctor = window.AudioContext
    || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    throw new Error('Web Audio API is not supported');
  }
  sharedAudioContext = new Ctor();
  return sharedAudioContext;
}

async function loadAudioBuffer(context: AudioContext, src: string): Promise<AudioBuffer> {
  const cached = audioBufferCache.get(src);
  if (cached) return cached;

  const promise = fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch audio: ${src}`);
      return res.arrayBuffer();
    })
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer));

  audioBufferCache.set(src, promise);
  return promise;
}

function createLoopSound(srcs: string[], volume: number = 0.4, options: LoopOptions = {}): LoopSound {
  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let playing = false;
  let playToken = 0;
  let schedulerId: number | null = null;
  let nextStartTime: number | null = null;
  let loadedBuffer: AudioBuffer | null = null;
  const activeSources = new Set<AudioBufferSourceNode>();

  const clearScheduler = () => {
    if (schedulerId !== null) {
      window.clearInterval(schedulerId);
      schedulerId = null;
    }
  };

  const stopSources = () => {
    clearScheduler();
    nextStartTime = null;
    activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
      source.disconnect();
    });
    activeSources.clear();
  };

  const ensureContext = () => {
    if (!context) {
      context = getAudioContext();
      masterGain = context.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(context.destination);
    }
    return context;
  };

  const scheduleSegment = (buffer: AudioBuffer, startedAt: number, token: number) => {
    if (!playing || !context || !masterGain || token !== playToken) return;

    const source = context.createBufferSource();
    const gain = context.createGain();
    const loopStart = Math.max(0, options.loopTrimStartSeconds ?? 0);
    const loopEnd = Math.max(loopStart + 0.1, buffer.duration - (options.loopTrimEndSeconds ?? 0));
    const loopDuration = Math.max(0.1, loopEnd - loopStart);
    const fade = Math.min(LOOP_CROSSFADE_SECONDS, loopDuration / 4);
    const endTime = startedAt + loopDuration;
    const nextStart = Math.max(startedAt, endTime - fade);

    source.buffer = buffer;
    source.connect(gain);
    gain.connect(masterGain);

    gain.gain.setValueAtTime(0, startedAt);
    gain.gain.linearRampToValueAtTime(volume, startedAt + fade);
    gain.gain.setValueAtTime(volume, nextStart);
    gain.gain.linearRampToValueAtTime(0, endTime);

    source.start(startedAt, loopStart, loopDuration);
    source.stop(endTime);
    activeSources.add(source);
    source.onended = () => {
      activeSources.delete(source);
      source.disconnect();
      gain.disconnect();
    };
  };

  const pickBuffer = async (contextForDecode: AudioContext) => {
    let lastError: unknown = null;
    for (const src of srcs) {
      try {
        return await loadAudioBuffer(contextForDecode, src);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Failed to load loop audio');
  };

  const pumpScheduler = (token: number) => {
    if (!playing || !context || !loadedBuffer || token !== playToken || nextStartTime === null) return;

    const buffer = loadedBuffer;
    const loopStart = Math.max(0, options.loopTrimStartSeconds ?? 0);
    const loopEnd = Math.max(loopStart + 0.1, buffer.duration - (options.loopTrimEndSeconds ?? 0));
    const loopDuration = Math.max(0.1, loopEnd - loopStart);
    const fade = Math.min(LOOP_CROSSFADE_SECONDS, loopDuration / 4);
    const step = Math.max(0.1, loopDuration - fade);

    const targetTime = context.currentTime + LOOP_SCHEDULE_AHEAD_SECONDS;
    while (nextStartTime < targetTime) {
      scheduleSegment(buffer, nextStartTime, token);
      nextStartTime += step;
    }
  };

  return {
    play() {
      playing = true;
      const token = ++playToken;
      const ctx = ensureContext();

      void (async () => {
        try {
          await ctx.resume().catch(() => {});
          const buffer = await pickBuffer(ctx);
          if (!playing || token !== playToken) return;

          loadedBuffer = buffer;
          nextStartTime = ctx.currentTime + 0.02;
          pumpScheduler(token);
          clearScheduler();
          schedulerId = window.setInterval(() => {
            pumpScheduler(token);
          }, LOOP_SCHEDULER_INTERVAL_MS);
        } catch (error) {
          console.warn('Lagoon audio play failed:', error);
        }
      })();
    },
    stop() {
      playing = false;
      playToken += 1;
      stopSources();
    },
    setVolume(v: number) {
      volume = v;
      if (masterGain) masterGain.gain.value = v;
    },
    unload() {
      playing = false;
      playToken += 1;
      stopSources();
    },
  };
}

// ── Supabase 行型 ──
interface LagoonBubbleRow {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

function fromRow(row: LagoonBubbleRow): LagoonBubble {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    createdAt: new Date(row.created_at),
  };
}

// ── 公開インターフェース ──
export interface UseLagoonReturn {
  isInLagoon: boolean;
  enterLagoon: (
    message: string,
    sourceBubbleId?: string | null,
    sourceBubbleText?: string | null,
  ) => Promise<void>;
  exitLagoon: () => Promise<void>;
  entryBubbleId: string | null;
  entryBubbleText: string | null;

  myBubble: LagoonBubble | null;
  otherBubbles: LagoonBubble[];
  participantCount: number;

  mode: LagoonMode;
  sound: LagoonSound;
  setSound: (sound: LagoonSound) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

export function useLagoon(): UseLagoonReturn {
  const [isInLagoon, setIsInLagoon] = useState(false);
  const [myBubble, setMyBubble] = useState<LagoonBubble | null>(null);
  const [otherBubbles, setOtherBubbles] = useState<LagoonBubble[]>([]);
  const [entryBubbleId, setEntryBubbleId] = useState<string | null>(null);
  const [entryBubbleText, setEntryBubbleText] = useState<string | null>(null);
  const [sound, setSoundState] = useState<LagoonSound>('none');
  const [userId, setUserId] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 0.4;
    const raw = window.localStorage.getItem(LAGOON_VOLUME_KEY);
    const parsed = raw === null ? 0.4 : Number(raw);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.4;
  });

  // BGM 用ループインスタンス
  const audioRef = useRef<LoopSound | null>(null);

  // ── Supabase 認証状態を取得 ──
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LAGOON_VOLUME_KEY, String(volume));
  }, [volume]);

  // ── Supabase Realtime サブスクリプション（入室中のみ） ──
  useEffect(() => {
    const client = supabase;
    if (!isInLagoon || !client || !userId) return;

    // 1. 先にチャンネルを登録（SELECT の前に開始してイベントを取りこぼさない）
    const channel = client
      .channel('lagoon-room')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lagoon_bubbles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as LagoonBubbleRow;
            if (newRow.user_id === userId) return;
            // 副作用（SE再生）は state updater の外で行う
            setOtherBubbles((prev) => {
              if (prev.some((b) => b.id === newRow.id)) return prev;
              return [...prev, fromRow(newRow)];
            });
            playSE(LAGOON_SE.enter);
            window.setTimeout(() => {
              playSE(LAGOON_SE.otherEnter);
            }, 120);
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setOtherBubbles((prev) => prev.filter((b) => b.id !== oldId));
          }
        }
      )
      .subscribe();

    // 2. 入室前から既にいるユーザーを取得（SELECT は subscribe の後）
    // Realtime で届いたイベントを上書き消去しないよう「マージ」する
    client
      .from('lagoon_bubbles')
      .select('*')
      .neq('user_id', userId)
      .then(({ data }) => {
        if (!data) return;
        const fromSelect = (data as LagoonBubbleRow[]).map(fromRow);
        setOtherBubbles((prev) => {
          // SELECT 結果を base にして、Realtime で既に届いているものは保持
          const merged = [...fromSelect];
          for (const b of prev) {
            if (!merged.some((x) => x.id === b.id)) merged.push(b);
          }
          return merged;
        });
      });

    return () => {
      void client.removeChannel(channel).catch((error) => {
        console.warn('Lagoon channel cleanup failed:', error);
      });
    };
  }, [isInLagoon, userId]);

  // ── BGM 再生 / 停止 ──
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.stop();
      audioRef.current.unload();
      audioRef.current = null;
    }
  }, []);

  const playAudio = useCallback((src: string[], soundConfig: typeof LAGOON_SOUND_CONFIG[keyof typeof LAGOON_SOUND_CONFIG], targetVolume: number) => {
    stopAudio();
    const loop = createLoopSound(src, targetVolume, {
      loopTrimStartSeconds: soundConfig.loopTrimStartSeconds,
      loopTrimEndSeconds: soundConfig.loopTrimEndSeconds,
    });
    loop.play();
    audioRef.current = loop;
  }, [stopAudio]);

  // アンマウント時に停止
  useEffect(() => () => stopAudio(), [stopAudio]);

  // ── 派生値: 人数は実際の参加者数に合わせる ──
  const mode: LagoonMode = sound === 'none' ? 'together' : 'solo';
  const participantCount = otherBubbles.length + (myBubble ? 1 : 0);

  // ── 入室 ──
  const enterLagoon = useCallback(async (
    message: string,
    sourceBubbleId?: string | null,
    sourceBubbleText?: string | null,
  ) => {
    console.log('supabase client:', supabase ? 'connected' : 'null');
    setEntryBubbleId(sourceBubbleId ?? null);
    setEntryBubbleText(sourceBubbleText ?? null);

    if (!supabase) {
      // Supabase 未接続 → ローカルモード
      setMyBubble({ id: crypto.randomUUID(), userId: 'local', message, createdAt: new Date() });
      setIsInLagoon(true);
      playSE(LAGOON_SE.enter);
      return;
    }

    // state の userId ではなく getUser() で直接取得する（タイミング依存を排除）
    const { data: { user } } = await supabase.auth.getUser();
    console.log('auth user:', user?.id ?? 'null（未認証）');

    if (!user) {
      // 認証なし → ローカルモード
      setMyBubble({ id: crypto.randomUUID(), userId: 'local', message, createdAt: new Date() });
      setIsInLagoon(true);
      playSE(LAGOON_SE.enter);
      return;
    }

    // myBubble は DB レスポンスに依存せず直接生成
    setMyBubble({ id: crypto.randomUUID(), userId: user.id, message, createdAt: new Date() });

    // userId state が未更新のときは補完（Realtime subscription のため）
    if (!userId) setUserId(user.id);

    setIsInLagoon(true);
    playSE(LAGOON_SE.enter);

    void (async () => {
      try {
        // 古いレコードを削除
        await supabase.from('lagoon_bubbles').delete().eq('user_id', user.id);

        // INSERT と SELECT を分離（SELECT の失敗で INSERT が見えなくなるのを防ぐ）
        const { error } = await supabase
          .from('lagoon_bubbles')
          .insert({ user_id: user.id, message });

        if (error) {
          console.error('Lagoon INSERT error:', error);
        }
      } catch (err) {
        console.error('lagoon enter error:', err);
      }
    })();
  }, [userId]);

  // ── 退出 ──
  const exitLagoon = useCallback(async () => {
    if (supabase && userId) {
      supabase
        .from('lagoon_bubbles')
        .delete()
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.warn('lagoon exit error:', error.message);
        });
    }
    stopAudio();
    setMyBubble(null);
    setOtherBubbles([]);
    setIsInLagoon(false);
    setEntryBubbleId(null);
    setEntryBubbleText(null);
    setSoundState('none');
  }, [userId, stopAudio]);

  // ── サウンド変更（背景も連動） ──
  const setSound = useCallback((s: LagoonSound) => {
    setSoundState(s);
    stopAudio();
    const soundConfig = LAGOON_SOUND_CONFIG[s];
    const src = soundConfig.soundFiles;
    if (src) playAudio(src, soundConfig, volume);
  }, [stopAudio, playAudio, volume]);

  const setVolume = useCallback((v: number) => {
    const next = Math.min(1, Math.max(0, v));
    setVolumeState(next);
    if (audioRef.current) {
      audioRef.current.setVolume(next);
    }
  }, []);

  return {
    isInLagoon,
    enterLagoon,
    exitLagoon,
    entryBubbleId,
    entryBubbleText,
    myBubble,
    otherBubbles,
    participantCount,
    mode,
    sound,
    setSound,
    volume,
    setVolume,
  };
}
