// ── Phase 11: Response Time Monitoring & History ─────────────────────────────

export type ResponseTimeRange = '24h' | '7d' | '30d'

export interface ResponseTimeBucket {
  /** Bucket start, ISO 8601 UTC. One raw heartbeat for 24h, one hour for 7d/30d. */
  timestamp: string
  avgMs: number
  minMs: number
  maxMs: number
}

export type ApdexRating = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unacceptable'

export interface ResponseTimeStats {
  sampleCount: number
  avgMs: number | null
  minMs: number | null
  maxMs: number | null
  p50Ms: number | null
  p95Ms: number | null
  p99Ms: number | null
  /** 0.000–1.000, or null when sampleCount is 0. */
  apdexScore: number | null
  apdexRating: ApdexRating | null
  apdexThresholdMs: number
}

export interface ResponseTimeResult {
  range: ResponseTimeRange
  series: ResponseTimeBucket[]
  stats: ResponseTimeStats
}
