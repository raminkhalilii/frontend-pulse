/**
 * Token management for the Pulse access token.
 *
 * The access token is stored in a non-httpOnly cookie so that:
 *  - Client-side code can read/write it (document.cookie)
 *  - Next.js middleware can read it server-side (request.cookies)
 *
 * The refresh token is managed exclusively by the backend as an httpOnly cookie.
 */

export const TOKEN_COOKIE = 'pulse_access_token';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function setToken(token: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax${secure}`;
}

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function removeToken(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

/**
 * Client-side JWT decode for display purposes only (no signature check).
 * The payload only carries `sub` and `email` (see backend AuthService.generateTokens) —
 * there is no `/users/me` endpoint, so this is the only source of user info the
 * frontend has.
 */
export function parseJwtEmail(token: string | null): string | null {
  if (!token) return null;
  try {
    const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(segment)) as Record<string, unknown>;
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}
