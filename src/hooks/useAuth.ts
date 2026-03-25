import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const AUTH_TIMEOUT_MS = 5000;

// ==========================================
// Supabase Google OAuth 設定手順:
//
// 1. Google Cloud Console (https://console.cloud.google.com)
//    - プロジェクト作成
//    - 「APIとサービス」→「認証情報」
//    - 「OAuth 2.0 クライアント ID」を作成
//    - アプリケーションの種類: ウェブアプリケーション
//    - 承認済みリダイレクト URI に以下を追加:
//      https://xxxxxxxx.supabase.co/auth/v1/callback
//      （xxxxxxxx は自分のSupabase Project ID）
//    - クライアントIDとクライアントシークレットをメモ
//
// 2. Supabase Dashboard
//    - Authentication → Providers → Google
//    - 「Enable Google provider」を ON
//    - Client ID と Client Secret を入力
//    - 「Save」
//
// 3. Vercel デプロイ時:
//    - 環境変数は既存の VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY のみ
//    - Google OAuth の設定は Supabase 側で完結する
// ==========================================

export interface UseAuthReturn {
  user: User | null;
  isAnonymous: boolean;
  isLoading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  linkGoogleAccount: () => Promise<{ error?: string }>;
  updateDisplayName: (name: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  displayName: string;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(supabase !== null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);

  const loadProfileDisplayName = useCallback(async (userId: string | null) => {
    if (!supabase || !userId) {
      setProfileDisplayName(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('loadProfileDisplayName failed:', error);
      setProfileDisplayName(null);
      return;
    }

    setProfileDisplayName((data?.display_name as string | null) ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      void loadProfileDisplayName(newUser?.id ?? null);
    });

    // 既存セッションを確認（自動匿名ログインはしない）
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        console.warn('Supabase auth timeout — continuing in offline mode');
        setIsLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    (async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (cancelled) return;
        setUser(session?.user ?? null);
        await loadProfileDisplayName(session?.user.id ?? null);
      } catch (err) {
        console.warn('Supabase auth failed:', err);
      } finally {
        clearTimeout(timer);
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [loadProfileDisplayName]);

  const isAnonymous = user?.is_anonymous ?? true; // supabase未接続時もゲスト扱い

  const displayName = useMemo(() => {
    if (!user || user.is_anonymous) return 'ゲスト';
    const metadataDisplayName = user.user_metadata?.display_name as string | undefined;
    const metadataFullName = user.user_metadata?.full_name as string | undefined;
    const metadataName = user.user_metadata?.name as string | undefined;
    return (
      profileDisplayName?.trim()
      ?? metadataDisplayName
      ?? metadataFullName
      ?? metadataName
      ?? user.email
    ?? 'ユーザー'
  );
  }, [profileDisplayName, user]);

  const deleteCurrentUserData = useCallback(async (): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase not connected' };
    const uid = user?.id;
    if (!uid) return { error: 'Not authenticated' };

    const { error } = await supabase.functions.invoke('smart-service', {
      body: {},
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  }, [user]);

  const signInAnonymously = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) console.warn('Anonymous sign-in failed:', error);
      else if (data.user) setUser(data.user);
    } catch (err) {
      console.warn('signInAnonymously error:', err);
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase not connected' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const linkGoogleAccount = useCallback(async (): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase not connected' };
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const updateDisplayName = useCallback(async (name: string): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase not connected' };
    if (!user) return { error: 'Not authenticated' };
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Name is empty' };

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: trimmed,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { error: error.message };
    }

    setProfileDisplayName(trimmed);
    return {};
  }, [user]);

  const deleteAccount = useCallback(async (): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase not connected' };
    const cleanup = await deleteCurrentUserData();
    if (cleanup.error) {
      return cleanup;
    }

    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    setUser(null);
    setProfileDisplayName(null);
    return {};
  }, [deleteCurrentUserData]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    setUser(null);
    setProfileDisplayName(null);
  }, []);

  return {
    user,
    isAnonymous,
    isLoading,
    signInAnonymously,
    signInWithGoogle,
    linkGoogleAccount,
    updateDisplayName,
    deleteAccount,
    signOut,
    displayName,
  };
}
