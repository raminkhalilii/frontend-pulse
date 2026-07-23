'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, HeartPulse } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { asHeartbeatConfig } from '@/lib/monitor-config'
import type { Monitor } from '@/types'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

interface HeartbeatIngestSectionProps {
  monitor: Monitor
  /** Re-rendered every second by the parent page so relative times/countdown stay live. */
  now: Date
}

export function HeartbeatIngestSection({ monitor, now }: HeartbeatIngestSectionProps) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const config = asHeartbeatConfig(monitor)
  const ingestUrl = monitor.heartbeatToken ? `${origin}/api/heartbeat/${monitor.heartbeatToken}` : ''

  const lastPingAt = monitor.lastHeartbeatAt ? new Date(monitor.lastHeartbeatAt) : null
  const deadline =
    config && lastPingAt
      ? new Date(lastPingAt.getTime() + (config.periodSeconds + config.graceSeconds) * 1000)
      : config
        ? new Date(new Date(monitor.createdAt).getTime() + (config.periodSeconds + config.graceSeconds) * 1000)
        : null

  const msUntilDue = deadline ? deadline.getTime() - now.getTime() : null
  const isOverdue = msUntilDue !== null && msUntilDue <= 0

  async function handleCopy() {
    if (!ingestUrl) return
    await navigator.clipboard.writeText(ingestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <HeartPulse size={16} className="text-pulse-blue" aria-hidden="true" />
          <h2 className="text-base font-semibold text-white">Ingest URL</h2>
        </div>
        <p className="mb-3 text-sm text-slate-500">
          Have your cron job hit this URL after each successful run (GET or POST both work). No
          authentication needed — the token itself is the secret, so keep it private.
        </p>

        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-300">
            {ingestUrl || 'Loading…'}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!ingestUrl}
            aria-label="Copy ingest URL"
            className="flex-none cursor-pointer text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-50"
          >
            {copied ? <Check size={14} className="text-pulse-green" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Curl example
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2.5 font-mono text-xs text-slate-400">
            {`curl "${ingestUrl || '<ingest-url>'}"`}
          </pre>
        </div>
      </GlassCard>

      <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Status</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-slate-600">Last ping received</dt>
            <dd className="mt-0.5 font-mono text-sm text-slate-200">{formatDate(monitor.lastHeartbeatAt)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-slate-600">
              {isOverdue ? 'Overdue by' : 'Next ping due in'}
            </dt>
            <dd
              className={`mt-0.5 font-mono text-sm font-semibold ${
                isOverdue ? 'text-pulse-red' : 'text-slate-200'
              }`}
            >
              {msUntilDue === null ? '—' : formatDuration(Math.abs(msUntilDue))}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-slate-600">Expected every</dt>
            <dd className="mt-0.5 font-mono text-sm text-slate-200">
              {config ? `${config.periodSeconds}s` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-slate-600">Grace period</dt>
            <dd className="mt-0.5 font-mono text-sm text-slate-200">
              {config ? `${config.graceSeconds}s` : '—'}
            </dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  )
}
