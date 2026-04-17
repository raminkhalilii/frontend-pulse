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

// Platform-specific display metadata stored in AlertChannel.platformMetadata.
// Not used for delivery — for UI identification only.
export interface SlackMetadata {
  workspaceName?: string;
  channelName?: string;
}

export interface DiscordMetadata {
  serverName?: string;
  channelName?: string;
}

export type PlatformMetadata = SlackMetadata | DiscordMetadata | null;

export interface AlertChannel {
  id: string;
  userId: string;
  type: AlertChannelType;
  value: string;
  label: string | null;
  enabled: boolean;
  /** True when a signing secret is configured on this channel. The secret
   *  itself is never returned by the API — only this boolean flag. */
  hasSecret?: boolean;
  /** Platform-specific display metadata (Slack workspace/channel, Discord server/channel). */
  platformMetadata?: PlatformMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertChannelPayload {
  type: AlertChannelType;
  value: string;
  label?: string;
  /** Optional HMAC-SHA256 signing secret (WEBHOOK channels only). */
  secret?: string;
  /** Optional platform display metadata (SLACK and DISCORD channels). */
  platformMetadata?: SlackMetadata | DiscordMetadata;
}

export interface UpdateAlertChannelPayload {
  enabled?: boolean;
  label?: string;
  /** Pass a new string to set/rotate the secret, null to remove it. */
  secret?: string | null;
  /** Pass new metadata to update, null to clear. */
  platformMetadata?: SlackMetadata | DiscordMetadata | null;
}

// ── Webhook ───────────────────────────────────────────────────────────────────

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
  responseTimeMs: number;
}

export interface WebhookDeliveryLog {
  id: string;
  alertChannelId: string;
  alertEventId: string;
  url: string;
  statusCode: number | null;
  responseTimeMs: number;
  success: boolean;
  errorMessage: string | null;
  attemptedAt: string;
}

// ── Platform test (Slack / Discord) ──────────────────────────────────────────

/** Result returned by POST /alert-channels/:id/test-slack and test-discord. */
export interface PlatformTestResult {
  success: boolean;
  error?: string;
}
