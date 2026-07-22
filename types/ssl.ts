// ── Core model ────────────────────────────────────────────────────────────────

export interface SslCertificate {
  id: string;
  monitorId: string;
  issuer: string | null;
  subject: string | null;
  /** UTC ISO-8601 */
  validFrom: string | null;
  /** UTC ISO-8601 */
  validTo: string | null;
  isValid: boolean;
  lastError: string | null;
  invalidAlertSent: boolean;
  /** UTC ISO-8601 */
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
  /** Computed server-side from validTo; null when validTo is unknown (e.g. connection failed). */
  daysRemaining: number | null;
}
