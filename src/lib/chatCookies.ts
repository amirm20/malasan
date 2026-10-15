/**
 * Cookie management for Malasban Live Chat
 * Allows guest users without account to maintain conversation history across sessions
 */

const GUEST_COOKIE_KEY = 'malasban_chat_guest';
const COOKIE_MAX_AGE_DAYS = 365;

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export function setCookie(name: string, value: string, days = COOKIE_MAX_AGE_DAYS): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Returns existing guest ID from cookie (or localStorage fallback), or generates a new one.
 */
export function getOrCreateChatGuestId(): string {
  if (typeof window === 'undefined') {
    return 'gst-ssr';
  }

  // 1. Try cookie
  let guestId = getCookie(GUEST_COOKIE_KEY);

  // 2. Try localStorage if cookie was missing
  if (!guestId) {
    try {
      guestId = localStorage.getItem(GUEST_COOKIE_KEY);
    } catch {}
  }

  // 3. Generate fresh guest ID if none found
  if (!guestId || !guestId.startsWith('gst-')) {
    const rand = Math.random().toString(36).substring(2, 9);
    const time = Date.now().toString(36);
    guestId = `gst-${time}-${rand}`;
  }

  // Ensure persisted in both cookie and localStorage
  try {
    setCookie(GUEST_COOKIE_KEY, guestId, COOKIE_MAX_AGE_DAYS);
    localStorage.setItem(GUEST_COOKIE_KEY, guestId);
  } catch {}

  return guestId;
}
