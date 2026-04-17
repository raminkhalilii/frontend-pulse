import { getToken, removeToken, setToken } from './auth';
import type {
  AlertChannel,
  AuthResponse,
  CreateAlertChannelPayload,
  CreateMonitorPayload,
  Monitor,
  UpdateAlertChannelPayload,
  UpdateMonitorPayload,
  WebhookDeliveryLog,
  WebhookTestResult,
} from '@/types';

/**
 * All API requests go through the Next.js rewrite proxy at /api,
 * which forwards them to the NestJS backend — no CORS required.
 */
const API_BASE = '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Set to false only for public endpoints (login, register) */
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers: extraHeaders, ...rest } = options;

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

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  name: string,
  password: string,
): Promise<void> {
  const data = await request<AuthResponse>('/auth', {
    method: 'POST',
    auth: false,
    body: { email, name, password },
  });
  setToken(data.accessToken);
}

export async function loginUser(email: string, password: string): Promise<void> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  setToken(data.accessToken);
}

// ── Monitors ──────────────────────────────────────────────────────────────────

export async function getMonitors(): Promise<Monitor[]> {
  return request<Monitor[]>('/monitors');
}

export async function createMonitor(payload: CreateMonitorPayload): Promise<Monitor> {
  return request<Monitor>('/monitors', { method: 'POST', body: payload });
}

export async function updateMonitor(id: string, payload: UpdateMonitorPayload): Promise<Monitor> {
  return request<Monitor>(`/monitors/${id}`, { method: 'PATCH', body: payload });
}

// ── Alert Channels ────────────────────────────────────────────────────────────

export async function getAlertChannels(): Promise<AlertChannel[]> {
  return request<AlertChannel[]>('/alert-channels');
}

export async function createAlertChannel(
  payload: CreateAlertChannelPayload,
): Promise<AlertChannel> {
  return request<AlertChannel>('/alert-channels', { method: 'POST', body: payload });
}

export async function updateAlertChannel(
  id: string,
  payload: UpdateAlertChannelPayload,
): Promise<AlertChannel> {
  return request<AlertChannel>(`/alert-channels/${id}`, { method: 'PATCH', body: payload });
}

export async function deleteAlertChannel(id: string): Promise<void> {
  return request<void>(`/alert-channels/${id}`, { method: 'DELETE' });
}

export async function testAlertChannel(id: string): Promise<void> {
  return request<void>(`/alert-channels/${id}/test`, { method: 'POST' });
}

// ── Webhook ───────────────────────────────────────────────────────────────────

/**
 * Fires a synthetic test payload to a WEBHOOK channel.
 * Always returns a result object — never throws on delivery failures.
 * May throw on configuration errors (e.g. SSRF-blocked URL).
 */
export async function testWebhookChannel(id: string): Promise<WebhookTestResult> {
  return request<WebhookTestResult>(`/alert-channels/${id}/test-webhook`, { method: 'POST' });
}

/**
 * Returns recent webhook delivery log entries for a channel, newest first.
 */
export async function getWebhookLogs(
  id: string,
  limit = 10,
  offset = 0,
): Promise<WebhookDeliveryLog[]> {
  return request<WebhookDeliveryLog[]>(
    `/alert-channels/${id}/webhook-logs?limit=${limit}&offset=${offset}`,
  );
}
