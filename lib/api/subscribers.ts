/**
 * API client for subscriber endpoints.
 *
 * Authenticated routes use the JWT from the pulse_access_token cookie.
 * All calls follow the same request<T>() pattern as lib/api/status-page.ts.
 */
import { getToken, removeToken } from '@/lib/auth';
import type {
  SubscriberStats,
  SubscriberListResponse,
} from '@/types/subscriber';

const API_BASE = '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers: extraHeaders, signal, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    signal,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth !== false) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message =
      (payload as { message?: string | string[] } | null)?.message ??
      `Request failed: ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Authenticated endpoints ───────────────────────────────────────────────────

/**
 * Returns aggregate subscriber counts for the authenticated user's status page.
 * Throws NotFoundException if the status page hasn't been initialised yet.
 */
export async function getSubscriberStats(): Promise<SubscriberStats> {
  return request<SubscriberStats>('/status-page/subscribers/stats');
}

/**
 * Returns a paginated list of confirmed subscribers (masked emails).
 * Throws NotFoundException if the status page hasn't been initialised yet.
 */
export async function getSubscriberList(
  limit = 20,
  offset = 0,
): Promise<SubscriberListResponse> {
  return request<SubscriberListResponse>(
    `/status-page/subscribers?limit=${limit}&offset=${offset}`,
  );
}
