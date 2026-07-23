// ── Monitor types (Phase 12: Advanced Monitor Types) ──────────────────────────

export type MonitorType = 'HTTP' | 'KEYWORD' | 'TCP' | 'PING' | 'HEARTBEAT' | 'API';

export type KeywordMatchMode = 'MUST_CONTAIN' | 'MUST_NOT_CONTAIN';

export interface KeywordConfig {
  keyword: string;
  mode: KeywordMatchMode;
  caseSensitive?: boolean;
}

export interface TcpConfig {
  host: string;
  port: number;
}

export interface PingConfig {
  host: string;
}

export interface HeartbeatConfig {
  /** How often the external cron job is expected to ping, in seconds. */
  periodSeconds: number;
  /** Extra time allowed past periodSeconds before the monitor is marked DOWN. */
  graceSeconds: number;
}

export type ApiHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type ApiAssertionType = 'STATUS_CODE' | 'RESPONSE_TIME' | 'JSON_BODY' | 'HEADER';

export interface ApiAssertion {
  type: ApiAssertionType;
  /** STATUS_CODE only. */
  expectedStatusCode?: number;
  /** RESPONSE_TIME only. */
  maxResponseTimeMs?: number;
  /** JSON_BODY only — dotted path, e.g. "data.items.0.status". */
  jsonPath?: string;
  /** HEADER only. */
  headerName?: string;
  /** JSON_BODY and HEADER. */
  expectedValue?: string;
}

export interface ApiConfig {
  method: ApiHttpMethod;
  headers?: Record<string, string>;
  body?: string;
  assertions: ApiAssertion[];
}

/**
 * Discriminated per-type config carried on a monitor CREATE/UPDATE payload —
 * matches the backend DTO's shape (one named field per type, exactly one
 * populated based on `type`). This is NOT the shape a monitor is returned
 * in — see `MonitorConfig` below for that.
 */
export interface MonitorTypeConfigFields {
  keywordConfig?: KeywordConfig;
  tcpConfig?: TcpConfig;
  pingConfig?: PingConfig;
  heartbeatConfig?: HeartbeatConfig;
  apiConfig?: ApiConfig;
}

/**
 * The shape `Monitor.config` actually comes back as from GET /monitors — a
 * single JSON blob (mirrors the Prisma `config Json?` column), null for
 * HTTP. Cast it to the specific type based on `Monitor.type` when reading.
 */
export type MonitorConfig = KeywordConfig | TcpConfig | PingConfig | HeartbeatConfig | ApiConfig;

export const MONITOR_TYPE_LABELS: Record<MonitorType, string> = {
  HTTP: 'HTTP(S)',
  KEYWORD: 'Keyword',
  TCP: 'TCP Port',
  PING: 'Ping (ICMP)',
  HEARTBEAT: 'Heartbeat (Cron)',
  API: 'API Assertions',
};

/** Types that check a URL and therefore show the url field in forms/cards. */
export const URL_BASED_MONITOR_TYPES: MonitorType[] = ['HTTP', 'KEYWORD', 'API'];
