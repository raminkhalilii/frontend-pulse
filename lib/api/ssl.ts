/**
 * API client for SSL certificate endpoints.
 *
 * Authenticated route lives at /api/monitors/:monitorId/ssl
 */
import { getToken, removeToken } from '@/lib/auth';
import type { SslCertificate } from '@/types/ssl';

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

  // NestJS sends an empty body (not the JSON literal "null") when a controller
  // returns null — res.json() would throw on that, so parse manually.
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ── Authenticated endpoints ───────────────────────────────────────────────────

/** Gets the latest SSL certificate state for a monitor, or null if never checked yet. */
export async function getSslCertificate(monitorId: string): Promise<SslCertificate | null> {
  return request<SslCertificate | null>(`/monitors/${monitorId}/ssl`);
}
