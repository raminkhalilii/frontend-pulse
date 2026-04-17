// ── Phase 5: Per-monitor alert settings ──────────────────────────────────────

export interface MonitorAlertSettings {
  id: string
  monitorId: string
  /** Consecutive DOWN checks required before the first alert fires. */
  alertThreshold: number
  /** Consecutive failures required before escalation channels are also notified. */
  escalationThreshold: number
  /** Whether to send a RECOVERY notification when the monitor comes back UP. */
  alertOnRecovery: boolean
  quietHoursEnabled: boolean
  /** "HH:MM" UTC. Required when quietHoursEnabled is true. */
  quietHoursStart: string | null
  /** "HH:MM" UTC. Required when quietHoursEnabled is true. */
  quietHoursEnd: string | null
  /** Array of UTC day-of-week numbers [0–6] where 0 = Sunday. */
  quietHoursDays: number[]
  createdAt: string
  updatedAt: string
}

/** Response shape from GET /monitors/:id/alert-settings */
export interface AlertSettingsResponse {
  settings: MonitorAlertSettings | null
  /** Normal channels linked to this monitor (fire at alertThreshold). */
  channels: import('@/types').AlertChannel[]
  /** Escalation channels (only fire at escalationThreshold). */
  escalationChannels: import('@/types').AlertChannel[]
}

export interface SuppressedAlert {
  id: string
  monitorId: string
  type: 'DOWN' | 'RECOVERY'
  suppressedAt: string
  reason: string
  quietHoursEnd: string | null
}

export interface UpsertAlertSettingsPayload {
  alertThreshold: number
  escalationThreshold: number
  alertOnRecovery: boolean
  quietHoursEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  quietHoursDays: number[]
}

export interface SetChannelsPayload {
  channelIds: string[]
  escalationChannelIds: string[]
}

export interface SetChannelsResponse {
  success: boolean
  channelCount: number
}
