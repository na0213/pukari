import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AUTH_TIMEOUT_MS = 5000;

export function useAuth() {
  // Supabase未設定ならローディングなしで即時完了
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) {
      // localStorageモードで動作。認証不要。
      return;
    }

    let cancelled = false;

    // タイムアウト付きで認証を試みる
    const timer = setTimeout(() => {
      if (!cancelled) {
        console.warn('Supabase auth timeout — continuing in offline mode');
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    (async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (cancelled) return;

        if (!session) {
          // 初回: 匿名ログイン
          await supabase!.auth.signInAnonymously();
        }
      } catch (err) {
        console.warn('Supabase auth failed — continuing in offline mode:', err);
      } finally {
        clearTimeout(timer);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return { loading };
}
