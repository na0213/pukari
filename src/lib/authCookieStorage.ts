const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10;
const AUTH_COOKIE_CHUNK_SIZE = 1800;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isSecureContext(): boolean {
  return isBrowser() && window.location.protocol === 'https:';
}

function getCookieName(storageKey: string): string {
  return encodeURIComponent(storageKey);
}

function getChunkCountCookieName(storageKey: string): string {
  return `${getCookieName(storageKey)}.chunks`;
}

function getChunkCookieName(storageKey: string, index: number): string {
  return `${getCookieName(storageKey)}.${index}`;
}

function readCookieRaw(cookieName: string): string | null {
  if (!isBrowser()) return null;

  const name = `${cookieName}=`;
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    if (cookie.startsWith(name)) {
      return cookie.slice(name.length);
    }
  }

  return null;
}

function readCookie(storageKey: string): string | null {
  const raw = readCookieRaw(getCookieName(storageKey));
  return raw ? decodeURIComponent(raw) : null;
}

function readChunkedCookie(storageKey: string): string | null {
  const countRaw = readCookieRaw(getChunkCountCookieName(storageKey));
  if (!countRaw) return null;

  const chunkCount = Number(countRaw);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0) return null;

  let merged = '';
  for (let i = 0; i < chunkCount; i += 1) {
    const chunk = readCookieRaw(getChunkCookieName(storageKey, i));
    if (chunk === null) return null;
    merged += chunk;
  }

  return decodeURIComponent(merged);
}

function writeCookie(storageKey: string, value: string): void {
  if (!isBrowser()) return;

  const secure = isSecureContext() ? '; Secure' : '';
  document.cookie = `${getCookieName(storageKey)}=${encodeURIComponent(value)}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function writeChunkedCookie(storageKey: string, value: string): void {
  if (!isBrowser()) return;

  const encoded = encodeURIComponent(value);
  const chunkCount = Math.max(1, Math.ceil(encoded.length / AUTH_COOKIE_CHUNK_SIZE));
  const secure = isSecureContext() ? '; Secure' : '';

  deleteCookie(storageKey);

  for (let i = 0; i < chunkCount; i += 1) {
    const chunk = encoded.slice(i * AUTH_COOKIE_CHUNK_SIZE, (i + 1) * AUTH_COOKIE_CHUNK_SIZE);
    document.cookie = `${getChunkCookieName(storageKey, i)}=${chunk}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  }

  document.cookie = `${getChunkCountCookieName(storageKey)}=${chunkCount}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function deleteCookie(storageKey: string): void {
  if (!isBrowser()) return;

  const secure = isSecureContext() ? '; Secure' : '';
  document.cookie = `${getCookieName(storageKey)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  document.cookie = `${getChunkCountCookieName(storageKey)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  for (let i = 0; i < 8; i += 1) {
    document.cookie = `${getChunkCookieName(storageKey, i)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }
}

export function createAuthCookieStorage() {
  return {
    getItem(key: string): string | null {
      return readChunkedCookie(key) ?? readCookie(key);
    },
    setItem(key: string, value: string): void {
      const encodedLength = encodeURIComponent(value).length;
      if (encodedLength > AUTH_COOKIE_CHUNK_SIZE) {
        writeChunkedCookie(key, value);
        return;
      }
      deleteCookie(key);
      writeCookie(key, value);
    },
    removeItem(key: string): void {
      deleteCookie(key);
    },
  };
}

export function migrateAuthSessionFromLocalStorage(storageKey: string): void {
  if (!isBrowser()) return;

  const cookieValue = readChunkedCookie(storageKey) ?? readCookie(storageKey);
  if (cookieValue) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  const legacyValue = window.localStorage.getItem(storageKey);
  if (!legacyValue) return;

  writeChunkedCookie(storageKey, legacyValue);
  window.localStorage.removeItem(storageKey);
}

export function getSupabaseAuthStorageKey(supabaseUrl: string): string | null {
  try {
    const url = new URL(supabaseUrl);
    const projectRef = url.hostname.split('.')[0];
    if (!projectRef) return null;
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}
