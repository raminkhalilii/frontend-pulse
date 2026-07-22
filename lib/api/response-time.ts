/**
 * API client for response-time endpoints.
 *
 * Authenticated route lives at /api/monitors/:monitorId/response-time
 */
import { getToken, removeToken } from '@/lib/auth'
import type { ResponseTimeRange, ResponseTimeResult } from '@/types/response-time'

const API_BASE = '/api'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers: extraHeaders, signal, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  }

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    signal,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth !== false) {
    removeToken()
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null)
    const message =
      (payload as { message?: string | string[] } | null)?.message ??
      `Request failed: ${res.status}`
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }

  return res.json() as Promise<T>
}

/** Gets the latency series + percentile/Apdex stats for a monitor over the given range. */
export async function getResponseTime(
  monitorId: string,
  range: ResponseTimeRange,
): Promise<ResponseTimeResult> {
  return request<ResponseTimeResult>(`/monitors/${monitorId}/response-time?range=${range}`)
}
