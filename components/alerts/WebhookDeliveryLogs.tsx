'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { getWebhookLogs } from '@/lib/api'
import type { WebhookDeliveryLog } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function formatCode(code: number | null): string {
  if (code === null || code === 0) return '—'
  return String(code)
}

// ─── Log skeleton ─────────────────────────────────────────────────────────────

function LogSkeleton() {
  return (
    <div className="animate-pulse space-y-2 pt-2">
      {[80, 60, 72].map((w, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div className="h-3.5 w-3.5 flex-none rounded-full bg-white/[0.06]" />
          <div className="h-2.5 w-8 rounded bg-white/[0.06]" />
          <div className="h-2.5 w-12 rounded bg-white/[0.06]" />
          <div className={`ml-auto h-2.5 w-${w === 80 ? 16 : w === 60 ? 12 : 14} rounded bg-white/[0.04]`} />
        </div>
      ))}
    </div>
  )
}

// ─── Log entry row ────────────────────────────────────────────────────────────

function LogEntry({ log }: { log: WebhookDeliveryLog }) {
  const full = new Date(log.attemptedAt).toISOString()

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {/* Status icon */}
      {log.success ? (
        <CheckCircle
          size={13}
          className="flex-none text-pulse-green"
          aria-label="Success"
        />
      ) : (
        <XCircle
          size={13}
          className="flex-none text-pulse-red"
          aria-label="Failed"
        />
      )}

      {/* HTTP code */}
      <span
        className={[
          'w-8 flex-none font-mono text-[11px] font-medium',
          log.success ? 'text-pulse-green' : 'text-pulse-red',
        ].join(' ')}
      >
        {formatCode(log.statusCode)}
      </span>

      {/* Response time */}
      <span className="w-14 flex-none text-[11px] text-slate-500">
        {log.responseTimeMs}ms
      </span>

      {/* Error message (truncated) */}
      {!log.success && log.errorMessage && (
        <span
          className="hidden min-w-0 flex-1 truncate text-[11px] text-slate-600 sm:block"
          title={log.errorMessage}
        >
          {log.errorMessage}
        </span>
      )}

      {/* Time (relative, full ISO in tooltip) */}
      <span
        className="ml-auto flex-none text-[11px] text-slate-600"
        title={full}
      >
        {timeAgo(log.attemptedAt)}
      </span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WebhookDeliveryLogsProps {
  channelId: string
}

export function WebhookDeliveryLogs({ channelId }: WebhookDeliveryLogsProps) {
  const [expanded, setExpanded] = useState(false)
  const [logs,     setLogs]     = useState<WebhookDeliveryLog[] | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function fetchLogs() {
    setLoading(true)
    setError('')
    try {
      const data = await getWebhookLogs(channelId, 10)
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delivery logs.')
    } finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    // Fetch lazily on first open; subsequent opens reuse cached data
    if (next && logs === null) {
      void fetchLogs()
    }
  }

  function handleRefresh(e: React.MouseEvent) {
    e.stopPropagation()
    void fetchLogs()
  }

  return (
    <div className="mt-2">
      {/* Expand / collapse trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex cursor-pointer items-center gap-1 text-[11px] text-slate-600 transition-colors hover:text-slate-400"
      >
        {expanded ? (
          <ChevronDown size={11} aria-hidden="true" />
        ) : (
          <ChevronRight size={11} aria-hidden="true" />
        )}
        {expanded ? 'Hide delivery logs' : 'View delivery logs'}
      </button>

      {/* Expandable panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="logs-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              {/* Header row */}
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex gap-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Status
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Code
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Time
                  </span>
                </div>
                {/* Refresh button */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh delivery logs"
                  className="cursor-pointer text-slate-600 transition-colors hover:text-slate-400 disabled:pointer-events-none disabled:opacity-40"
                >
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                </button>
              </div>

              {/* Content */}
              {loading && logs === null ? (
                <LogSkeleton />
              ) : error ? (
                <p className="py-2 text-[11px] text-pulse-red">{error}</p>
              ) : logs !== null && logs.length === 0 ? (
                <p className="py-2 text-[11px] text-slate-600">
                  No deliveries yet. Test your webhook above.
                </p>
              ) : logs !== null ? (
                <div className="divide-y divide-white/[0.04]">
                  {logs.map((log) => (
                    <LogEntry key={log.id} log={log} />
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
