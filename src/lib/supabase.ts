import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthCookieStorage, getSupabaseAuthStorageKey, migrateAuthSessionFromLocalStorage } from './authCookieStorage';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? '';

// 有効なhttps URLかどうかを確認
function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const authStorageKey = getSupabaseAuthStorageKey(supabaseUrl);

if (authStorageKey) {
  migrateAuthSessionFromLocalStorage(authStorageKey);
}

// supabase が null のときはオフラインモードで動作
export const supabase: SupabaseClient | null =
  isValidHttpsUrl(supabaseUrl) && Boolean(supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: createAuthCookieStorage(),
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseEnabled = supabase !== null;

// デバッグ確認用ログ
console.log('Supabase URL:', supabaseUrl || '（未設定）');
console.log('Supabase enabled:', isSupabaseEnabled);
