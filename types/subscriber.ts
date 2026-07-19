// ── Subscriber types ───────────────────────────────────────────────────────────

/** Aggregate counts returned by GET /api/status-page/subscribers/stats */
export interface SubscriberStats {
  total: number;
  confirmed: number;
  unsubscribed: number;
  pending: number;
}

/**
 * A single confirmed subscriber row as returned by
 * GET /api/status-page/subscribers.
 * The email is always masked (e.g. "j***@example.com").
 */
export interface SubscriberListItem {
  id: string;
  /** Masked email — e.g. "j***@example.com". The full address is never returned. */
  email: string;
  isConfirmed: boolean;
  confirmedAt: string | null;
  createdAt: string;
}

/** Paginated list response from GET /api/status-page/subscribers */
export interface SubscriberListResponse {
  items: SubscriberListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Public subscription details returned by
 * GET /api/status/:slug/manage?token=xxx.
 * The email is masked so the token cannot be used to deanonymise subscribers.
 */
export interface ManagedSubscriber {
  id: string;
  /** Masked email — e.g. "j***@example.com" */
  email: string;
  isConfirmed: boolean;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  statusPageTitle: string;
  statusPageSlug: string;
  createdAt: string;
}
