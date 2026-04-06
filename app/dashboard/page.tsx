'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MonitorCard, type PingEntry } from '@/components/monitors/MonitorCard'
import { NewMonitorModal } from '@/components/monitors/NewMonitorModal'
import Button from '@/components/ui/Button'
import { getMonitors } from '@/lib/api'
import { usePulseSocket } from '@/hooks/usePulseSocket'
import type { Monitor, MonitorUpdatedPayload } from '@/types'

// ─── History map helpers ──────────────────────────────────────────────────────

type HistoryMap = Record<string, PingEntry[]>
const MAX_HISTORY = 10

function buildInitialHistory(monitors: Monitor[]): HistoryMap {
  return Object.fromEntries(
    monitors.map((m) => [
      m.id,
      m.heartbeats?.length
        ? m.heartbeats.map((h) => ({ status: h.status, latencyMs: h.latencyMs }))
        : m.latestStatus
          ? [{ status: m.latestStatus, latencyMs: m.latestLatencyMs ?? null }]
          : [],
    ])
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [monitors,   setMonitors]   = useState<Monitor[]>([])
  const [historyMap, setHistoryMap] = useState<HistoryMap>({})
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [modalOpen,  setModalOpen]  = useState(false)

  const fetchMonitors = useCallback(async () => {
    try {
      const data = await getMonitors()
      setMonitors(data)
      setHistoryMap(buildInitialHistory(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitors.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleMonitorUpdated = useCallback((payload: MonitorUpdatedPayload) => {
    setMonitors((prev) =>
      prev.map((m) =>
        m.id === payload.monitorId
          ? {
              ...m,
              latestStatus:    payload.status,
              latestLatencyMs: payload.latencyMs,
              latestCheckedAt: payload.timestamp,
            }
          : m
      )
    )
    setHistoryMap((prev) => {
      const existing = prev[payload.monitorId] ?? []
      const updated  = [
        ...existing,
        { status: payload.status, latencyMs: payload.latencyMs },
      ].slice(-MAX_HISTORY)
      return { ...prev, [payload.monitorId]: updated }
    })
  }, [])

  usePulseSocket({ onMonitorUpdated: handleMonitorUpdated, enabled: !loading })

  useEffect(() => {
    fetchMonitors()
  }, [fetchMonitors])

  function handleMonitorCreated(monitor: Monitor) {
    setMonitors((prev) => [monitor, ...prev])
    setHistoryMap((prev) => ({ ...prev, [monitor.id]: [] }))
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

        {/* ── Page header ── */}
        <div className="mb-5 flex items-center justify-between gap-3 sm:mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">Monitors</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {loading
                ? 'Loading…'
                : `${monitors.length} monitor${monitors.length !== 1 ? 's' : ''} tracked`}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={15} />}
            onClick={() => setModalOpen(true)}
          >
            New Monitor
          </Button>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchMonitors} />
        ) : monitors.length === 0 ? (
          <EmptyState onAdd={() => setModalOpen(true)} />
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden:  {},
              visible: { transition: { staggerChildren: 0.07 } },
            }}
          >
            {monitors.map((monitor) => (
              <motion.div
                key={monitor.id}
                variants={{
                  hidden:  { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
              >
                <MonitorCard
                  monitor={monitor}
                  history={historyMap[monitor.id] ?? []}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <NewMonitorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleMonitorCreated}
      />
    </DashboardLayout>
  )
}

// ─── Supporting views ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-white/[0.06]" />
              <div className="h-3 w-40 rounded bg-white/[0.04]" />
            </div>
            <div className="h-3 w-10 rounded bg-white/[0.06]" />
          </div>
          <div className="mb-4 flex items-end gap-[3px] h-8">
            {Array.from({ length: 10 }).map((_, j) => (
              <div
                key={j}
                className="flex-1 rounded-[2px] bg-white/[0.06]"
                style={{ height: `${8 + ((j * 7 + i * 3) % 18)}px` }}
              />
            ))}
          </div>
          <div className="flex items-end justify-between border-t border-white/[0.05] pt-3">
            <div className="space-y-1.5">
              <div className="h-2.5 w-12 rounded bg-white/[0.04]" />
              <div className="h-4 w-16 rounded bg-white/[0.06]" />
            </div>
            <div className="flex flex-col items-end space-y-1.5">
              <div className="h-2.5 w-12 rounded bg-white/[0.04]" />
              <div className="h-4 w-14 rounded bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="mb-4 text-sm text-pulse-red">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
        <svg
          className="h-7 w-7 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <p className="mb-1.5 font-semibold text-white">No monitors yet</p>
      <p className="mb-6 max-w-xs text-sm text-slate-500">
        Add your first monitor to start tracking uptime in real time.
      </p>
      <Button
        variant="primary"
        size="md"
        leftIcon={<Plus size={15} />}
        onClick={onAdd}
      >
        Add your first monitor
      </Button>
    </div>
  )
}
