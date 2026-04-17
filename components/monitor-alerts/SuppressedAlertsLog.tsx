'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, ArrowUpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'
import { getSuppressedAlerts } from '@/lib/api'
import type { SuppressedAlert } from '@/types/alert-settings'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone:  'UTC',
    month:     'short',
    day:       'numeric',
    year:      'numeric',
    hour:      '2-digit',
    minute:    '2-digit',
    hour12:    false,
  }) + ' UTC'
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2 pt-2">
      {[80, 68, 76].map((w, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-t border-white/[0.04] first:border-t-0">
          <div className="h-3 w-16 rounded bg-white/[0.06]" />
          <div className={`h-3 w-${w === 80 ? '44' : w === 68 ? '36' : '40'} rounded bg-white/[0.04]`} />
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="h-3 w-16 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

function SuppressedTable({ records }: { records: SuppressedAlert[] }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-slate-500">No alerts have been suppressed for this monitor.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="pb-2 pr-4 text-left font-semibold uppercase tracking-[0.08em] text-slate-600">Type</th>
            <th className="pb-2 pr-4 text-left font-semibold uppercase tracking-[0.08em] text-slate-600">Suppressed At</th>
            <th className="pb-2 pr-4 text-left font-semibold uppercase tracking-[0.08em] text-slate-600">Reason</th>
            <th className="pb-2 text-left font-semibold uppercase tracking-[0.08em] text-slate-600">Resumed At</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-t border-white/[0.04]">
              <td className="py-2.5 pr-4">
                <span className={[
                  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium',
                  r.type === 'DOWN'
                    ? 'border-pulse-red/20 bg-pulse-red/10 text-pulse-red'
                    : 'border-pulse-green/20 bg-pulse-green/10 text-pulse-green',
                ].join(' ')}>
                  {r.type === 'DOWN' ? (
                    <AlertTriangle size={9} aria-hidden="true" />
                  ) : (
                    <ArrowUpCircle size={9} aria-hidden="true" />
                  )}
                  {r.type}
                </span>
              </td>
              <td className="py-2.5 pr-4 font-mono text-slate-400">
                {formatDate(r.suppressedAt)}
              </td>
              <td className="py-2.5 pr-4 capitalize text-slate-500">
                {r.reason.replace('_', ' ')}
              </td>
              <td className="py-2.5 font-mono text-slate-500">
                {r.quietHoursEnd ? `${r.quietHoursEnd} UTC` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SuppressedAlertsLogProps {
  monitorId: string
}

export function SuppressedAlertsLog({ monitorId }: SuppressedAlertsLogProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [records,    setRecords]    = useState<SuppressedAlert[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [loaded,     setLoaded]     = useState(false)

  async function handleExpand() {
    if (!isExpanded && !loaded) {
      setLoading(true)
      setError('')
      try {
        const data = await getSuppressedAlerts(monitorId)
        setRecords(data)
        setLoaded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load suppressed alerts.')
      } finally {
        setLoading(false)
      }
    }
    setIsExpanded((v) => !v)
  }

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">Suppressed Alerts</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Alerts that were silenced by quiet hours.
        </p>
      </div>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-white/[0.11] hover:bg-white/[0.04] hover:text-slate-200"
        aria-expanded={isExpanded}
      >
        <span>View suppressed alerts (last 30 days)</span>
        {isExpanded ? (
          <ChevronUp size={15} aria-hidden="true" />
        ) : (
          <ChevronDown size={15} aria-hidden="true" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="suppressed-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {loading ? (
                <TableSkeleton />
              ) : error ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-pulse-red">{error}</p>
                </div>
              ) : (
                <SuppressedTable records={records} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
