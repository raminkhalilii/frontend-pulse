import type {
  ApiConfig,
  HeartbeatConfig,
  KeywordConfig,
  Monitor,
  PingConfig,
  TcpConfig,
} from '@/types'

/** Casts `monitor.config` to the shape matching `monitor.type`, or null if it doesn't match / is absent. */
export function asKeywordConfig(monitor: Monitor): KeywordConfig | null {
  return monitor.type === 'KEYWORD' ? (monitor.config as KeywordConfig) : null
}

export function asTcpConfig(monitor: Monitor): TcpConfig | null {
  return monitor.type === 'TCP' ? (monitor.config as TcpConfig) : null
}

export function asPingConfig(monitor: Monitor): PingConfig | null {
  return monitor.type === 'PING' ? (monitor.config as PingConfig) : null
}

export function asHeartbeatConfig(monitor: Monitor): HeartbeatConfig | null {
  return monitor.type === 'HEARTBEAT' ? (monitor.config as HeartbeatConfig) : null
}

export function asApiConfig(monitor: Monitor): ApiConfig | null {
  return monitor.type === 'API' ? (monitor.config as ApiConfig) : null
}
