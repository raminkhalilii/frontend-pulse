// ── Enums ─────────────────────────────────────────────────────────────────────

export type IncidentStatus =
  | 'INVESTIGATING'
  | 'IDENTIFIED'
  | 'MONITORING'
  | 'RESOLVED';

export type IncidentImpact = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'NONE';

// ── Core models ───────────────────────────────────────────────────────────────

export interface IncidentUpdateEntry {
  id: string;
  message: string;
  status: IncidentStatus;
  createdAt: string;
}

export interface Incident {
  id: string;
  statusPageId: string;
  title: string;
  impact: IncidentImpact;
  status: IncidentStatus;
  /** true when automatically created by the alert engine on a DOWN event */
  autoCreated: boolean;
  alertEventId: string | null;
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  updates: IncidentUpdateEntry[];
  affectedMonitorIds: string[];
}

// ── API payloads ──────────────────────────────────────────────────────────────

export interface CreateIncidentPayload {
  title: string;
  impact?: IncidentImpact;
  status?: IncidentStatus;
  /** Body of the first IncidentUpdate posted alongside the incident */
  message?: string;
  monitorIds?: string[];
}

export interface UpdateIncidentPayload {
  title?: string;
  impact?: IncidentImpact;
  status?: IncidentStatus;
}

export interface PostIncidentUpdatePayload {
  message: string;
  status: IncidentStatus;
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const IMPACT_LABEL: Record<IncidentImpact, string> = {
  CRITICAL: 'Critical',
  MAJOR: 'Major',
  MINOR: 'Minor',
  NONE: 'Informational',
};

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  INVESTIGATING: 'Investigating',
  IDENTIFIED: 'Identified',
  MONITORING: 'Monitoring',
  RESOLVED: 'Resolved',
};

/** Tailwind classes for impact badges — light theme (public status page) */
export const IMPACT_BADGE_LIGHT: Record<IncidentImpact, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border border-red-200',
  MAJOR:    'bg-orange-100 text-orange-700 border border-orange-200',
  MINOR:    'bg-yellow-100 text-yellow-700 border border-yellow-200',
  NONE:     'bg-blue-100 text-blue-700 border border-blue-200',
};

/** Tailwind classes for impact badges — dark theme (dashboard) */
export const IMPACT_BADGE_DARK: Record<IncidentImpact, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border border-red-500/20',
  MAJOR:    'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  MINOR:    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  NONE:     'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

/** Left-border colour for affected monitor row highlight */
export const IMPACT_BORDER_COLOR: Record<IncidentImpact, string> = {
  CRITICAL: '#ef4444',
  MAJOR:    '#f97316',
  MINOR:    '#eab308',
  NONE:     '#3b82f6',
};

/** Tailwind classes for status badges — light theme */
export const STATUS_BADGE_LIGHT: Record<IncidentStatus, string> = {
  INVESTIGATING: 'bg-red-100 text-red-700',
  IDENTIFIED:    'bg-orange-100 text-orange-700',
  MONITORING:    'bg-blue-100 text-blue-700',
  RESOLVED:      'bg-green-100 text-green-700',
};

/** Tailwind classes for status badges — dark theme */
export const STATUS_BADGE_DARK: Record<IncidentStatus, string> = {
  INVESTIGATING: 'bg-red-500/10 text-red-400',
  IDENTIFIED:    'bg-orange-500/10 text-orange-400',
  MONITORING:    'bg-blue-500/10 text-blue-400',
  RESOLVED:      'bg-emerald-500/10 text-emerald-400',
};
