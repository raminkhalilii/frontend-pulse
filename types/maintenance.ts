// ── Core model ────────────────────────────────────────────────────────────────

export interface MaintenanceWindow {
  id: string;
  monitorId: string;
  title: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── API payloads ──────────────────────────────────────────────────────────────

export interface CreateMaintenanceWindowPayload {
  title?: string;
  /** UTC ISO-8601 */
  startsAt: string;
  /** UTC ISO-8601 */
  endsAt: string;
}
