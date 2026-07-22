// ── Status Page types ─────────────────────────────────────────────────────────

export type SystemStatusLabel =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage';

export interface SystemStatus {
  status: SystemStatusLabel;
  affectedMonitors: number;
  totalMonitors: number;
}

export interface DailyUptimeSummary {
  /** Calendar date in UTC: "YYYY-MM-DD" */
  date: string;
  /** 0–100, or null if no heartbeats were recorded that day */
  uptimePercentage: number | null;
  totalChecks: number;
  downChecks: number;
  avgResponseTimeMs: number | null;
  hadOutage: boolean;
}

export type PublicMonitorStatus = 'UP' | 'DOWN' | 'UNKNOWN' | 'MAINTENANCE';

export interface StatusPageMonitorData {
  id: string;
  displayName: string;
  /** Internal URL is intentionally excluded from the public payload */
  currentStatus: PublicMonitorStatus;
  uptimePercentage: number | null;
  dailySummary: DailyUptimeSummary[];
  lastCheckedAt: string | null;
  avgResponseTimeMs: number | null;
  showResponseTime: boolean;
  /** Set only when currentStatus === 'MAINTENANCE'. */
  maintenanceTitle: string | null;
  maintenanceEndsAt: string | null;
}

export type UptimePeriodDays = 30 | 60 | 90;

export interface StatusPageSettings {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description: string | null;
  logoUrl: string | null;
  customDomain: string | null;
  isPublic: boolean;
  showUptimePercentage: boolean;
  showResponseTime: boolean;
  uptimePeriodDays: UptimePeriodDays;
  createdAt: string;
  updatedAt: string;
}

export interface StatusPageData {
  statusPage: StatusPageSettings;
  overallStatus: SystemStatus;
  monitors: StatusPageMonitorData[];
  /** Incidents currently in progress (status ≠ RESOLVED). */
  activeIncidents: import('./incident').Incident[];
  /** Incidents resolved within the last 14 days. */
  recentIncidents: import('./incident').Incident[];
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface UpdateStatusPagePayload {
  title?: string;
  description?: string | null;
  logoUrl?: string | null;
  isPublic?: boolean;
  showUptimePercentage?: boolean;
  showResponseTime?: boolean;
  uptimePeriodDays?: UptimePeriodDays;
  slug?: string;
}

export interface StatusPageMonitorItem {
  monitorId: string;
  displayName?: string;
  showResponseTime?: boolean;
  position: number;
}

export interface SetStatusPageMonitorsPayload {
  monitors: StatusPageMonitorItem[];
}

export interface ReorderStatusPageMonitorsPayload {
  orderedMonitorIds: string[];
}

// ── Dashboard state helpers ───────────────────────────────────────────────────

/** A monitor row in the visibility editor. Combines Monitor data with status page config. */
export interface MonitorVisibilityRow {
  monitorId: string;
  name: string;
  /** current live status from Monitor.latestStatus */
  liveStatus: 'UP' | 'DOWN' | 'MAINTENANCE' | undefined;
  /** whether this monitor is included on the status page */
  included: boolean;
  /** optional public display name override */
  displayName: string;
  /** per-monitor show response time override */
  showResponseTime: boolean;
  /** display order position */
  position: number;
}
