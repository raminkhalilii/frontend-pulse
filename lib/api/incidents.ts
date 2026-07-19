/**
 * API client for incident endpoints.
 *
 * Authenticated routes live at /api/status-page/incidents/*
 * Public routes live at /api/status/:slug/incidents
 */
import { getToken, removeToken } from '@/lib/auth';
import type {
  Incident,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  PostIncidentUpdatePayload,
} from '@/types/incident';

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
 * Returns all incidents for the authenticated user's status page.
 * Includes active incidents + those resolved within the last 14 days.
 */
export async function listIncidents(): Promise<Incident[]> {
  return request<Incident[]>('/status-page/incidents');
}

/** Returns a single incident by ID. */
export async function getIncident(id: string): Promise<Incident> {
  return request<Incident>(`/status-page/incidents/${id}`);
}

/** Creates a new incident (manual). */
export async function createIncident(payload: CreateIncidentPayload): Promise<Incident> {
  return request<Incident>('/status-page/incidents', {
    method: 'POST',
    body: payload,
  });
}

/** Updates incident title / impact / status. */
export async function updateIncident(
  id: string,
  payload: UpdateIncidentPayload,
): Promise<Incident> {
  return request<Incident>(`/status-page/incidents/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Posts a new timeline update to an incident.
 * The incident status is updated to match dto.status.
 * Posting with status=RESOLVED is equivalent to resolving the incident.
 */
export async function postIncidentUpdate(
  id: string,
  payload: PostIncidentUpdatePayload,
): Promise<Incident> {
  return request<Incident>(`/status-page/incidents/${id}/updates`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Resolves the incident via the convenience shortcut.
 * Posts a "Incident resolved." update automatically.
 */
export async function resolveIncident(id: string): Promise<Incident> {
  return request<Incident>(`/status-page/incidents/${id}/resolve`, {
    method: 'POST',
  });
}

/** Soft-deletes an incident. Only valid for manually created incidents. */
export async function deleteIncident(id: string): Promise<void> {
  return request<void>(`/status-page/incidents/${id}`, {
    method: 'DELETE',
  });
}

// ── Public endpoints ──────────────────────────────────────────────────────────

/**
 * Returns paginated active + recent incidents for a public status page.
 * Called by the "Load older incidents" button on the public page.
 * Returns [] on any error (graceful degradation).
 */
export async function getPublicIncidents(
  slug: string,
  limit = 10,
  offset = 0,
  signal?: AbortSignal,
): Promise<Incident[]> {
  try {
    return await request<Incident[]>(
      `/status/${slug}/incidents?limit=${limit}&offset=${offset}`,
      { auth: false, signal },
    );
  } catch {
    return [];
  }
}
