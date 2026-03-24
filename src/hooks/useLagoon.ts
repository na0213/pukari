import { useState, useEffect, useRef, useCallback } from 'react';
import type { LagoonBubble, LagoonSound, LagoonMode } from '../types/bluelagoon';
import { supabase } from '../lib/supabase';
import { LAGOON_SOUND_CONFIG } from '../lib/constants';
import { LAGOON_SE, playSE } from '../lib/lagoonConfig';

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
  enterLagoon: (message: string) => Promise<void>;
  exitLagoon: () => Promise<void>;

  myBubble: LagoonBubble | null;
  otherBubbles: LagoonBubble[];
  participantCount: number;

  mode: LagoonMode;
  sound: LagoonSound;
  setSound: (sound: LagoonSound) => void;
}

export function useLagoon(): UseLagoonReturn {
  const [isInLagoon, setIsInLagoon] = useState(false);
  const [myBubble, setMyBubble] = useState<LagoonBubble | null>(null);
  const [otherBubbles, setOtherBubbles] = useState<LagoonBubble[]>([]);
  const [sound, setSoundState] = useState<LagoonSound>('none');
  const [userId, setUserId] = useState<string | null>(null);

  // BGM 用 Audio インスタンス
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // ── Supabase Realtime サブスクリプション（入室中のみ） ──
  useEffect(() => {
    if (!isInLagoon || !supabase || !userId) return;

    supabase
      .from('lagoon_bubbles')
      .select('*')
      .neq('user_id', userId)
      .then(({ data }) => {
        if (data) setOtherBubbles((data as LagoonBubbleRow[]).map(fromRow));
      });

    const channel = supabase
      .channel('lagoon-room')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lagoon_bubbles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as LagoonBubbleRow;
            if (newRow.user_id === userId) return;
            setOtherBubbles((prev) => {
              if (prev.some((b) => b.id === newRow.id)) return prev;
              playSE(LAGOON_SE.otherEnter);
              return [...prev, fromRow(newRow)];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setOtherBubbles((prev) => prev.filter((b) => b.id !== oldId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isInLagoon, userId]);

  // ── BGM 再生 / 停止 ──
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  const playAudio = useCallback((src: string) => {
    stopAudio();
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.4;
    audio.play().catch(() => {}); // ファイルがなければ無音
    audioRef.current = audio;
  }, [stopAudio]);

  // アンマウント時に停止
  useEffect(() => () => stopAudio(), [stopAudio]);

  // ── 派生値: sound === 'none' → together、それ以外 → solo ──
  const mode: LagoonMode = sound === 'none' ? 'together' : 'solo';
  const participantCount = mode === 'together' ? otherBubbles.length + 1 : 1;

  // ── 入室 ──
  const enterLagoon = useCallback(async (message: string) => {
    if (!supabase || !userId) {
      const bubble: LagoonBubble = {
        id: crypto.randomUUID(),
        userId: 'local',
        message,
        createdAt: new Date(),
      };
      setMyBubble(bubble);
      setIsInLagoon(true);
      playSE(LAGOON_SE.enter);
      return;
    }

    try {
      await supabase.from('lagoon_bubbles').delete().eq('user_id', userId);

      const { data } = await supabase
        .from('lagoon_bubbles')
        .insert({ user_id: userId, message })
        .select()
        .single();

      if (data) setMyBubble(fromRow(data as LagoonBubbleRow));
    } catch (err) {
      console.warn('lagoon enter error:', err);
      const bubble: LagoonBubble = {
        id: crypto.randomUUID(),
        userId: userId ?? 'local',
        message,
        createdAt: new Date(),
      };
      setMyBubble(bubble);
    }

    setIsInLagoon(true);
    playSE(LAGOON_SE.enter);
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
    setSoundState('none');
  }, [userId, stopAudio]);

  // ── サウンド変更（背景も連動） ──
  const setSound = useCallback((s: LagoonSound) => {
    setSoundState(s);
    stopAudio();
    const src = LAGOON_SOUND_CONFIG[s]?.soundFile;
    if (src) playAudio(src);
  }, [stopAudio, playAudio]);

  return {
    isInLagoon,
    enterLagoon,
    exitLagoon,
    myBubble,
    otherBubbles,
    participantCount,
    mode,
    sound,
    setSound,
  };
}
