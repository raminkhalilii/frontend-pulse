'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Edit2 } from 'lucide-react'
import type { Monitor, MonitorStatus } from '@/types'
import GlassCard from '@/components/ui/GlassCard'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PingEntry {
  status: MonitorStatus
  latencyMs: number | null
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

const MAX_LATENCY_MS = 800

function barHeight(latencyMs: number | null): number {
  if (latencyMs === null) return 12
  return Math.max(6, Math.min(28, Math.round(6 + (latencyMs / MAX_LATENCY_MS) * 22)))
}

function Sparkline({ history }: { history: PingEntry[] }) {
  // Pad left with empty slots so bars always fill from the right
  const slots: (PingEntry | null)[] = [
    ...Array<null>(Math.max(0, 10 - history.length)).fill(null),
    ...history.slice(-10),
  ]

  return (
    <div className="flex items-end gap-[3px] h-8">
      {slots.map((entry, i) => (
        <div
          key={i}
          className="flex-1 rounded-[2px] transition-all duration-500"
          style={{
            height: entry ? `${barHeight(entry.latencyMs)}px` : '6px',
            backgroundColor:
              entry === null
                ? 'rgba(255,255,255,0.06)'
                : entry.status === 'UP'
                ? 'rgba(16,185,129,0.70)'
                : 'rgba(239,68,68,0.72)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface MonitorCardProps {
  monitor: Monitor
  history: PingEntry[]
  onEdit?: (monitor: Monitor) => void
}

export function MonitorCard({ monitor, history, onEdit }: MonitorCardProps) {
  const isDown    = monitor.latestStatus === 'DOWN'
  const isUp      = monitor.latestStatus === 'UP'
  const hasStatus = monitor.latestStatus !== undefined

  const uptimePct =
    history.length === 0
      ? null
      : ((history.filter((h) => h.status === 'UP').length / history.length) * 100).toFixed(2)

  const latency =
    monitor.latestLatencyMs != null ? `${monitor.latestLatencyMs}ms` : '—'

  return (
    <motion.div
      className="rounded-2xl"
      animate={
        isDown
          ? {
              boxShadow: [
                '0 0 0px rgba(239,68,68,0)',
                '0 0 20px rgba(239,68,68,0.32)',
                '0 0 0px rgba(239,68,68,0)',
              ],
            }
          : { boxShadow: '0 0 0px rgba(0,0,0,0)' }
      }
      transition={
        isDown
          ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.4 }
      }
    >
      <GlassCard
        hoverEffect={false}
        glowColor="none"
        className="flex flex-col gap-4 p-5"
        style={isDown ? { borderColor: 'rgba(239,68,68,0.28)' } : undefined}
      >
        {/* ── Top: name + status dot ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{monitor.name}</p>
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              title={monitor.url}
              className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-slate-500 transition-colors hover:text-pulse-blue"
            >
              <span className="truncate">{monitor.url}</span>
              <ExternalLink size={9} className="flex-none" />
            </a>
          </div>

          <div className="flex flex-none items-center gap-2">
            <button
              onClick={() => onEdit?.(monitor)}
              aria-label="Edit monitor"
              className="cursor-pointer text-slate-500 transition-colors hover:text-slate-300"
              title="Edit monitor"
            >
              <Edit2 size={14} />
            </button>
            {!hasStatus ? (
              <span className="font-mono text-[10px] text-slate-600">PENDING</span>
            ) : isUp ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-green opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pulse-green" />
                </span>
                <span className="font-mono text-[10px] font-semibold text-pulse-green">UP</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-red opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pulse-red" />
                </span>
                <span className="font-mono text-[10px] font-semibold text-pulse-red">DOWN</span>
              </>
            )}
          </div>
        </div>

        {/* ── Middle: sparkline ── */}
        <Sparkline history={history} />

        {/* ── Bottom: uptime + latency ── */}
        <div className="flex items-end justify-between border-t border-white/[0.05] pt-3">
          <div>
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-slate-600">
              Uptime
            </p>
            <p className="font-mono text-sm font-semibold text-white">
              {uptimePct !== null ? `${uptimePct}%` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-slate-600">
              Latency
            </p>
            <p
              className={`font-mono text-sm font-semibold ${
                isDown ? 'text-pulse-red' : 'text-white'
              }`}
            >
              {latency}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
