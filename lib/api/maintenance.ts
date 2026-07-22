/**
 * API client for maintenance-window endpoints.
 *
 * Authenticated routes live at /api/monitors/:monitorId/maintenance/*
 */
import { getToken, removeToken } from '@/lib/auth';
import type { CreateMaintenanceWindowPayload, MaintenanceWindow } from '@/types/maintenance';

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

/** Lists maintenance windows for a monitor, newest first. */
export async function listMaintenanceWindows(monitorId: string): Promise<MaintenanceWindow[]> {
  return request<MaintenanceWindow[]>(`/monitors/${monitorId}/maintenance`);
}

/** Schedules a new maintenance window for a monitor. */
export async function createMaintenanceWindow(
  monitorId: string,
  payload: CreateMaintenanceWindowPayload,
): Promise<MaintenanceWindow> {
  return request<MaintenanceWindow>(`/monitors/${monitorId}/maintenance`, {
    method: 'POST',
    body: payload,
  });
}

/** Deletes a maintenance window. */
export async function deleteMaintenanceWindow(monitorId: string, windowId: string): Promise<void> {
  return request<void>(`/monitors/${monitorId}/maintenance/${windowId}`, {
    method: 'DELETE',
  });
}
