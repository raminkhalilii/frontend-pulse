export type MonitorFrequency = 'ONE_MIN' | 'FIVE_MIN' | 'THIRTY_MIN';
export type MonitorStatus = 'UP' | 'DOWN';

export interface HeartbeatEntry {
  status: MonitorStatus;
  latencyMs: number | null;
  timestamp: string;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  frequency: MonitorFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  latestStatus?: MonitorStatus;
  latestLatencyMs?: number | null;
  latestCheckedAt?: string;
  heartbeats?: HeartbeatEntry[];
}

export interface MonitorUpdatedPayload {
  monitorId: string;
  status: MonitorStatus;
  latencyMs: number | null;
  timestamp: string;
}

export interface CreateMonitorPayload {
  name: string;
  url: string;
  frequency: MonitorFrequency;
}

export interface UpdateMonitorPayload {
  name?: string;
  url?: string;
  frequency?: MonitorFrequency;
  isActive?: boolean;
}

export interface AuthResponse {
  accessToken: string;
}

// ── Alert Channels ────────────────────────────────────────────────────────────

export type AlertChannelType = 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'DISCORD';

export interface AlertChannel {
  id: string;
  userId: string;
  type: AlertChannelType;
  value: string;
  label: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertChannelPayload {
  type: AlertChannelType;
  value: string;
  label?: string;
}

export interface UpdateAlertChannelPayload {
  enabled?: boolean;
  label?: string;
}
