export type MonitorFrequency = 'ONE_MIN' | 'FIVE_MIN' | 'THIRTY_MIN';
export type MonitorStatus = 'UP' | 'DOWN';

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

export interface AuthResponse {
  accessToken: string;
}
