/**
 * API client for status page endpoints.
 *
 * Authenticated routes use the JWT from the pulse_access_token cookie.
 * Public routes require no auth and are safe to call server-side.
 */
import { getToken, removeToken } from '@/lib/auth';
import type {
  DailyUptimeSummary,
  StatusPageData,
  StatusPageSettings,
  SetStatusPageMonitorsPayload,
  ReorderStatusPageMonitorsPayload,
  UpdateStatusPagePayload,
} from '@/types/status-page';

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

// ── Public endpoints (no auth) ────────────────────────────────────────────────

/**
 * Fetches the full public status page data by slug.
 * Called client-side by the auto-refresh wrapper.
 * Returns null on 404 (page not found or not public).
 */
export async function getPublicStatusPage(
  slug: string,
  signal?: AbortSignal,
): Promise<StatusPageData | null> {
  try {
    return await request<StatusPageData>(`/status/${slug}`, {
      auth: false,
      signal,
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) return null;
    throw err;
  }
}

/**
 * Fetches the daily uptime history for a specific monitor on a status page.
 * Called client-side for the expanded accordion view.
 */
export async function getMonitorUptimeHistory(
  slug: string,
  monitorId: string,
  days = 90,
  signal?: AbortSignal,
): Promise<DailyUptimeSummary[]> {
  return request<DailyUptimeSummary[]>(
    `/status/${slug}/monitors/${monitorId}/history?days=${days}`,
    { auth: false, signal },
  );
}

// ── Authenticated endpoints ───────────────────────────────────────────────────

/**
 * Gets the authenticated user's StatusPage settings.
 * Creates one with defaults if it doesn't exist yet (lazy init).
 */
export async function getMyStatusPage(): Promise<StatusPageSettings> {
  return request<StatusPageSettings>('/status-page');
}

/**
 * Updates the authenticated user's StatusPage settings.
 */
export async function updateMyStatusPage(
  payload: UpdateStatusPagePayload,
): Promise<StatusPageSettings> {
  return request<StatusPageSettings>('/status-page', {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Replaces the full monitor list on the status page.
 */
export async function setStatusPageMonitors(
  payload: SetStatusPageMonitorsPayload,
): Promise<void> {
  return request<void>('/status-page/monitors', {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Updates the display order of monitors on the status page.
 */
export async function reorderStatusPageMonitors(
  payload: ReorderStatusPageMonitorsPayload,
): Promise<void> {
  return request<void>('/status-page/monitors/reorder', {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Fetches the preview data for the authenticated user's status page.
 * Works even when isPublic is false.
 */
export async function previewStatusPage(): Promise<StatusPageData | null> {
  try {
    return await request<StatusPageData>('/status-page/preview');
  } catch {
    return null;
  }
}

/**
 * Checks whether a slug is available.
 *
 * TODO(backend): Add GET /api/status-page/check-slug?slug=xxx endpoint
 * that returns { available: boolean }. Until then, this returns null
 * (unknown) so the UI silently skips the inline check.
 */
export async function checkSlugAvailability(
  slug: string,
  signal?: AbortSignal,
): Promise<boolean | null> {
  try {
    const result = await request<{ available: boolean }>(
      `/status-page/check-slug?slug=${encodeURIComponent(slug)}`,
      { signal },
    );
    return result.available;
  } catch {
    // Endpoint not yet implemented — graceful degradation
    return null;
  }
}
